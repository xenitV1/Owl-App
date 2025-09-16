/**
 * Utilities for extracting a thumbnail image URL from RSS/Atom item HTML.
 * Focuses on robustness for common feeds like BBC, Reddit, Medium, etc.
 */

/**
 * Resolve relative URLs against a base URL if provided.
 */
function absolutizeUrl(possiblyRelativeUrl: string | null | undefined, baseUrl?: string): string | undefined {
  if (!possiblyRelativeUrl) return undefined;
  const href = possiblyRelativeUrl.trim();
  if (!href) return undefined;
  try {
    if (!baseUrl) return href;
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

/**
 * Extract the first image-like URL from an HTML snippet.
 * Looks for <img>, data-src, srcset, and common og:image fallbacks embedded in the text.
 */
export function extractFirstImageFromHtml(html: string | undefined, baseUrl?: string): string | undefined {
  if (!html) return undefined;

  // 1) Try to find an <img ... src="..."> in the HTML
  const imgTag = html.match(/<img\s+[^>]*src=["']([^"'>]+)["'][^>]*>/i);
  if (imgTag && imgTag[1]) {
    return absolutizeUrl(imgTag[1], baseUrl);
  }

  // 2) Some feeds use data-src or lazy-src attributes
  const dataSrc = html.match(/<img\s+[^>]*(?:data-src|data-lazy-src|data-original)=["']([^"'>]+)["'][^>]*>/i);
  if (dataSrc && dataSrc[1]) {
    return absolutizeUrl(dataSrc[1], baseUrl);
  }

  // 3) srcset attribute – take the first URL
  const srcset = html.match(/<img\s+[^>]*srcset=["']([^"']+)["'][^>]*>/i);
  if (srcset && srcset[1]) {
    const first = srcset[1].split(/\s*,\s*/)[0]?.split(/\s+/)[0];
    if (first) return absolutizeUrl(first, baseUrl);
  }

  // 4) Sometimes feeds include raw OG meta tags within content strings
  const og = html.match(/property=["']og:image["'][^>]*content=["']([^"'>]+)["']/i) ||
             html.match(/content=["']([^"'>]+)["'][^>]*property=["']og:image["']/i);
  if (og && og[1]) {
    return absolutizeUrl(og[1], baseUrl);
  }

  // 5) Plain URLs to common image extensions
  const plain = html.match(/https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|gif|webp)/i);
  if (plain && plain[0]) {
    return absolutizeUrl(plain[0], baseUrl);
  }

  return undefined;
}

/**
 * Best-effort thumbnail extraction given multiple candidate fields.
 */
export function pickThumbnail(options: {
  mediaUrl?: string;
  enclosureUrl?: string;
  contentHtml?: string;
  descriptionHtml?: string;
  linkUrl?: string;
}): string | undefined {
  const { mediaUrl, enclosureUrl, contentHtml, descriptionHtml, linkUrl } = options;
  const direct = mediaUrl || enclosureUrl;
  if (direct) return direct;

  const fromContent = extractFirstImageFromHtml(contentHtml, linkUrl);
  if (fromContent) return fromContent;

  const fromDesc = extractFirstImageFromHtml(descriptionHtml, linkUrl);
  if (fromDesc) return fromDesc;

  return undefined;
}


