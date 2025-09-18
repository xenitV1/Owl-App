import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

/**
 * Reading Mode benzeri içerik temizleme sistemi
 * RSS feed'lerden gelen HTML içeriğini temizler ve sadece ana makale içeriğini döndürür
 */

export interface CleanedContent {
  title?: string;
  content: string;
  textContent?: string;
  excerpt?: string;
  byline?: string;
  siteName?: string;
  publishedTime?: string;
  image?: string;
  success: boolean;
}

/**
 * HTML içeriğini temizler ve sadece ana makale içeriğini döndürür
 * Firefox'un okuma modu gibi çalışır
 */
export function cleanHtmlContent(rawHtml: string, url?: string): CleanedContent {
  if (!rawHtml || !rawHtml.trim()) {
    return { content: '', success: false };
  }

  try {
    // HTML'i DOM'a çevir
    const dom = new JSDOM(rawHtml, { url });
    const doc = dom.window.document;

    // Önce spesifik content-id'leri kontrol et
    const specificContent = extractSpecificContent(doc);
    if (specificContent.success) {
      return specificContent;
    }

    // Readability ile içeriği temizle
    const reader = new Readability(doc, {
      // Türkçe içerikler için özel ayarlar
      charThreshold: 500, // Minimum karakter sayısı
      nbTopCandidates: 5, // Aday sayısı
    });

    const article = reader.parse();

    if (!article) {
      // Readability başarısız olursa fallback olarak basit temizleme yap
      return fallbackContentCleaning(rawHtml);
    }

    return {
      title: article.title || undefined,
      content: article.content || '',
      textContent: article.textContent || undefined,
      excerpt: article.excerpt || undefined,
      byline: article.byline || undefined,
      siteName: article.siteName || undefined,
      publishedTime: article.publishedTime || undefined,
      image: (article as any).image || undefined,
      success: true,
    };
  } catch (error) {
    console.warn('[ContentCleaner] Readability failed, using fallback:', error);
    return fallbackContentCleaning(rawHtml);
  }
}

/**
 * Spesifik content-id'leri ve özel attribute'ları kontrol ederek ana içeriği çıkarır
 */
function extractSpecificContent(doc: Document): CleanedContent {
  try {
    // Öncelikli spesifik seçiciler - sadece ana içerik için
    const specificSelectors = [
      // Evrim Ağacı ve benzeri siteler için
      '[data-content-id]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content-body',
      '.story-content',
      '.main-content',
      '.article-body',
      '.post-body',
      '.entry-body',
      '[itemprop="articleBody"]',
      // WordPress ve diğer CMS'ler için
      '.single-post-content',
      '.single-content',
      '.post-single-content',
      // Haber siteleri için
      '.news-content',
      '.article-text',
      '.content-text',
      '.story-text',
      // Blog siteleri için
      '.blog-content',
      '.post-text',
      '.entry-text',
    ];

    let bestContent: Element | null = null;
    let bestScore = 0;

    for (const selector of specificSelectors) {
      const elements = doc.querySelectorAll(selector);
      
      for (const element of elements) {
        // Gereksiz elementleri temizle
        cleanUnwantedElements(element);
        
        const textLength = (element.textContent || '').length;
        const paragraphCount = element.querySelectorAll('p').length;
        const headingCount = element.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
        
        // Skor hesapla: metin uzunluğu + paragraf sayısı + başlık sayısı
        const score = textLength + (paragraphCount * 100) + (headingCount * 50);
        
        // Minimum gereksinimler
        if (textLength > 500 && paragraphCount >= 2 && score > bestScore) {
          bestContent = element;
          bestScore = score;
        }
      }
    }

    if (bestContent && bestScore > 1000) {
      const content = bestContent.innerHTML.trim();
      const textContent = bestContent.textContent?.trim();
      
      return {
        content,
        textContent,
        success: true,
      };
    }

    return { content: '', success: false };
  } catch (error) {
    console.warn('[ContentCleaner] Specific content extraction failed:', error);
    return { content: '', success: false };
  }
}

/**
 * Readability başarısız olursa kullanılan basit temizleme yöntemi
 */
function fallbackContentCleaning(rawHtml: string): CleanedContent {
  try {
    const dom = new JSDOM(`<body>${rawHtml}</body>`);
    const doc = dom.window.document;

    // Ana içerik konteynerlerini bul
    const candidates: Element[] = [];
    const selectors = [
      'article',
      'main',
      '[itemprop="articleBody"]',
      '.entry-content',
      '.post-content',
      '.article-content',
      '.content__article-body',
      '.content',
      '.post-body',
      '.article-body',
      '.story-body',
      '.entry-body',
    ];

    for (const sel of selectors) {
      doc.querySelectorAll(sel).forEach(el => candidates.push(el));
    }

    // Eğer spesifik konteyner bulunamazsa, en çok paragraf içeren div'i bul
    if (candidates.length === 0) {
      doc.querySelectorAll('section, div').forEach(el => {
        const pCount = el.querySelectorAll('p').length;
        if (pCount >= 3) candidates.push(el);
      });
    }

    // En iyi adayı seç (en uzun metin + en çok paragraf)
    const bestCandidate = candidates
      .map(el => ({
        el,
        score: (el.textContent || '').length + el.querySelectorAll('p').length * 50,
      }))
      .sort((a, b) => b.score - a.score)[0];

    const picked = bestCandidate?.el || doc.body;

    // Gereksiz elementleri temizle
    cleanUnwantedElements(picked);

    const content = picked.innerHTML.trim();
    const textContent = picked.textContent?.trim();

    return {
      content: content || rawHtml,
      textContent: textContent || undefined,
      success: content.length > 100, // Minimum içerik uzunluğu kontrolü
    };
  } catch (error) {
    console.warn('[ContentCleaner] Fallback cleaning failed:', error);
    return { content: rawHtml, success: false };
  }
}

/**
 * Gereksiz elementleri HTML'den temizler
 */
function cleanUnwantedElements(container: Element): void {
  // Temizlenecek element türleri
  const unwantedSelectors = [
    'nav',
    'aside',
    'footer',
    'header',
    'form',
    '.sidebar',
    '.navigation',
    '.menu',
    '.breadcrumb',
    '.comments',
    '.comment',
    '.social-share',
    '.share-buttons',
    '.related-posts',
    '.tags',
    '.author-box',
    '.newsletter',
    '.subscribe',
    '.advertisement',
    '.ad',
    '.banner',
    '.promo',
    '.sponsor',
    '.cookie-notice',
    '.popup',
    '.modal',
    '.overlay',
  ];

  // Class ve ID bazlı temizleme
  const unwantedClasses = [
    'breadcrumb',
    'comment',
    'sidebar',
    'toolbar',
    'promo',
    'banner',
    'footer',
    'header',
    'author',
    'meta',
    'print',
    'subscribe',
    'newsletter',
    'social',
    'share',
    'related',
    'tags',
    'ads',
    'advertisement',
    'sponsor',
    'cookie',
    'popup',
    'modal',
    'overlay',
    'support',
    'donate',
    'content-end-support',
    'more-contents',
    'read-count',
    'support-title',
    'support-group',
    'support-left',
    'support-right',
    'advantages',
    'advantages-title',
    'advantages-item',
    'support-prices',
    'prices-type',
    'type-item',
    'prices-selections',
    'selection-item',
    'support-btn',
    'support-footer',
    'right-wrapper',
    'type-value',
    'price-custom',
    'price-custom-value',
  ];

  // Seçici bazlı temizleme
  unwantedSelectors.forEach(selector => {
    container.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Özel data attribute'ları ile filtreleme
  container.querySelectorAll('[data-ea-module]').forEach(el => el.remove());
  container.querySelectorAll('[data-module]').forEach(el => el.remove());
  container.querySelectorAll('[data-widget]').forEach(el => el.remove());
  container.querySelectorAll('[data-ad]').forEach(el => el.remove());
  container.querySelectorAll('[data-promo]').forEach(el => el.remove());
  container.querySelectorAll('[data-sponsor]').forEach(el => el.remove());

  // Class bazlı temizleme
  container.querySelectorAll('*').forEach(el => {
    const className = el.getAttribute('class') || '';
    const id = el.getAttribute('id') || '';
    const combined = `${className} ${id}`.toLowerCase();

    // Gereksiz class/id içeren elementleri temizle
    if (unwantedClasses.some(unwanted => combined.includes(unwanted))) {
      el.remove();
      return;
    }

    // Bağlantı yoğunluğu kontrolü
    const links = el.querySelectorAll('a');
    const textLength = (el.textContent || '').length;
    const linkTextLength = Array.from(links).reduce(
      (sum, link) => sum + (link.textContent || '').length,
      0,
    );

    if (textLength > 0) {
      const linkDensity = linkTextLength / textLength;
      // %45'ten fazla bağlantı içeren kısa içerikleri temizle
      if (linkDensity > 0.45 && textLength < 800) {
        el.remove();
        return;
      }

      // 4'ten fazla bağlantı içeren çok kısa içerikleri temizle
      if (links.length >= 4 && textLength < 200) {
        el.remove();
        return;
      }
    }

    // Liste elementleri kontrolü (tag cloud'lar vs.)
    const listItems = el.querySelectorAll('li');
    if (listItems.length >= 6) {
      const avgItemLength = Array.from(listItems).reduce(
        (sum, li) => sum + (li.textContent || '').length,
        0,
      ) / listItems.length;
      if (avgItemLength < 25) {
        el.remove();
        return;
      }
    }
  });
}

/**
 * RSS içeriği için özel temizleme - hem HTML hem de metin döndürür
 */
export function cleanRssContent(
  contentHtml?: string,
  descriptionHtml?: string,
  linkUrl?: string,
): {
  cleanedHtml: string;
  cleanedText: string;
  success: boolean;
} {
  const htmlToClean = contentHtml || descriptionHtml;
  
  if (!htmlToClean) {
    return { cleanedHtml: '', cleanedText: '', success: false };
  }

  const result = cleanHtmlContent(htmlToClean, linkUrl);
  
  return {
    cleanedHtml: result.content,
    cleanedText: result.textContent || result.content.replace(/<[^>]*>/g, '').trim(),
    success: result.success,
  };
}
