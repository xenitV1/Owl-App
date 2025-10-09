import { JSDOM } from "jsdom";

export interface DiscoveredFeed {
  url: string;
  type: string;
  title?: string;
}

export function absolutize(url: string, href: string): string {
  try {
    return new URL(href, url).toString();
  } catch {
    return href;
  }
}

export function isXmlContentType(ct: string | null): boolean {
  if (!ct) return false;
  const low = ct.toLowerCase();
  return low.includes("xml") || low.includes("rss") || low.includes("atom");
}

export function isJsonFeedContentType(ct: string | null): boolean {
  if (!ct) return false;
  const low = ct.toLowerCase();
  return (
    low.includes("application/feed+json") || low.includes("application/json")
  );
}

function youtubeHeuristics(pageUrl: string): DiscoveredFeed[] {
  try {
    const url = new URL(pageUrl);
    if (!/youtube\.com$/.test(url.hostname)) return [];
    const channelMatch = url.pathname.match(/\/channel\/([a-zA-Z0-9_-]+)/);
    if (channelMatch) {
      return [
        {
          url: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`,
          type: "application/atom+xml",
          title: "YouTube Channel Feed",
        },
      ];
    }
    const playlist = url.searchParams.get("list");
    if (url.pathname.includes("/playlist") && playlist) {
      return [
        {
          url: `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlist}`,
          type: "application/atom+xml",
          title: "YouTube Playlist Feed",
        },
      ];
    }
    return [];
  } catch {
    return [];
  }
}

export async function discoverFeeds(
  pageUrl: string,
): Promise<DiscoveredFeed[]> {
  console.info("[RSS][discover] start", { pageUrl });
  const yt = youtubeHeuristics(pageUrl);
  const feeds: DiscoveredFeed[] = [...yt];

  const res = await fetch(pageUrl, {
    headers: {
      "User-Agent": "OwlRSS/1.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9",
    },
  });
  console.info("[RSS][discover] fetch page response", {
    status: res.status,
    ok: res.ok,
  });
  if (res.ok) {
    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const links = Array.from(
      doc.querySelectorAll('link[rel="alternate"]'),
    ) as HTMLLinkElement[];
    console.debug("[RSS][discover] found rel=alternate links", {
      count: links.length,
    });
    for (const link of links) {
      const type = (link.getAttribute("type") || "").toLowerCase();
      const href = link.getAttribute("href") || "";
      const title = link.getAttribute("title") || undefined;
      console.debug("[RSS][discover] candidate", { type, href, title });
      if (
        type &&
        (type.includes("rss") ||
          type.includes("atom") ||
          type.includes("xml") ||
          type.includes("feed+json") ||
          type.includes("json"))
      ) {
        const abs = absolutize(pageUrl, href);
        feeds.push({ url: abs, type: type || "application/xml", title });
      }
    }

    const anchors = Array.from(
      doc.querySelectorAll("a[href]"),
    ) as HTMLAnchorElement[];
    for (const a of anchors) {
      const text = (a.textContent || "").toLowerCase();
      const href = a.getAttribute("href") || "";
      if (
        /rss|feed|abone|atom|xml/.test(text) ||
        /\/(?:feed|rss|atom)(?:\/|$|\.)/i.test(href)
      ) {
        const abs = absolutize(pageUrl, href);
        if (!feeds.find((f) => f.url === abs))
          feeds.push({ url: abs, type: "text/html" });
      }
    }

    const wpCandidates = ["feed", "feed/rss", "feed/atom", "?feed=rss2"];
    for (const c of wpCandidates) {
      const abs = absolutize(pageUrl, c);
      if (!feeds.find((f) => f.url === abs))
        feeds.push({ url: abs, type: "application/xml" });
    }
  }

  const candidates = [
    "/rss",
    "/feed",
    "/feeds",
    "/rss.xml",
    "/atom.xml",
    "/feed.xml",
  ];
  for (const c of candidates) {
    const u = absolutize(pageUrl, c);
    if (!feeds.find((f) => f.url === u)) {
      try {
        const head = await fetch(u, { method: "HEAD" });
        const ct = head.headers.get("content-type");
        console.debug("[RSS][discover] HEAD check", {
          url: u,
          status: head.status,
          ok: head.ok,
          contentType: ct,
        });
        if (head.ok && isXmlContentType(ct))
          feeds.push({ url: u, type: ct || "application/xml" });
      } catch (e) {
        console.debug("[RSS][discover] HEAD failed", {
          url: u,
          error: (e as any)?.message,
        });
      }
    }
  }
  console.info("[RSS][discover] done", { feedsCount: feeds.length });
  return feeds;
}
