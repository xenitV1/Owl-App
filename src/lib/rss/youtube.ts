export function isYouTubeChannelId(value: string): boolean {
  return /^UC[0-9A-Za-z_-]{22}$/.test(value);
}

export function normalizeYouTubeInput(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("@")) return `https://www.youtube.com/${trimmed}`;
  return `https://www.youtube.com/@${encodeURIComponent(trimmed)}`;
}

export async function resolveYouTubeChannelId(
  input: string,
): Promise<{ channelId: string | null; feedUrl: string | null }> {
  try {
    const raw = input.trim();
    if (isYouTubeChannelId(raw)) {
      return {
        channelId: raw,
        feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${raw}`,
      };
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey) {
      const q = encodeURIComponent(raw);
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${q}&key=${apiKey}`;
      try {
        const r = await fetch(apiUrl);
        if (r.ok) {
          const j = await r.json();
          const chId = j?.items?.[0]?.id?.channelId;
          if (chId) {
            return {
              channelId: chId,
              feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${chId}`,
            };
          }
        }
      } catch {}
    }

    const url = normalizeYouTubeInput(raw);
    const res = await fetch(url, { headers: { "User-Agent": "OwlRSS/1.0" } });
    const html = await res.text();

    let m = html.match(/"channelId":"(UC[0-9A-Za-z_-]{22})"/);
    if (!m) {
      m = html.match(/itemprop="channelId"\s+content="(UC[0-9A-Za-z_-]{22})"/i);
    }
    if (!m) {
      m = html.match(/\/['"]?channel\/(UC[0-9A-Za-z_-]{22})/i);
    }
    const channelId = m ? m[1] : null;
    const feedUrl = channelId
      ? `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
      : null;
    return { channelId, feedUrl };
  } catch {
    return { channelId: null, feedUrl: null };
  }
}

export function isoDurationToSeconds(iso: string | undefined): number | null {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = parseInt(m[1] || "0", 10);
  const mi = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  return h * 3600 + mi * 60 + s;
}

export async function fetchYouTubePopular(
  regionCode: string,
  limit: number,
  page: number,
): Promise<{
  items: Array<{
    id: string;
    title: string;
    link: string;
    published?: string;
    summary?: string;
    thumbnail?: string;
    isShort?: boolean;
  }>;
  limit: number;
  page: number;
  hasMore: boolean;
}> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YouTube API key not configured");
  }
  const rc = regionCode || "US";
  const max = Math.max(1, Math.min(50, limit || 20));
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&maxResults=${max}&regionCode=${encodeURIComponent(rc)}&key=${apiKey}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`YouTube API error: ${r.status}`);
  const j = await r.json();
  const items = (j.items || []).map((it: any) => {
    const vid = it.id;
    const sn = it.snippet || {};
    const tn = sn.thumbnails || {};
    const thumb =
      tn.medium?.url || tn.high?.url || tn.standard?.url || tn.default?.url;
    const durSec = isoDurationToSeconds(it?.contentDetails?.duration);
    return {
      id: vid,
      title: sn.title || "",
      link: `https://www.youtube.com/watch?v=${vid}`,
      published: sn.publishedAt,
      summary: sn.description || "",
      thumbnail: thumb,
      isShort:
        typeof durSec === "number"
          ? durSec <= 60
          : /#shorts/i.test(sn.title || ""),
    };
  });
  const hasMore = false;
  return { items, limit: max, page, hasMore };
}
