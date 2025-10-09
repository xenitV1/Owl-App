import { useState, useCallback } from "react";
import { extractSpotifyId } from "@/utils/rssMediaHelpers";
import type { FeedItem } from "@/types/rssFeed";
import type { RssCategory, RssLang } from "@/lib/rssProviders";

interface UseRssFeedLoaderProps {
  currentProvider: any;
  providerOpts: Record<string, string>;
  category: RssCategory | "";
  rssLang: RssLang;
  providerId: string;
  cardId: string;
  onItemsUpdate: (items: FeedItem[]) => void;
  onPersist: (updates: any) => void;
}

export function useRssFeedLoader({
  currentProvider,
  providerOpts,
  category,
  rssLang,
  providerId,
  cardId,
  onItemsUpdate,
  onPersist,
}: UseRssFeedLoaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildFeedUrl = useCallback(() => {
    if (!currentProvider) return "";
    const url = currentProvider.buildUrl(providerOpts) || "";
    return url;
  }, [currentProvider, providerOpts]);

  const loadFeed = useCallback(
    async (feedUrl: string) => {
      if (!feedUrl) return;
      setLoading(true);
      setError(null);
      console.info("[useRssFeedLoader][loadFeed] start", { feedUrl, cardId });

      try {
        const res = await fetch(
          `/api/rss?feed=${encodeURIComponent(feedUrl)}&limit=15`,
        );
        console.debug("[useRssFeedLoader][loadFeed] response", {
          ok: res.ok,
          status: res.status,
        });
        const data = await res.json();
        console.debug("[useRssFeedLoader][loadFeed] items", {
          title: data.title,
          count: data.items?.length,
        });

        onItemsUpdate(data.items || []);
        onPersist({
          content: JSON.stringify({
            rss: { providerId, providerOpts, feedUrl },
          }),
        });
      } catch (e: any) {
        console.error("[useRssFeedLoader][loadFeed] error", e);
        setError(e?.message || "Failed to load feed");
      } finally {
        setLoading(false);
      }
    },
    [cardId, providerId, providerOpts, onItemsUpdate, onPersist],
  );

  const handleLoadClick = useCallback(async () => {
    let url = buildFeedUrl();

    // YouTube-specific logic
    if (currentProvider?.id === "youtube") {
      if (providerOpts.mode === "user" && providerOpts.value) {
        try {
          const res = await fetch(
            `/api/rss?youtubeResolve=${encodeURIComponent(providerOpts.value)}`,
          );
          const data = await res.json();
          if (data?.feedUrl) url = data.feedUrl;
        } catch {
          console.error("[useRssFeedLoader] YouTube resolve failed");
        }
      } else if (providerOpts.mode === "popular") {
        try {
          const region = providerOpts.region || "TR";
          const res = await fetch(
            `/api/rss?youtubePopular=${encodeURIComponent(region)}`,
          );
          const data = await res.json();

          if (Array.isArray(data?.items)) {
            onItemsUpdate(data.items);
            onPersist({
              content: JSON.stringify({
                rss: {
                  category,
                  providerId,
                  providerOpts,
                  feedUrl: null,
                },
              }),
            });
            return;
          }
        } catch {
          console.error("[useRssFeedLoader] YouTube popular failed");
        }
      }
    }
    // Spotify-specific logic
    else if (currentProvider?.id === "spotify") {
      if (providerOpts.type && providerOpts.id) {
        try {
          const spotifyId = extractSpotifyId(
            providerOpts.id,
            providerOpts.type,
          );

          if (!spotifyId) {
            console.error(
              "[useRssFeedLoader] Could not extract Spotify ID from:",
              providerOpts.id,
            );
            return;
          }

          const res = await fetch(
            `/api/rss?spotify${providerOpts.type}=${encodeURIComponent(spotifyId)}`,
          );
          const data = await res.json();

          if (Array.isArray(data?.items)) {
            onItemsUpdate(data.items);
            onPersist({
              content: JSON.stringify({
                rss: {
                  category,
                  providerId,
                  providerOpts,
                  feedUrl: null,
                },
              }),
            });
            return;
          }
        } catch (error) {
          console.error("[useRssFeedLoader] Spotify API error:", error);
        }
      }
    }

    // Generic RSS feed loading
    if (url) {
      await loadFeed(url);
      onPersist({
        content: JSON.stringify({
          rss: {
            category,
            providerId,
            providerOpts,
            feedUrl: url,
            lang: rssLang,
          },
        }),
      });
    }
  }, [
    buildFeedUrl,
    currentProvider,
    providerOpts,
    category,
    providerId,
    rssLang,
    loadFeed,
    onItemsUpdate,
    onPersist,
  ]);

  return {
    loading,
    error,
    buildFeedUrl,
    loadFeed,
    handleLoadClick,
  };
}
