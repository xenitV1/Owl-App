import { NextRequest } from 'next/server';
import { JSDOM } from 'jsdom';

export const dynamic = 'force-dynamic';

interface WebContent {
  url: string;
  title: string;
  content: string;
  excerpt: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  image?: string;
  siteName?: string;
  structuredContent?: StructuredContentItem[];
}

interface StructuredContentItem {
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'image';
  level?: number; // for headings (1-6)
  content: string;
  items?: string[]; // for lists
  src?: string; // for images
  alt?: string; // for images
}

function extractWebContent(url: string, html: string): WebContent {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Remove script and style elements
  doc.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar').forEach(el => el.remove());

  // Extract title
  const title = doc.querySelector('title')?.textContent?.trim() ||
                doc.querySelector('h1')?.textContent?.trim() ||
                doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                'Untitled';

  // Extract meta information
  const author = doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
                 doc.querySelector('meta[property="article:author"]')?.getAttribute('content') ||
                 doc.querySelector('[rel="author"]')?.textContent?.trim();

  const publishedTime = doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                       doc.querySelector('time[datetime]')?.getAttribute('datetime') ||
                       doc.querySelector('meta[name="publishdate"]')?.getAttribute('content') ||
                       undefined;

  const modifiedTime = doc.querySelector('meta[property="article:modified_time"]')?.getAttribute('content') ||
                      doc.querySelector('meta[name="lastmod"]')?.getAttribute('content') ||
                      undefined;

  const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
               doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
               doc.querySelector('img')?.getAttribute('src') ||
               undefined;

  const siteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
                  new URL(url).hostname;

  // Extract structured content from the article
  const structuredContent: StructuredContentItem[] = [];
  let content = '';

  // Find main content container
  let contentContainer: Element | null = null;

  // Try article tag first
  contentContainer = doc.querySelector('article');

  if (!contentContainer) {
    // Try main content areas
    const contentSelectors = [
      '[role="main"]',
      'main',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '#content',
      '#main'
    ];

    for (const selector of contentSelectors) {
      contentContainer = doc.querySelector(selector);
      if (contentContainer && contentContainer.textContent && contentContainer.textContent.length > 100) {
        break;
      }
    }
  }

  // Fallback to body if no specific content area found
  if (!contentContainer) {
    contentContainer = doc.body;
  }

  if (contentContainer) {
    // Extract structured content by finding specific elements
    try {
      // Get headings
      const headings = Array.from(contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      for (const heading of headings) {
        const textContent = heading.textContent?.trim();
        if (textContent && textContent.length > 5) {
          const level = parseInt(heading.tagName.substring(1));
          structuredContent.push({
            type: 'heading',
            level,
            content: textContent
          });
        }
      }

      // Get paragraphs
      const paragraphs = Array.from(contentContainer.querySelectorAll('p'));
      for (const para of paragraphs) {
        const textContent = para.textContent?.trim();
        if (textContent && textContent.length > 20) {
          // Avoid duplicate paragraphs
          const isDuplicate = structuredContent.some(item =>
            item.type === 'paragraph' && item.content.includes(textContent.substring(0, 50))
          );
          if (!isDuplicate) {
            structuredContent.push({
              type: 'paragraph',
              content: textContent
            });
          }
        }
      }

      // Get lists
      const lists = Array.from(contentContainer.querySelectorAll('ul, ol'));
      for (const list of lists) {
        const listItems = Array.from(list.querySelectorAll('li'))
          .map(li => li.textContent?.trim())
          .filter(item => item && item.length > 0) as string[];

        if (listItems.length > 0) {
          structuredContent.push({
            type: 'list',
            content: '',
            items: listItems
          });
        }
      }

      // Get blockquotes
      const quotes = Array.from(contentContainer.querySelectorAll('blockquote'));
      for (const quote of quotes) {
        const textContent = quote.textContent?.trim();
        if (textContent && textContent.length > 10) {
          structuredContent.push({
            type: 'quote',
            content: textContent
          });
        }
      }

      // Get images - filter out placeholders and small/empty images
      const images = Array.from(contentContainer.querySelectorAll('img'));
      for (const img of images) {
        const src = img.src || img.getAttribute('data-src');
        const alt = img.alt || '';
        const width = img.width || parseInt(img.getAttribute('width') || '0');
        const height = img.height || parseInt(img.getAttribute('height') || '0');

        // Skip if no src or if it's a placeholder/small image
        if (!src ||
            src.includes('placeholder') ||
            src.includes('grey-placeholder') ||
            src.includes('spacer') ||
            src.includes('pixel') ||
            width < 50 ||
            height < 50 ||
            alt.toLowerCase().includes('placeholder')) {
          continue;
        }

        // Skip if src is a data URL that's too small (likely a placeholder)
        if (src.startsWith('data:') && src.length < 1000) {
          continue;
        }

        structuredContent.push({
          type: 'image',
          content: alt,
          src,
          alt
        });
      }
    } catch (error) {
      console.warn('[WebContent] Error extracting structured content:', error);
    }

    // If no structured content found, fall back to text extraction
    if (structuredContent.length === 0) {
      content = contentContainer.textContent || '';
    } else {
      // Create plain text content from structured content
      content = structuredContent
        .map(item => {
          switch (item.type) {
            case 'heading':
              return `${'#'.repeat(item.level || 1)} ${item.content}`;
            case 'paragraph':
              return item.content;
            case 'list':
              return item.items?.map(listItem => `• ${listItem}`).join('\n') || '';
            case 'quote':
              return `> ${item.content}`;
            case 'image':
              return `[Image: ${item.alt || item.content}]`;
            default:
              return item.content;
          }
        })
        .filter(text => text.trim().length > 0)
        .join('\n\n');
    }
  }

  // Clean up content
  content = content
    .replace(/\s*(Advertisement|Sponsored|Related Articles?|More from|Read more|Share this|Comments?)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Create excerpt (first 200 characters, but try to end at a sentence)
  let excerpt = '';
  if (content.length > 200) {
    const truncated = content.substring(0, 200);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );
    if (lastSentenceEnd > 100) {
      excerpt = content.substring(0, lastSentenceEnd + 1);
    } else {
      excerpt = truncated + '...';
    }
  } else {
    excerpt = content;
  }

  return {
    url,
    title,
    content,
    excerpt,
    author,
    publishedTime,
    modifiedTime,
    image,
    siteName,
    structuredContent: structuredContent.length > 0 ? structuredContent : undefined
  };
}

async function fetchWebContent(url: string): Promise<WebContent> {
  console.info('[WebContent] fetch start', { url });

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'OwlWebContent/1.0 (+https://owl-platform.com)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
      'Cache-Control': 'no-cache'
    },
    signal: AbortSignal.timeout(10000) // 10 second timeout
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    throw new Error(`Not HTML content: ${contentType}`);
  }

  const html = await res.text();
  console.info('[WebContent] fetched HTML length', { length: html.length });

  const webContent = extractWebContent(url, html);
  console.info('[WebContent] extracted content', {
    title: webContent.title,
    contentLength: webContent.content.length,
    hasAuthor: !!webContent.author
  });

  return webContent;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const webContent = await fetchWebContent(url);

    return new Response(JSON.stringify(webContent), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (e: any) {
    console.error('[WebContent] error', { error: e?.message, url: req.url });
    return new Response(JSON.stringify({
      error: e?.message || 'Failed to fetch web content',
      url: req.url
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
