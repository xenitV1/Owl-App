"use client";

import { useEffect, useMemo, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Rss } from "lucide-react";
import { useWorkspaceStore } from "@/hooks/useWorkspaceStore";
import {
  rssProviders,
  getProvider,
  type ProviderOption,
  rssCategories,
  type RssCategory,
  type RssLang,
} from "@/lib/rssProviders";
import { useTranslations } from "next-intl";
import { useLoadingMessages } from "@/hooks/useLoadingMessages";

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
  thumbnail?: string;
  isShort?: boolean;
  embedUrl?: string;
  isSpotify?: boolean;
  trackNumber?: number;
}

// Helpers to detect/prepare media embeds
const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  try {
    const u = new URL(url);
    return u.searchParams.get("v");
  } catch {
    return null;
  }
};

const extractSpotifyEmbedUrl = (url: string): string | null => {
  // Handle full URLs
  const fullUrlMatch = url.match(
    /spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/,
  );
  if (fullUrlMatch) {
    const [, type, id] = fullUrlMatch;
    return `https://open.spotify.com/embed/${type}/${id}`;
  }

  // Handle embed URLs (with anchor for security)
  const embedMatch = url.match(
    /^https?:\/\/open\.spotify\.com\/embed\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/,
  );
  if (embedMatch) {
    return url; // Already an embed URL
  }

  // Handle just IDs (assume playlist if no type specified)
  if (/^[a-zA-Z0-9]+$/.test(url)) {
    return `https://open.spotify.com/embed/playlist/${url}`;
  }

  return null;
};

const extractSpotifyId = (input: string, type: string): string | null => {
  // If it's already just an ID
  if (/^[a-zA-Z0-9]+$/.test(input)) {
    return input;
  }

  // Extract from full Spotify URL
  const urlMatch = input.match(
    /spotify\.com\/(?:track|album|playlist|artist)\/([a-zA-Z0-9]+)/,
  );
  if (urlMatch) {
    return urlMatch[1];
  }

  // Extract from embed URL
  const embedMatch = input.match(
    /open\.spotify\.com\/embed\/(?:track|album|playlist|artist)\/([a-zA-Z0-9]+)/,
  );
  if (embedMatch) {
    return embedMatch[1];
  }

  return null;
};

export function RssFeedCard({ cardId, cardData, onUpdate }: RssFeedCardProps) {
  const t = useTranslations();
  const [category, setCategory] = useState<RssCategory | "">("");
  const [providerId, setProviderId] = useState<string>(
    cardData?.rss?.providerId || "",
  );
  const [providerOpts, setProviderOpts] = useState<Record<string, string>>(
    cardData?.rss?.providerOpts || {},
  );
  const [selectedFeed, setSelectedFeed] = useState<string>(
    cardData?.rss?.feedUrl || "",
  );
  const [items, setItems] = useState<FeedItem[]>([]);
  const [rssLang, setRssLang] = useState<RssLang>(
    (cardData?.rss?.lang as RssLang) || "en",
  );
  const [contentScale, setContentScale] = useState<number>(
    typeof cardData?.rss?.scale === "number" ? cardData.rss.scale : 1,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShorts, setShowShorts] = useState<boolean>(true);

  const { currentMessage } = useLoadingMessages({
    isLoading: loading,
    messageKeys: [
      "connecting",
      "fetching",
      "analyzing",
      "preparing",
      "optimizing",
    ],
    interval: 1500,
  });

  const { cards, addCard } = useWorkspaceStore();

  const currentProvider = useMemo(() => getProvider(providerId), [providerId]);
  const canBuild = useMemo(() => {
    if (!currentProvider) return false;
    for (const opt of currentProvider.options) {
      if (opt.required && !providerOpts[opt.key]) return false;
    }
    return true;
  }, [currentProvider, providerOpts]);

  const persist = (updates: any) => {
    console.debug("[RssFeedCard][persist]", { cardId, updates });
    onUpdate?.({
      platformContentConfig: undefined,
      rssData: undefined,
      ...updates,
    });
  };

  const buildFeedUrl = () => {
    if (!currentProvider) return "";
    const url = currentProvider.buildUrl(providerOpts) || "";
    return url;
  };

  const loadFeed = async (feedUrl: string) => {
    if (!feedUrl) return;
    setLoading(true);
    setError(null);
    console.info("[RssFeedCard][loadFeed] start", { feedUrl, cardId });
    try {
      const res = await fetch(
        `/api/rss?feed=${encodeURIComponent(feedUrl)}&limit=15`,
      );
      console.debug("[RssFeedCard][loadFeed] response", {
        ok: res.ok,
        status: res.status,
      });
      const data = await res.json();
      console.debug("[RssFeedCard][loadFeed] items", {
        title: data.title,
        count: data.items?.length,
      });
      setItems(data.items || []);
      // Informational: we could surface data.limit in UI if desired
      persist({
        content: JSON.stringify({ rss: { providerId, providerOpts, feedUrl } }),
      });
    } catch (e: any) {
      console.error("[RssFeedCard][loadFeed] error", e);
      setError(e?.message || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFeed) {
      setItems([]);
      loadFeed(selectedFeed);
    }
  }, [selectedFeed]);

  const createMediaCard = (
    videoType: "youtube" | "spotify",
    videoUrl: string,
    videoTitle?: string,
  ) => {
    const baseX = cardData?.position?.x ?? 0;
    const baseY = cardData?.position?.y ?? 0;
    const baseW = cardData?.size?.width ?? 400;
    const offset = 40;

    const newCard = {
      id: `card-${Date.now()}`,
      type: "platformContent" as const,
      title:
        videoTitle || (videoType === "youtube" ? "YouTube Video" : "Spotify"),
      content: JSON.stringify({
        videoType,
        videoUrl,
        videoTitle,
        connectedTo: { sourceCardId: cardId },
      }),
      position: { x: baseX + baseW + offset, y: baseY },
      size: { width: 1000, height: 680 },
      zIndex: (cards?.length || 0) + 1,
    };

    console.info("[RssFeedCard] add media card", newCard);
    addCard(newCard as any);
  };

  const createWebCard = (webUrl: string, webTitle?: string) => {
    const baseX = cardData?.position?.x ?? 0;
    const baseY = cardData?.position?.y ?? 0;
    const baseW = cardData?.size?.width ?? 400;
    const offset = 40;

    const newCard = {
      id: `card-${Date.now()}`,
      type: "platformContent" as const,
      title: webTitle || "Web Page",
      content: JSON.stringify({
        webUrl,
        webTitle,
        connectedTo: { sourceCardId: cardId },
      }),
      position: { x: baseX + baseW + offset, y: baseY },
      size: { width: 1200, height: 800 },
      zIndex: (cards?.length || 0) + 1,
    };

    console.info("[RssFeedCard] add web card", newCard);
    addCard(newCard as any);
  };

  const handleItemClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: FeedItem,
  ) => {
    e.preventDefault();
    const { link, title } = item;

    // YouTube
    const yt = extractYouTubeVideoId(link);
    if (yt) {
      createMediaCard("youtube", link, title);
      return;
    }

    // Spotify from API response (when isSpotify is true)
    if ((item as any).isSpotify && (item as any).embedUrl) {
      createMediaCard("spotify", (item as any).embedUrl, title);
      return;
    }

    // Spotify from link
    const sp = extractSpotifyEmbedUrl(link);
    if (sp) {
      createMediaCard("spotify", link, title);
      return;
    }

    // Default: create web card for news and other content
    console.info("[RssFeedCard] create web card", { link, title });
    createWebCard(link, title);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Rss className="h-4 w-4" />{" "}
            {t("rss.title", { default: "RSS Feed" })}
          </CardTitle>
          <div className="flex items-center gap-3">
            {currentProvider?.id === "youtube" &&
              (showShorts ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShorts(false)}
                >
                  {t("rss.hide", { default: "Gizle" })}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShorts(true)}
                >
                  {t("rss.showShorts", { default: "Show Shorts" })}
                </Button>
              ))}
          </div>
        </div>
        <div className="flex gap-2 mt-2 items-center">
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v as RssCategory);
              setProviderId("");
              setProviderOpts({});
            }}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t("rss.selectCategory", {
                  default: "Kategori seçin",
                })}
              />
            </SelectTrigger>
            <SelectContent>
              {rssCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {t(c.i18nKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* RSS language selector (only affects non-social categories) */}
          <Select
            value={rssLang}
            onValueChange={(v) => setRssLang(v as RssLang)}
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Lang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="tr">TR</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={providerId}
            onValueChange={(v) => {
              setProviderId(v);
              setProviderOpts({});
            }}
            disabled={!category}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t("rss.selectProvider", {
                  default: "RSS Kaynağı seçin",
                })}
              />
            </SelectTrigger>
            <SelectContent>
              {rssProviders
                .filter((p) => !category || p.category === category)
                .filter(
                  (p) =>
                    p.category === "social" || !p.lang || p.lang === rssLang,
                )
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        {currentProvider && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {currentProvider.options
              .filter((opt: ProviderOption) => {
                if (
                  opt.key === "region" &&
                  !(
                    currentProvider.id === "youtube" &&
                    providerOpts.mode === "popular"
                  )
                )
                  return false;
                if (
                  opt.key === "value" &&
                  currentProvider.id === "youtube" &&
                  providerOpts.mode === "popular"
                )
                  return false;
                return true;
              })
              .map((opt: ProviderOption) =>
                opt.type === "select" ? (
                  <Select
                    key={opt.key}
                    value={providerOpts[opt.key] || ""}
                    onValueChange={(v) =>
                      setProviderOpts((prev) => ({ ...prev, [opt.key]: v }))
                    }
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue
                        placeholder={
                          currentProvider.id === "youtube" && opt.key === "mode"
                            ? t("rss.youtube.modeLabel", { default: "Type" })
                            : opt.label
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {opt.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {currentProvider.id === "youtube" &&
                          opt.key === "mode"
                            ? t(`rss.youtube.mode.${o.value}`, {
                                default: o.label,
                              })
                            : o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    key={opt.key}
                    placeholder={
                      currentProvider.id === "youtube"
                        ? opt.key === "value"
                          ? t("rss.youtube.valuePlaceholder", {
                              default: "@handle or name (UC… accepted)",
                            })
                          : opt.key === "region"
                            ? t("rss.youtube.regionPlaceholder", {
                                default: "TR, US, DE…",
                              })
                            : opt.placeholder || opt.label
                        : opt.placeholder || opt.label
                    }
                    value={providerOpts[opt.key] || ""}
                    onChange={(e) =>
                      setProviderOpts((prev) => ({
                        ...prev,
                        [opt.key]: e.target.value,
                      }))
                    }
                    className={opt.key === "region" ? "w-28" : "w-72"}
                  />
                ),
              )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  let url = buildFeedUrl();
                  if (currentProvider?.id === "youtube") {
                    if (providerOpts.mode === "user" && providerOpts.value) {
                      try {
                        const res = await fetch(
                          `/api/rss?youtubeResolve=${encodeURIComponent(providerOpts.value)}`,
                        );
                        const data = await res.json();
                        if (data?.feedUrl) url = data.feedUrl;
                      } catch {}
                    } else if (providerOpts.mode === "popular") {
                      try {
                        const region = providerOpts.region || "TR";
                        const res = await fetch(
                          `/api/rss?youtubePopular=${encodeURIComponent(region)}`,
                        );
                        const data = await res.json();
                        // For popular, we don't have an RSS URL; directly set items
                        if (Array.isArray(data?.items)) {
                          setItems(data.items);
                          persist({
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
                      } catch {}
                    }
                  } else if (currentProvider?.id === "spotify") {
                    if (providerOpts.type && providerOpts.id) {
                      try {
                        // Extract Spotify ID from input (could be URL, embed, or just ID)
                        const spotifyId = extractSpotifyId(
                          providerOpts.id,
                          providerOpts.type,
                        );
                        if (!spotifyId) {
                          console.error(
                            "[RssFeedCard] Could not extract Spotify ID from:",
                            providerOpts.id,
                          );
                          return;
                        }

                        const res = await fetch(
                          `/api/rss?spotify${providerOpts.type}=${encodeURIComponent(spotifyId)}`,
                        );
                        const data = await res.json();
                        // For Spotify, we get items directly since there's no RSS feed
                        if (Array.isArray(data?.items)) {
                          setItems(data.items);
                          persist({
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
                        console.error(
                          "[RssFeedCard] Spotify API error:",
                          error,
                        );
                      }
                    }
                  }
                  if (url) {
                    setSelectedFeed(url);
                    persist({
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
                }}
                disabled={!canBuild || loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  t("rss.load", { default: "Yükle" })
                )}
              </Button>
            </div>
          </div>
        )}
        {error && <div className="text-xs text-red-500 mt-2">{error}</div>}
      </CardHeader>

      <CardContent
        className="flex-1 overflow-auto pr-1 pb-4"
        style={{ fontSize: `${contentScale}em` }}
      >
        {loading && (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            {currentMessage || t("common.loading")}
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="text-sm text-muted-foreground">
            {t("rss.noItems", { default: "No items" })}
          </div>
        )}
        <div className="space-y-2 pb-8">
          {items.length > 0 && (
            <div className="text-xs text-muted-foreground px-1">
              {t("rss.limitInfo", {
                default: "Showing up to {count} items",
                count: 15,
              })}
            </div>
          )}
          {/** Show different layouts based on provider */}
          {currentProvider?.id === "spotify" ? (
            // Spotify layout - show tracks with numbers
            <div>
              <div className="text-xs font-medium text-muted-foreground px-1 mb-1">
                {currentProvider?.id === "spotify" &&
                  providerOpts.type === "playlist" &&
                  t("spotify.playlistTracks", {
                    default: "Playlist Şarkıları",
                  })}
                {currentProvider?.id === "spotify" &&
                  providerOpts.type === "album" &&
                  t("spotify.albumTracks", { default: "Albüm Şarkıları" })}
                {currentProvider?.id === "spotify" &&
                  providerOpts.type === "artist" &&
                  t("spotify.topTracks", { default: "Popüler Şarkılar" })}
              </div>
              {items.map((it, idx) => (
                <a
                  key={(it.id || it.link || "") + idx}
                  href={it.link}
                  onClick={(e) => handleItemClick(e, it)}
                  className="flex gap-3 p-2 rounded border hover:bg-muted/40 cursor-pointer items-start"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-muted rounded text-xs font-medium text-muted-foreground">
                    {it.trackNumber || idx + 1}
                  </div>
                  {it.thumbnail && (
                    <img
                      src={it.thumbnail}
                      alt="album art"
                      className="object-cover rounded"
                      style={{
                        width: `${48 * contentScale}px`,
                        height: `${48 * contentScale}px`,
                      }}
                    />
                  )}
                  <div
                    className="min-w-0 flex-1"
                    style={{
                      transform: `scale(${contentScale})`,
                      transformOrigin: "top left",
                      width: `${100 / contentScale}%`,
                    }}
                  >
                    <div className="text-sm font-medium truncate">
                      {it.title}
                    </div>
                    {it.summary && (
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {it.summary}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            // YouTube layout
            <div
              className={`grid grid-cols-1 ${currentProvider?.id === "youtube" && showShorts ? "md:grid-cols-[1fr_minmax(280px,360px)]" : "md:grid-cols-1"} gap-3`}
            >
              <div>
                {currentProvider?.id === "youtube" && (
                  <div className="text-xs font-medium text-muted-foreground px-1 mb-1">
                    {t("rss.normalVideos", { default: "Videolar" })}
                  </div>
                )}
                {items
                  .filter((i) => !i.isShort)
                  .map((it, idx) => (
                    <a
                      key={(it.id || it.link || "") + idx}
                      href={it.link}
                      onClick={(e) => handleItemClick(e, it)}
                      className="flex gap-3 p-2 rounded border hover:bg-muted/40 cursor-pointer items-start"
                    >
                      {it.thumbnail && (
                        <img
                          src={it.thumbnail}
                          alt="thumb"
                          className="object-cover rounded"
                          style={{
                            width: `${64 * contentScale}px`,
                            height: `${64 * contentScale}px`,
                          }}
                        />
                      )}
                      <div
                        className="min-w-0 flex-1"
                        style={{
                          transform: `scale(${contentScale})`,
                          transformOrigin: "top left",
                          width: `${100 / contentScale}%`,
                        }}
                      >
                        <div className="text-sm font-medium truncate">
                          {it.title}
                        </div>
                        {it.published && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(it.published).toLocaleString()}
                          </div>
                        )}
                        {it.summary && (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {it.summary}
                          </div>
                        )}
                      </div>
                    </a>
                  ))}
              </div>
              {currentProvider?.id === "youtube" && showShorts && (
                <div className="md:sticky md:top-0 md:self-start">
                  <div className="text-xs font-medium text-muted-foreground px-1 mb-1">
                    {t("rss.shortVideos", { default: "Shorts" })}
                  </div>
                  {items
                    .filter((i) => i.isShort)
                    .map((it, idx) => (
                      <a
                        key={(it.id || it.link || "") + idx}
                        href={it.link}
                        onClick={(e) => handleItemClick(e, it)}
                        className="flex gap-3 p-2 rounded border hover:bg-muted/40 cursor-pointer items-start"
                      >
                        {it.thumbnail && (
                          <img
                            src={it.thumbnail}
                            alt="thumb"
                            className="object-cover rounded"
                            style={{
                              width: `${64 * contentScale}px`,
                              height: `${64 * contentScale}px`,
                            }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium whitespace-normal break-words">
                            {it.title}
                          </div>
                          {it.published && (
                            <div className="text-xs text-muted-foreground whitespace-normal break-words">
                              {new Date(it.published).toLocaleString()}
                            </div>
                          )}
                          {it.summary && (
                            <div className="text-xs text-muted-foreground whitespace-normal break-words">
                              {it.summary}
                            </div>
                          )}
                        </div>
                      </a>
                    ))}
                </div>
              )}
            </div>
          )}
          {/* when shorts hidden, toggle button is rendered in header to avoid scroll jump */}
          {/* Fixed 15 items per server; no auto-load beyond limit */}
        </div>
      </CardContent>
    </div>
  );
}

export default RssFeedCard;
