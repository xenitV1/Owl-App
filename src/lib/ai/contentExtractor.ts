import { JSDOM } from 'jsdom';

export type StructuredContentItem =
  | { type: 'heading'; level?: number; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'list'; content: string; items: string[] }
  | { type: 'quote'; content: string }
  | { type: 'image'; content: string; src?: string; alt?: string };

export interface ExtractedArticle {
  url?: string;
  title: string;
  contentText: string;
  contentHtml?: string;
  excerpt: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  image?: string;
  siteName?: string;
  structuredContent?: StructuredContentItem[];
}

export interface ExtractOptions {
  url?: string;
  minTextLength?: number;
}

const DEFAULTS: Required<Pick<ExtractOptions, 'minTextLength'>> = {
  minTextLength: 500,
};

function scoreElementForArticle(element: Element): number {
  const text = (element.textContent || '').trim();
  if (!text) return 0;

  const lengthScore = Math.min(text.length, 8000); // cap overly long
  const pCount = element.querySelectorAll('p').length;
  const headingCount = element.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
  const linkTexts = Array.from(element.querySelectorAll('a')).map(a => a.textContent || '');
  const linkTextLength = linkTexts.reduce((s, t) => s + t.length, 0);
  const linkDensity = text.length > 0 ? linkTextLength / text.length : 1;

  // Sentence/word features
  const sentences = text.split(/[.!?]+\s/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(Boolean);
  const avgSentenceLength = sentences.length ? words.length / sentences.length : 0;

  // Penalize navigation-like blocks
  const listCount = element.querySelectorAll('ul, ol').length;
  const codeCount = element.querySelectorAll('pre, code').length;

  // Heuristic: article blocks have medium link density, enough paragraphs, meaningful headings, and coherent sentences
  let score = 0;
  score += lengthScore;
  score += pCount * 120;
  score += headingCount * 60;

  // Prefer average sentence length in [12, 35]
  if (avgSentenceLength >= 12 && avgSentenceLength <= 35) {
    score *= 1.15;
  }

  // Penalize high link density and excessive lists/codes
  if (linkDensity > 0.4) score *= 0.6;
  if (listCount > 6) score *= 0.8;
  if (codeCount > 2) score *= 0.85;

  return score;
}

function pickMainContainer(doc: Document): Element {
  const candidates: Element[] = [];
  const selectors = [
    'article',
    '[role="main"]',
    'main',
    '.content',
    '.post-content',
    '.entry-content',
    '.article-content',
    '#content',
    '#main',
  ];

  for (const sel of selectors) {
    doc.querySelectorAll(sel).forEach(el => candidates.push(el));
  }

  if (candidates.length === 0) {
    doc.querySelectorAll('section, div').forEach(el => candidates.push(el));
  }

  const scored = candidates.map(el => ({ el, score: scoreElementForArticle(el) }));
  scored.sort((a, b) => b.score - a.score);
  return (scored[0]?.el as Element) || doc.body;
}

function extractMeta(doc: Document, url?: string) {
  const title =
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc.querySelector('title')?.textContent?.trim() ||
    doc.querySelector('h1')?.textContent?.trim() ||
    'Untitled';

  const author =
    doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
    doc.querySelector('meta[property="article:author"]')?.getAttribute('content') ||
    undefined;

  const publishedTime =
    doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
    doc.querySelector('time[datetime]')?.getAttribute('datetime') ||
    undefined;

  const modifiedTime =
    doc.querySelector('meta[property="article:modified_time"]')?.getAttribute('content') ||
    undefined;

  const image =
    doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
    (doc.querySelector('article img') as HTMLImageElement | null)?.src ||
    undefined;

  const siteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || (url ? new URL(url).hostname : undefined);

  return { title, author, publishedTime, modifiedTime, image, siteName };
}

function cleanNonContent(el: Element) {
  const removeSelectors = [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    'aside',
    '.ad',
    '.advertisement',
    '.sidebar',
    '.breadcrumbs',
    '.newsletter',
    '.social',
    '.share',
    '.related',
    '.comments',
  ];
  removeSelectors.forEach(s => el.querySelectorAll(s).forEach(n => n.remove()));
}

function structureFromContainer(container: Element): StructuredContentItem[] {
  const result: StructuredContentItem[] = [];

  // Headings
  container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
    const text = h.textContent?.trim();
    if (text && text.length > 5) {
      const level = parseInt(h.tagName.substring(1));
      result.push({ type: 'heading', level, content: text });
    }
  });

  // Paragraphs
  container.querySelectorAll('p').forEach(p => {
    const text = p.textContent?.trim();
    if (text && text.length > 20) {
      result.push({ type: 'paragraph', content: text });
    }
  });

  // Lists
  container.querySelectorAll('ul, ol').forEach(list => {
    const items = Array.from(list.querySelectorAll('li'))
      .map(li => li.textContent?.trim())
      .filter((t): t is string => !!t && t.length > 0);
    if (items.length > 0) {
      result.push({ type: 'list', content: '', items });
    }
  });

  // Quotes
  container.querySelectorAll('blockquote').forEach(q => {
    const text = q.textContent?.trim();
    if (text && text.length > 10) {
      result.push({ type: 'quote', content: text });
    }
  });

  // Images
  container.querySelectorAll('img').forEach(img => {
    const el = img as HTMLImageElement;
    const src = el.src || el.getAttribute('data-src') || el.getAttribute('data-lazy-src') || undefined;
    const alt = el.alt || '';
    if (!src) return;

    const srcLower = src.toLowerCase();
    const classId = `${el.getAttribute('class') || ''} ${el.getAttribute('id') || ''}`.toLowerCase();

    // Skip data URLs that look like pixels/placeholders
    if (srcLower.startsWith('data:') && src.length < 1200) return;

    // Skip common non-content patterns (logos, icons, banners, ads, social, tracking)
    const badSrcPatterns = [
      'placeholder', 'spacer', 'pixel', 'sprite', 'icon', 'favicon', 'logo', 'banner', 'ad-', '/ads/',
      'share', 'social', 'pinterest', 'pinimg', 'kaydet', 'tracking', 'analytics', 'avatar', 'gravatar', 'badge',
      '/animation', '/animations', '.gif'
    ];
    if (badSrcPatterns.some(p => srcLower.includes(p))) return;
    // Skip SVGs (often icons/illustrations/animated vectors)
    if (/\.svg(\?|$)/i.test(srcLower)) return;
    const badClassIdPatterns = [
      'logo', 'icon', 'sprite', 'banner', 'ad', 'social', 'share', 'header', 'footer', 'nav', 'toolbar'
    ];
    if (badClassIdPatterns.some(p => classId.includes(p))) return;

    // Dimension-based filtering (attributes only; JSDOM doesn't resolve natural sizes)
    const widthAttr = parseInt(el.getAttribute('width') || '0', 10);
    const heightAttr = parseInt(el.getAttribute('height') || '0', 10);
    if ((widthAttr && widthAttr < 80) || (heightAttr && heightAttr < 80)) return;
    if (widthAttr && heightAttr) {
      const area = widthAttr * heightAttr;
      if (area > 0 && area < 8000) return; // tiny sprites
      const ratio = widthAttr / heightAttr;
      if (ratio > 3.5 || ratio < 0.25) return; // extreme aspect ratios (likely bars/ads)
    }

    result.push({ type: 'image', content: alt, src, alt });
  });

  return result;
}

function toPlainText(items: StructuredContentItem[], minLen: number): string {
  const text = items
    .map(i => {
      switch (i.type) {
        case 'heading':
          return `${'#'.repeat(Math.min(6, i.level || 1))} ${i.content}`;
        case 'paragraph':
          return i.content;
        case 'list':
          return i.items.map(li => `• ${li}`).join('\n');
        case 'quote':
          return `> ${i.content}`;
        case 'image':
          // Do not pollute plain text with image placeholders
          return '';
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n\n')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length >= minLen) return text;
  return (items.find(i => i.type === 'paragraph') as any)?.content || '';
}

export function extractArticleFromHtml(html: string, options: ExtractOptions = {}): ExtractedArticle {
  const { url, minTextLength } = { ...DEFAULTS, ...options };
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  cleanNonContent(doc.body);

  const meta = extractMeta(doc, url);
  const container = pickMainContainer(doc);
  cleanNonContent(container);

  const structured = structureFromContainer(container);
  const contentText = toPlainText(structured, minTextLength);

  // Excerpt: sentence-aware trim ~200 chars
  let excerpt = '';
  if (contentText.length > 200) {
    const truncated = contentText.substring(0, 200);
    const end = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('!'), truncated.lastIndexOf('?'));
    excerpt = end > 100 ? contentText.substring(0, end + 1) : truncated + '...';
  } else {
    excerpt = contentText;
  }

  return {
    url,
    title: meta.title,
    contentText,
    contentHtml: container.innerHTML.trim(),
    excerpt,
    author: meta.author,
    publishedTime: meta.publishedTime,
    modifiedTime: meta.modifiedTime,
    image: meta.image,
    siteName: meta.siteName,
    structuredContent: structured.length > 0 ? structured : undefined,
  };
}


