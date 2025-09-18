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

const MIN_IMAGE_WIDTH = 854; // ~480p width
const MIN_IMAGE_HEIGHT = 480;

function pickFromSrcset(srcset: string, baseUrl?: string): string | undefined {
  // Parse candidates like: url 320w, url2 640w, url3 1024w
  const parts = srcset.split(/\s*,\s*/).map(p => p.trim()).filter(Boolean);
  let bestUrl: string | undefined;
  let bestW = 0;
  for (const part of parts) {
    const m = part.match(/([^\s]+)\s+(\d+)w/);
    const m2 = part.match(/([^\s]+)\s+(\d+(?:\.\d+)?)x/);
    let url: string | undefined;
    let w = 0;
    if (m) { url = m[1]; w = parseInt(m[2], 10); }
    else if (m2) { url = m2[1]; const x = parseFloat(m2[2]); w = Math.round(640 * x); }
    else { // no descriptor, take as is
      const u = part.split(/\s+/)[0];
      if (u) return absolutizeUrl(u, baseUrl);
    }
    if (url) {
      if (w >= MIN_IMAGE_WIDTH && w >= bestW) { bestW = w; bestUrl = url; }
      else if (w > bestW) { bestW = w; bestUrl = url; }
    }
  }
  return bestUrl ? absolutizeUrl(bestUrl, baseUrl) : undefined;
}

function parseNumericParam(url: string, key: string): number | null {
  try {
    const u = new URL(url);
    const v = u.searchParams.get(key);
    if (!v) return null;
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  } catch { return null; }
}

function urlSuggestsSmallSize(url: string): boolean {
  const m = url.match(/(?:^|[\/_-])(\d{2,4})x(\d{2,4})(?:[\/_.-]|$)/i);
  if (m) {
    const w = parseInt(m[1], 10);
    const h = parseInt(m[2], 10);
    if (!isNaN(w) && !isNaN(h) && (w < MIN_IMAGE_WIDTH || h < MIN_IMAGE_HEIGHT)) return true;
  }
  const wq = parseNumericParam(url, 'w') ?? parseNumericParam(url, 'width');
  const hq = parseNumericParam(url, 'h') ?? parseNumericParam(url, 'height');
  if (wq !== null && wq < MIN_IMAGE_WIDTH) return true;
  if (hq !== null && hq < MIN_IMAGE_HEIGHT) return true;
  // obvious small assets
  if (/\/avatar|\/icon|\/thumb|favicon|sprite/i.test(url)) return true;
  return false;
}

function meetsMinSizeHint(width?: number, height?: number): boolean {
  if (typeof width === 'number' && typeof height === 'number') {
    return width >= MIN_IMAGE_WIDTH && height >= MIN_IMAGE_HEIGHT;
  }
  return true; // no hints; accept for now (other checks may still reject)
}

/**
 * Extract a suitable image URL from an HTML snippet with a minimum size heuristic.
 */
export function extractFirstImageFromHtml(html: string | undefined, baseUrl?: string): string | undefined {
  if (!html) return undefined;

  // 1) Try to find an <img ... srcset="..."> first and pick best size
  const srcsetMatch = html.match(/<img\s+[^>]*srcset=["']([^"']+)["'][^>]*>/i);
  if (srcsetMatch && srcsetMatch[1]) {
    const candidate = pickFromSrcset(srcsetMatch[1], baseUrl);
    if (candidate) return candidate;
  }

  // 1b) <img ... width/height="..."> hints
  const imgTag = html.match(/<img\s+[^>]*>/i);
  if (imgTag && imgTag[0]) {
    const tag = imgTag[0];
    const src = (tag.match(/src=["']([^"'>]+)["']/i) || [])[1];
    const wStr = (tag.match(/\bwidth=["']?(\d+)["']?/i) || [])[1];
    const hStr = (tag.match(/\bheight=["']?(\d+)["']?/i) || [])[1];
    const w = wStr ? parseInt(wStr, 10) : 0;
    const h = hStr ? parseInt(hStr, 10) : 0;
    if (src && (!w || w >= MIN_IMAGE_WIDTH) && (!h || h >= MIN_IMAGE_HEIGHT) && !urlSuggestsSmallSize(src)) {
      return absolutizeUrl(src, baseUrl);
    }
  }

  // 2) Some feeds use data-src or lazy-src attributes
  const dataSrc = html.match(/<img\s+[^>]*(?:data-src|data-lazy-src|data-original)=["']([^"'>]+)["'][^>]*>/i);
  if (dataSrc && dataSrc[1]) {
    return absolutizeUrl(dataSrc[1], baseUrl);
  }

  // (already handled before) srcset

  // 4) Sometimes feeds include raw OG meta tags within content strings
  const og = html.match(/property=["']og:image["'][^>]*content=["']([^"'>]+)["']/i) ||
             html.match(/content=["']([^"'>]+)["'][^>]*property=["']og:image["']/i);
  if (og && og[1]) {
    const url = absolutizeUrl(og[1], baseUrl);
    // read width/height hints if present
    const wMeta = html.match(/property=["']og:image:width["'][^>]*content=["'](\d+)["']/i);
    const hMeta = html.match(/property=["']og:image:height["'][^>]*content=["'](\d+)["']/i);
    const w = wMeta ? parseInt(wMeta[1], 10) : undefined;
    const h = hMeta ? parseInt(hMeta[1], 10) : undefined;
    if (url && meetsMinSizeHint(w, h) && !urlSuggestsSmallSize(url)) return url;
  }

  // 4b) Secure og:image url
  const ogSecure = html.match(/property=["']og:image:secure_url["'][^>]*content=["']([^"'>]+)["']/i);
  if (ogSecure && ogSecure[1]) {
    const url = absolutizeUrl(ogSecure[1], baseUrl);
    if (url && !urlSuggestsSmallSize(url)) return url;
  }

  // 4c) Twitter card image
  const tw = html.match(/name=["']twitter:image["'][^>]*content=["']([^"'>]+)["']/i);
  if (tw && tw[1]) {
    const url = absolutizeUrl(tw[1], baseUrl);
    if (url && !urlSuggestsSmallSize(url)) return url;
  }

  // 4d) JSON-LD NewsArticle image
  const ld = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>\s*([\s\S]*?)<\/script>/i);
  if (ld && ld[1]) {
    try {
      const json = JSON.parse(ld[1]);
      const img = json?.image?.url || json?.image || json?.thumbnailUrl;
      if (typeof img === 'string') return absolutizeUrl(img, baseUrl);
      if (Array.isArray(img) && img.length > 0) return absolutizeUrl(img[0], baseUrl);
    } catch {}
  }

  // 5) Plain URLs to common image extensions
  const plain = html.match(/https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|gif|webp)/i);
  if (plain && plain[0]) {
    const url = plain[0];
    if (!urlSuggestsSmallSize(url)) return absolutizeUrl(url, baseUrl);
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


