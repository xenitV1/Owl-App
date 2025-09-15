"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Rss } from 'lucide-react';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';

interface RssFeedCardProps {
  cardId: string;
  cardData?: any;
  onUpdate?: (updates: any) => void;
}

interface FeedItem {
  id: string;
  title: string;
  link: string;
  published?: string;
  summary?: string;
}

// Helpers to detect/prepare media embeds
const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  try {
    const u = new URL(url);
    return u.searchParams.get('v');
  } catch {
    return null;
  }
};

const extractSpotifyEmbedUrl = (url: string): string | null => {
  const m = url.match(/spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
  if (!m) return null;
  const [, type, id] = m;
  return `https://open.spotify.com/embed/${type}/${id}`;
};

export function RssFeedCard({ cardId, cardData, onUpdate }: RssFeedCardProps) {
  const [siteUrl, setSiteUrl] = useState<string>(cardData?.rss?.siteUrl || '');
  const [feeds, setFeeds] = useState<Array<{ url: string; type: string; title?: string }>>([]);
  const [selectedFeed, setSelectedFeed] = useState<string>(cardData?.rss?.feedUrl || '');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { cards, addCard } = useWorkspaceStore();

  const canDiscover = useMemo(() => siteUrl.startsWith('http'), [siteUrl]);

  const persist = (updates: any) => {
    console.debug('[RssFeedCard][persist]', { cardId, updates });
    onUpdate?.({ platformContentConfig: undefined, rssData: undefined, ...updates });
  };

  const discover = async () => {
    if (!canDiscover) return;
    setLoading(true); setError(null);
    console.info('[RssFeedCard][discover] start', { siteUrl, cardId });
    try {
      const res = await fetch(`/api/rss?url=${encodeURIComponent(siteUrl)}`);
      console.debug('[RssFeedCard][discover] response', { ok: res.ok, status: res.status });
      const data = await res.json();
      console.debug('[RssFeedCard][discover] feeds', data);
      setFeeds(data.feeds || []);
      persist({ content: JSON.stringify({ rss: { siteUrl } }) });
    } catch (e: any) {
      console.error('[RssFeedCard][discover] error', e);
      setError(e?.message || 'Discovery failed');
    } finally {
      setLoading(false);
    }
  };

  const loadFeed = async (feedUrl: string) => {
    if (!feedUrl) return;
    setLoading(true); setError(null);
    console.info('[RssFeedCard][loadFeed] start', { feedUrl, cardId });
    try {
      const res = await fetch(`/api/rss?feed=${encodeURIComponent(feedUrl)}`);
      console.debug('[RssFeedCard][loadFeed] response', { ok: res.ok, status: res.status });
      const data = await res.json();
      console.debug('[RssFeedCard][loadFeed] items', { title: data.title, count: data.items?.length });
      setItems(data.items || []);
      persist({ content: JSON.stringify({ rss: { siteUrl, feedUrl } }) });
    } catch (e: any) {
      console.error('[RssFeedCard][loadFeed] error', e);
      setError(e?.message || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFeed) {
      loadFeed(selectedFeed);
    }
  }, [selectedFeed]);

  const createMediaCard = (videoType: 'youtube' | 'spotify', videoUrl: string, videoTitle?: string) => {
    const baseX = cardData?.position?.x ?? 0;
    const baseY = cardData?.position?.y ?? 0;
    const baseW = cardData?.size?.width ?? 400;
    const offset = 40;

    const newCard = {
      id: `card-${Date.now()}`,
      type: 'platformContent' as const,
      title: videoTitle || (videoType === 'youtube' ? 'YouTube Video' : 'Spotify'),
      content: JSON.stringify({ videoType, videoUrl, videoTitle, connectedTo: { sourceCardId: cardId } }),
      position: { x: baseX + baseW + offset, y: baseY },
      size: { width: 480, height: 320 },
      zIndex: (cards?.length || 0) + 1,
    };

    console.info('[RssFeedCard] add media card', newCard);
    addCard(newCard as any);
  };

  const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>, item: FeedItem) => {
    e.preventDefault();
    const { link, title } = item;

    // YouTube
    const yt = extractYouTubeVideoId(link);
    if (yt) {
      createMediaCard('youtube', link, title);
      return;
    }

    // Spotify
    const sp = extractSpotifyEmbedUrl(link);
    if (sp) {
      createMediaCard('spotify', link, title);
      return;
    }

    // Fallback: open in new tab (most sites disallow iframes)
    console.info('[RssFeedCard] open external', { link });
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Rss className="h-4 w-4" /> RSS Feed
          </CardTitle>
          <div className="flex items-center gap-2" />
        </div>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="https://site.com"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
          />
          <Button variant="outline" onClick={discover} disabled={!canDiscover || loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Discover'}
          </Button>
        </div>
        {feeds.length > 0 && (
          <div className="mt-2">
            <Select value={selectedFeed} onValueChange={(v) => { console.debug('[RssFeedCard] select feed', v); setSelectedFeed(v); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a feed" />
              </SelectTrigger>
              <SelectContent>
                {feeds.map((f) => (
                  <SelectItem key={f.url} value={f.url}>
                    {f.title || f.url} ({f.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {error && <div className="text-xs text-red-500 mt-2">{error}</div>}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading...
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="text-sm text-muted-foreground">No items</div>
        )}
        <div className="space-y-2">
          {items.map((it, idx) => (
            <a
              key={(it.id || it.link || '') + idx}
              href={it.link}
              onClick={(e) => handleItemClick(e, it)}
              className="block p-2 rounded border hover:bg-muted/40 cursor-pointer"
            >
              <div className="text-sm font-medium truncate">{it.title}</div>
              {it.published && <div className="text-xs text-muted-foreground">{new Date(it.published).toLocaleString()}</div>}
              {it.summary && <div className="text-xs text-muted-foreground line-clamp-2">{it.summary}</div>}
            </a>
          ))}
        </div>
      </CardContent>
    </div>
  );
}

export default RssFeedCard;
