import { JSDOM } from "jsdom";
import { pickThumbnail, extractFirstImageFromHtml } from "@/lib/rssThumbnails";
import { cleanRssContent } from "@/lib/contentCleaner";
import {
  absolutize,
  isXmlContentType,
  isJsonFeedContentType,
} from "@/lib/rss/discovery";

function parseText(el: Element | null): string | undefined {
  if (!el) return undefined;
  const text = (el.textContent || "").trim();
  return text || undefined;
}

function parseNumericParam(url: string, key: string): number | null {
  try {
    const u = new URL(url);
    const v = u.searchParams.get(key);
    if (!v) return null;
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  } catch {
    return null;
  }
}

function urlSuggestsSmallSize(url: string): boolean {
  const m = url.match(/(?:^|[\/_=-])(\d{2,4})x(\d{2,4})(?:[\/_.-]|$)/i);
  if (m) {
    const w = parseInt(m[1], 10);
    const h = parseInt(m[2], 10);
    if (!isNaN(w) && !isNaN(h) && (w < 854 || h < 480)) return true;
  }
  const wq = parseNumericParam(url, "w") ?? parseNumericParam(url, "width");
  const hq = parseNumericParam(url, "h") ?? parseNumericParam(url, "height");
  if (wq !== null && wq < 854) return true;
  if (hq !== null && hq < 480) return true;
  if (/\/avatar|\/icon|\/thumb|favicon|sprite/i.test(url)) return true;
  return false;
}

export async function fetchFeed(feedUrl: string, limit: number, page: number) {
  console.info("[RSS][fetch] start", { feedUrl });
  let res = await fetch(feedUrl, {
    headers: {
      "User-Agent": "OwlRSS/1.0",
      Accept:
        "application/rss+xml, application/atom+xml, application/xml, application/feed+json, text/html;q=0.8",
    },
  });
  let ct = res.headers.get("content-type");
  console.info("[RSS][fetch] response", {
    status: res.status,
    ok: res.ok,
    contentType: ct,
  });
  if (!res.ok) throw new Error(`Failed to fetch feed: ${res.status}`);
  if (!isXmlContentType(ct)) {
    try {
      const { discoverFeeds } = await import("@/lib/rss/discovery");
      const discovered = await discoverFeeds(feedUrl);
      const first = discovered[0]?.url;
      if (first) {
        console.info("[RSS][fetch] non-xml, discovered feed. Refetching", {
          first,
        });
        res = await fetch(first, {
          headers: {
            "User-Agent": "OwlRSS/1.0",
            Accept:
              "application/rss+xml, application/atom+xml, application/xml, application/feed+json, text/html;q=0.8",
          },
        });
        ct = res.headers.get("content-type");
      }
    } catch {}
  }
  if (!isXmlContentType(ct)) {
    const html = await res.text();
    const m = html.match(
      /<meta[^>]+http-equiv=["']refresh["'][^>]*content=["']\d+;\s*url=([^"'>]+)["']/i,
    );
    if (m && m[1]) {
      const abs = absolutize(feedUrl, m[1]);
      res = await fetch(abs, { headers: { "User-Agent": "OwlRSS/1.0" } });
      ct = res.headers.get("content-type");
    } else {
      if (
        isJsonFeedContentType(ct) ||
        /"version"\s*:\s*"https?:\/\/jsonfeed\.org\//i.test(html)
      ) {
        const j =
          typeof html === "string" ? JSON.parse(html) : await res.json();
        const jfItems = (j.items || []).map((it: any) => ({
          id: it.id || it.url || "",
          title: it.title || "",
          link: it.url || it.external_url || "",
          published: it.date_published,
          summary: it.summary || it.content_text,
          thumbnail: it.image || it.banner_image,
        }));
        const lim = Math.max(1, Math.min(50, limit || 20));
        const start = Math.max(0, (page || 0) * lim);
        const sliced = jfItems.slice(start, start + lim);
        const hasMore = start + lim < jfItems.length;
        const title = j.title || "";
        return { title, items: sliced, limit: lim, page, hasMore };
      }
      throw new Error(`Not an RSS/Atom/JSON feed (content-type: ${ct})`);
    }
  }

  const xml = await res.text();
  console.debug("[RSS][fetch] xml length", { length: xml.length });
  const dom = new JSDOM(xml, { contentType: "text/xml" });
  const doc = dom.window.document;

  const isAtom = !!doc.querySelector("feed");
  const items: any[] = [];
  console.debug("[RSS][fetch] detected type", { isAtom });

  const readMediaUrl = (el: Element | null | undefined): string | undefined => {
    if (!el) return undefined;
    const candidates = ["url", "src", "href"];
    for (const k of candidates) {
      const v = el.getAttribute(k);
      if (v) return v;
    }
    return undefined;
  };

  if (isAtom) {
    doc.querySelectorAll("entry").forEach((entry) => {
      const id =
        parseText(entry.querySelector("id")) ||
        parseText(entry.querySelector("guid")) ||
        "";
      const title = parseText(entry.querySelector("title")) || "";
      const linkEl = (entry.querySelector('link[rel="alternate"]') ||
        entry.querySelector("link")) as HTMLAnchorElement | null;
      const link = linkEl?.getAttribute("href") || "";
      const published =
        parseText(entry.querySelector("published")) ||
        parseText(entry.querySelector("updated"));
      const summary =
        parseText(entry.querySelector("summary")) ||
        parseText(entry.querySelector("content"));
      const contentHtml =
        (entry.querySelector("content") as Element | null)?.textContent ||
        undefined;
      const summaryHtml =
        (entry.querySelector("summary") as Element | null)?.textContent ||
        undefined;
      const thumbEl = (entry.querySelector("media\\:thumbnail") ||
        entry.querySelector("media\\:content") ||
        entry.querySelector("thumbnail")) as Element | null;
      const enclosureImg =
        (
          entry.querySelector(
            'link[rel="enclosure"][type^="image/"]',
          ) as Element | null
        )?.getAttribute("href") || undefined;
      const mediaUrl = readMediaUrl(thumbEl);
      const { cleanedHtml: cleanedHtmlA, cleanedText: cleanedTextA } =
        cleanRssContent(contentHtml || summaryHtml, summaryHtml, link);
      const thumbnail = pickThumbnail({
        mediaUrl,
        enclosureUrl: enclosureImg,
        contentHtml: cleanedHtmlA || summaryHtml,
        descriptionHtml: summary || undefined,
        linkUrl: link,
      });
      const isShort =
        /^https?:\/\/(www\.)?youtube\.com\/shorts\//i.test(link) ||
        /#shorts/i.test(title || "") ||
        /#shorts/i.test(summary || "");
      items.push({
        id,
        title,
        link,
        published,
        summary: cleanedTextA || summary,
        thumbnail,
        isShort,
      });
    });
  } else {
    doc.querySelectorAll("item").forEach((item) => {
      const id =
        parseText(item.querySelector("guid")) ||
        parseText(item.querySelector("link")) ||
        "";
      const title = parseText(item.querySelector("title")) || "";
      const link = parseText(item.querySelector("link")) || "";
      const published = parseText(item.querySelector("pubDate"));
      const description =
        parseText(item.querySelector("description")) ||
        parseText(item.querySelector("content\\:encoded"));
      const contentHtml =
        (item.querySelector("content\\:encoded") as Element | null)
          ?.textContent || undefined;
      const descriptionHtml =
        (item.querySelector("description") as Element | null)?.textContent ||
        undefined;
      const thumbEl = (item.querySelector("media\\:thumbnail") ||
        item.querySelector("media\\:content") ||
        item.querySelector("thumbnail")) as Element | null;
      const enclosureImg =
        (
          item.querySelector('enclosure[type^="image/"]') as Element | null
        )?.getAttribute("url") || undefined;
      const mediaUrl = readMediaUrl(thumbEl);
      const { cleanedHtml: cleanedHtmlR, cleanedText: cleanedTextR } =
        cleanRssContent(contentHtml || descriptionHtml, descriptionHtml, link);
      const thumbnail = pickThumbnail({
        mediaUrl,
        enclosureUrl: enclosureImg,
        contentHtml: cleanedHtmlR || descriptionHtml,
        descriptionHtml: description || undefined,
        linkUrl: link,
      });
      const isShort =
        /^https?:\/\/(www\.)?youtube\.com\/shorts\//i.test(link) ||
        /#shorts/i.test(title || "") ||
        /#shorts/i.test(description || "");
      items.push({
        id,
        title,
        link,
        published,
        summary: cleanedTextR || description,
        thumbnail,
        isShort,
      });
    });
  }

  const addYouTubeThumb = (url: string | undefined) => {
    if (!url) return undefined;
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, "");
      let vid: string | null = null;
      if (host === "youtube.com" || host === "m.youtube.com") {
        vid = u.searchParams.get("v");
      } else if (host === "youtu.be") {
        vid = u.pathname.split("/")[1] || null;
      }
      if (vid && /^[A-Za-z0-9_-]{11}$/.test(vid)) {
        return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
      }
    } catch {}
    return undefined;
  };

  const extractFromArticlePage = async (
    linkUrl: string | undefined,
  ): Promise<string | undefined> => {
    if (!linkUrl) return undefined;
    try {
      const r = await fetch(linkUrl, {
        headers: {
          "User-Agent": "OwlRSS/1.0",
          "Accept-Language": "tr-TR,tr;q=0.9",
        },
      });
      if (!r.ok) return undefined;
      const html = await r.text();
      const img = extractFirstImageFromHtml(html, linkUrl);
      return img || undefined;
    } catch {}
    return undefined;
  };

  const enriched = await Promise.all(
    items.map(async (it: any) => {
      if (!it.thumbnail) {
        const yt = addYouTubeThumb(it.link);
        if (yt) return { ...it, thumbnail: yt };
        const pageImg = await extractFromArticlePage(it.link);
        if (pageImg && !urlSuggestsSmallSize(pageImg))
          return { ...it, thumbnail: pageImg };
      }
      if (it.thumbnail && urlSuggestsSmallSize(it.thumbnail)) {
        return { ...it, thumbnail: undefined };
      }
      return it;
    }),
  );

  const lim = Math.max(1, Math.min(50, limit || 20));
  const start = Math.max(0, (page || 0) * lim);
  const sliced = enriched.slice(start, start + lim);
  const hasMore = start + lim < enriched.length;
  return {
    title:
      parseText(doc.querySelector("channel > title")) ||
      parseText(doc.querySelector("feed > title")),
    items: sliced,
    limit: lim,
    page,
    hasMore,
  };
}
