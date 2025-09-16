import { NextRequest } from 'next/server';
import { JSDOM } from 'jsdom';
import { pickThumbnail } from '@/lib/rssThumbnails';

export const dynamic = 'force-dynamic';

interface DiscoveredFeed {
  url: string;
  type: string;
  title?: string;
}

function absolutize(url: string, href: string): string {
  try {
    return new URL(href, url).toString();
  } catch {
    return href;
  }
}

function isXmlContentType(ct: string | null): boolean {
  if (!ct) return false;
  const low = ct.toLowerCase();
  return low.includes('xml') || low.includes('rss') || low.includes('atom');
}

function youtubeHeuristics(pageUrl: string): DiscoveredFeed[] {
  try {
    const url = new URL(pageUrl);
    if (!/youtube\.com$/.test(url.hostname)) return [];
    // /channel/CHANNEL_ID
    const channelMatch = url.pathname.match(/\/channel\/([a-zA-Z0-9_-]+)/);
    if (channelMatch) {
      return [{ url: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`, type: 'application/atom+xml', title: 'YouTube Channel Feed' }];
    }
    // /playlist?list=PLAYLIST_ID
    const playlist = url.searchParams.get('list');
    if (url.pathname.includes('/playlist') && playlist) {
      return [{ url: `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlist}`, type: 'application/atom+xml', title: 'YouTube Playlist Feed' }];
    }
    // /@handle and others would require scraping; skip for now
    return [];
  } catch {
    return [];
  }
}

async function discoverFeeds(pageUrl: string): Promise<DiscoveredFeed[]> {
  console.info('[RSS][discover] start', { pageUrl });
  const yt = youtubeHeuristics(pageUrl);
  const feeds: DiscoveredFeed[] = [...yt];

  const res = await fetch(pageUrl, { headers: { 'User-Agent': 'OwlRSS/1.0' } });
  console.info('[RSS][discover] fetch page response', { status: res.status, ok: res.ok });
  if (res.ok) {
    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const links = Array.from(doc.querySelectorAll('link[rel="alternate"]')) as HTMLLinkElement[];
    console.debug('[RSS][discover] found rel=alternate links', { count: links.length });
    for (const link of links) {
      const type = (link.getAttribute('type') || '').toLowerCase();
      const href = link.getAttribute('href') || '';
      const title = link.getAttribute('title') || undefined;
      console.debug('[RSS][discover] candidate', { type, href, title });
      if (type && (type.includes('rss') || type.includes('atom') || type.includes('xml'))) {
        const abs = absolutize(pageUrl, href);
        feeds.push({ url: abs, type: type || 'application/xml', title });
      }
    }
  }

  // Fallback: probe common paths with HEAD, but only accept XML content types
  const candidates = ['/rss', '/feed', '/feeds', '/rss.xml', '/atom.xml', '/feed.xml'];
  for (const c of candidates) {
    const u = absolutize(pageUrl, c);
    if (!feeds.find(f => f.url === u)) {
      try {
        const head = await fetch(u, { method: 'HEAD' });
        const ct = head.headers.get('content-type');
        console.debug('[RSS][discover] HEAD check', { url: u, status: head.status, ok: head.ok, contentType: ct });
        if (head.ok && isXmlContentType(ct)) feeds.push({ url: u, type: ct || 'application/xml' });
      } catch (e) {
        console.debug('[RSS][discover] HEAD failed', { url: u, error: (e as any)?.message });
      }
    }
  }
  console.info('[RSS][discover] done', { feedsCount: feeds.length });
  return feeds;
}

function parseText(el: Element | null): string | undefined {
  if (!el) return undefined;
  const text = (el.textContent || '').trim();
  return text || undefined;
}

async function fetchFeed(feedUrl: string, limit: number, page: number) {
  console.info('[RSS][fetch] start', { feedUrl });
  const res = await fetch(feedUrl, { headers: { 'User-Agent': 'OwlRSS/1.0' } });
  const ct = res.headers.get('content-type');
  console.info('[RSS][fetch] response', { status: res.status, ok: res.ok, contentType: ct });
  if (!res.ok) throw new Error(`Failed to fetch feed: ${res.status}`);
  if (!isXmlContentType(ct)) throw new Error(`Not an RSS/Atom feed (content-type: ${ct})`);

  const xml = await res.text();
  console.debug('[RSS][fetch] xml length', { length: xml.length });
  const dom = new JSDOM(xml, { contentType: 'text/xml' });
  const doc = dom.window.document;

  // Detect RSS vs Atom
  const isAtom = !!doc.querySelector('feed');
  const items: any[] = [];
  console.debug('[RSS][fetch] detected type', { isAtom });

  // Helper to read common image-carrying attributes from a media element
  const readMediaUrl = (el: Element | null | undefined): string | undefined => {
    if (!el) return undefined;
    const candidates = ['url', 'src', 'href'];
    for (const k of candidates) {
      const v = el.getAttribute(k);
      if (v) return v;
    }
    return undefined;
  };

  if (isAtom) {
    doc.querySelectorAll('entry').forEach(entry => {
      const id = parseText(entry.querySelector('id')) || parseText(entry.querySelector('guid')) || '';
      const title = parseText(entry.querySelector('title')) || '';
      const linkEl = (entry.querySelector('link[rel="alternate"]') || entry.querySelector('link')) as HTMLAnchorElement | null;
      const link = linkEl?.getAttribute('href') || '';
      const published = parseText(entry.querySelector('published')) || parseText(entry.querySelector('updated'));
      const summary = parseText(entry.querySelector('summary')) || parseText(entry.querySelector('content'));
      const contentHtml = (entry.querySelector('content') as Element | null)?.textContent || undefined;
      const summaryHtml = (entry.querySelector('summary') as Element | null)?.textContent || undefined;
      const thumbEl = (entry.querySelector('media\\:thumbnail') || entry.querySelector('media\\:content') || entry.querySelector('thumbnail')) as Element | null;
      const enclosureImg = (entry.querySelector('link[rel="enclosure"][type^="image/"]') as Element | null)?.getAttribute('href') || undefined;
      const mediaUrl = readMediaUrl(thumbEl);
      const thumbnail = pickThumbnail({ mediaUrl, enclosureUrl: enclosureImg, contentHtml: contentHtml || summaryHtml, descriptionHtml: summaryHtml || summary, linkUrl: link });
      const isShort = /youtube\.com\/shorts\//i.test(link) || /#shorts/i.test(title || '') || /#shorts/i.test(summary || '');
      items.push({ id, title, link, published, summary, thumbnail, isShort });
    });
  } else {
    doc.querySelectorAll('item').forEach(item => {
      const id = parseText(item.querySelector('guid')) || parseText(item.querySelector('link')) || '';
      const title = parseText(item.querySelector('title')) || '';
      const link = parseText(item.querySelector('link')) || '';
      const published = parseText(item.querySelector('pubDate'));
      const description = parseText(item.querySelector('description')) || parseText(item.querySelector('content\\:encoded'));
      const contentHtml = (item.querySelector('content\\:encoded') as Element | null)?.textContent || undefined;
      const descriptionHtml = (item.querySelector('description') as Element | null)?.textContent || undefined;
      const thumbEl = (item.querySelector('media\\:thumbnail') || item.querySelector('media\\:content') || item.querySelector('thumbnail')) as Element | null;
      const enclosureImg = (item.querySelector('enclosure[type^="image/"]') as Element | null)?.getAttribute('url') || undefined;
      const mediaUrl = readMediaUrl(thumbEl);
      const thumbnail = pickThumbnail({ mediaUrl, enclosureUrl: enclosureImg, contentHtml: contentHtml || descriptionHtml, descriptionHtml: descriptionHtml || description, linkUrl: link });
      const isShort = /youtube\.com\/shorts\//i.test(link) || /#shorts/i.test(title || '') || /#shorts/i.test(description || '');
      items.push({ id, title, link, published, summary: description, thumbnail, isShort });
    });
  }

  const channelTitle = parseText(doc.querySelector('channel > title')) || parseText(doc.querySelector('feed > title'));
  // Fallback: derive YouTube thumbnails if missing
  const addYouTubeThumb = (url: string | undefined) => {
    if (!url) return undefined;
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, '');
      let vid: string | null = null;
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        vid = u.searchParams.get('v');
      } else if (host === 'youtu.be') {
        vid = u.pathname.split('/')[1] || null;
      }
      if (vid && /^[A-Za-z0-9_-]{11}$/.test(vid)) {
        return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
      }
    } catch {}
    return undefined;
  };

  const enriched = items.map((it: any) => {
    if (!it.thumbnail) {
      const t = addYouTubeThumb(it.link);
      if (t) return { ...it, thumbnail: t };
    }
    return it;
  });

  const lim = Math.max(1, Math.min(50, limit || 20));
  const start = Math.max(0, (page || 0) * lim);
  const sliced = enriched.slice(start, start + lim);
  const hasMore = start + lim < enriched.length;
  console.info('[RSS][fetch] parsed items', { title: channelTitle, count: items.length, returned: sliced.length, page, hasMore });
  return { title: channelTitle, items: sliced, limit: lim, page, hasMore };
}

// --- YouTube helpers ---
function isYouTubeChannelId(value: string): boolean {
  return /^UC[0-9A-Za-z_-]{22}$/.test(value);
}

function normalizeYouTubeInput(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('@')) return `https://www.youtube.com/${trimmed}`;
  // heuristic: treat plain string as handle
  return `https://www.youtube.com/@${encodeURIComponent(trimmed)}`;
}

async function resolveYouTubeChannelId(input: string): Promise<{ channelId: string | null; feedUrl: string | null }> {
  try {
    const raw = input.trim();
    if (isYouTubeChannelId(raw)) {
      return { channelId: raw, feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${raw}` };
    }

    // Try YouTube Data API v3 search first if available
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey) {
      const q = encodeURIComponent(raw);
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${q}&key=${apiKey}`;
      try {
        const r = await fetch(apiUrl);
        if (r.ok) {
          const j = await r.json();
          const first = j?.items?.[0]?.snippet;
          const chId = j?.items?.[0]?.id?.channelId;
          if (chId) {
            return { channelId: chId, feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${chId}` };
          }
          // fallthrough to HTML if no match
        }
      } catch {}
    }

    const url = normalizeYouTubeInput(raw);
    const res = await fetch(url, { headers: { 'User-Agent': 'OwlRSS/1.0' } });
    const html = await res.text();

    // Try to find channelId in JSON
    let m = html.match(/"channelId":"(UC[0-9A-Za-z_-]{22})"/);
    if (!m) {
      // Try meta tag
      m = html.match(/itemprop="channelId"\s+content="(UC[0-9A-Za-z_-]{22})"/i);
    }
    if (!m) {
      // Try links to /channel/UC...
      m = html.match(/\/["']?channel\/(UC[0-9A-Za-z_-]{22})/i);
    }
    const channelId = m ? m[1] : null;
    const feedUrl = channelId ? `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}` : null;
    return { channelId, feedUrl };
  } catch {
    return { channelId: null, feedUrl: null };
  }
}

function isoDurationToSeconds(iso: string | undefined): number | null {
  if (!iso) return null;
  // e.g., PT45S, PT1M5S
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = parseInt(m[1] || '0', 10);
  const mi = parseInt(m[2] || '0', 10);
  const s = parseInt(m[3] || '0', 10);
  return h * 3600 + mi * 60 + s;
}

async function fetchYouTubePopular(regionCode: string, limit: number, page: number): Promise<{ items: Array<{ id: string; title: string; link: string; published?: string; summary?: string; thumbnail?: string; isShort?: boolean }>, limit: number, page: number, hasMore: boolean }> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YouTube API key not configured');
  }
  const rc = regionCode || 'US';
  const max = Math.max(1, Math.min(50, limit || 20));
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&maxResults=${max}&regionCode=${encodeURIComponent(rc)}&key=${apiKey}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`YouTube API error: ${r.status}`);
  const j = await r.json();
  const items = (j.items || []).map((it: any) => {
    const vid = it.id;
    const sn = it.snippet || {};
    const tn = sn.thumbnails || {};
    const thumb = (tn.medium?.url || tn.high?.url || tn.standard?.url || tn.default?.url);
    const durSec = isoDurationToSeconds(it?.contentDetails?.duration);
    return {
      id: vid,
      title: sn.title || '',
      link: `https://www.youtube.com/watch?v=${vid}`,
      published: sn.publishedAt,
      summary: sn.description || '',
      thumbnail: thumb,
      isShort: typeof durSec === 'number' ? durSec <= 60 : /#shorts/i.test(sn.title || '')
    };
  });
  // Placeholder: nextPageToken not used; treat as single page for now
  const hasMore = false;
  return { items, limit: max, page, hasMore };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    const feed = searchParams.get('feed');
    const ytResolve = searchParams.get('youtubeResolve');
    const ytPopular = searchParams.get('youtubePopular');
    const limitParam = parseInt(searchParams.get('limit') || '15', 10);
    const limit = isNaN(limitParam) ? 15 : limitParam;
    const pageParam = parseInt(searchParams.get('page') || '0', 10);
    const page = isNaN(pageParam) ? 0 : pageParam;
    console.info('[RSS][GET]', { url, feed });
    if (ytResolve) {
      const result = await resolveYouTubeChannelId(ytResolve);
      if (!result.channelId) {
        return new Response(JSON.stringify({ error: 'Could not resolve channel id' }), { status: 404 });
      }
      return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });
    }
    if (ytPopular) {
      try {
        const data = await fetchYouTubePopular(ytPopular, limit, page);
        return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e?.message || 'YouTube popular failed' }), { status: 500 });
      }
    }
    if (!url && !feed) {
      return new Response(JSON.stringify({ error: 'Missing url or feed param' }), { status: 400 });
    }

    if (url && !feed) {
      const feeds = await discoverFeeds(url);
      return new Response(JSON.stringify({ feeds }), { headers: { 'content-type': 'application/json' } });
    }

    if (feed) {
      const data = await fetchFeed(feed, limit, page);
      return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  } catch (e: any) {
    console.error('[RSS][GET] error', { error: e?.message });
    return new Response(JSON.stringify({ error: e?.message || 'RSS error' }), { status: 500 });
  }
}
