import { NextRequest } from 'next/server';
import { JSDOM } from 'jsdom';

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

async function fetchFeed(feedUrl: string) {
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

  if (isAtom) {
    doc.querySelectorAll('entry').forEach(entry => {
      const id = parseText(entry.querySelector('id')) || parseText(entry.querySelector('guid')) || '';
      const title = parseText(entry.querySelector('title')) || '';
      const linkEl = (entry.querySelector('link[rel="alternate"]') || entry.querySelector('link')) as HTMLAnchorElement | null;
      const link = linkEl?.getAttribute('href') || '';
      const published = parseText(entry.querySelector('published')) || parseText(entry.querySelector('updated'));
      const summary = parseText(entry.querySelector('summary')) || parseText(entry.querySelector('content'));
      items.push({ id, title, link, published, summary });
    });
  } else {
    doc.querySelectorAll('item').forEach(item => {
      const id = parseText(item.querySelector('guid')) || parseText(item.querySelector('link')) || '';
      const title = parseText(item.querySelector('title')) || '';
      const link = parseText(item.querySelector('link')) || '';
      const published = parseText(item.querySelector('pubDate'));
      const description = parseText(item.querySelector('description')) || parseText(item.querySelector('content\\:encoded'));
      items.push({ id, title, link, published, summary: description });
    });
  }

  const channelTitle = parseText(doc.querySelector('channel > title')) || parseText(doc.querySelector('feed > title'));
  console.info('[RSS][fetch] parsed items', { title: channelTitle, count: items.length });
  return { title: channelTitle, items };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    const feed = searchParams.get('feed');
    console.info('[RSS][GET]', { url, feed });
    if (!url && !feed) {
      return new Response(JSON.stringify({ error: 'Missing url or feed param' }), { status: 400 });
    }

    if (url && !feed) {
      const feeds = await discoverFeeds(url);
      return new Response(JSON.stringify({ feeds }), { headers: { 'content-type': 'application/json' } });
    }

    if (feed) {
      const data = await fetchFeed(feed);
      return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  } catch (e: any) {
    console.error('[RSS][GET] error', { error: e?.message });
    return new Response(JSON.stringify({ error: e?.message || 'RSS error' }), { status: 500 });
  }
}
