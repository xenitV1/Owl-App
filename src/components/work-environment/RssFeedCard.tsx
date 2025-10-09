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
import { useRssFeedLoader } from "@/hooks/useRssFeedLoader";
import { RssFeedList } from "./rss/RssFeedList";
import {
  extractYouTubeVideoId,
  extractSpotifyEmbedUrl,
} from "@/utils/rssMediaHelpers";
import type { RssFeedCardProps, FeedItem } from "@/types/rssFeed";

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
  const [showShorts, setShowShorts] = useState<boolean>(true);

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

  const { loading, error, loadFeed, handleLoadClick } = useRssFeedLoader({
    currentProvider,
    providerOpts,
    category,
    rssLang,
    providerId,
    cardId,
    onItemsUpdate: setItems,
    onPersist: persist,
  });

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

  useEffect(() => {
    if (selectedFeed) {
      setItems([]);
      loadFeed(selectedFeed);
    }
  }, [selectedFeed, loadFeed]);

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
                onClick={handleLoadClick}
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
          <RssFeedList
            items={items}
            currentProvider={currentProvider}
            showShorts={showShorts}
            contentScale={contentScale}
            onItemClick={handleItemClick}
          />
        </div>
      </CardContent>
    </div>
  );
}

export default RssFeedCard;
