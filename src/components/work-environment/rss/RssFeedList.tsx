"use client";

import { useTranslations } from "next-intl";
import type { FeedItem } from "@/types/rssFeed";

interface RssFeedListProps {
  items: FeedItem[];
  currentProvider: any;
  showShorts: boolean;
  contentScale: number;
  onItemClick: (e: React.MouseEvent<HTMLAnchorElement>, item: FeedItem) => void;
}

export function RssFeedList({
  items,
  currentProvider,
  showShorts,
  contentScale,
  onItemClick,
}: RssFeedListProps) {
  const t = useTranslations();

  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("rss.noItems", { default: "No items" })}
      </div>
    );
  }

  // Spotify layout - tracks with numbers
  if (currentProvider?.id === "spotify") {
    return (
      <div>
        <div className="text-xs font-medium text-muted-foreground px-1 mb-1">
          {currentProvider?.providerOpts?.type === "playlist" &&
            t("spotify.playlistTracks", {
              default: "Playlist Şarkıları",
            })}
          {currentProvider?.providerOpts?.type === "album" &&
            t("spotify.albumTracks", { default: "Albüm Şarkıları" })}
          {currentProvider?.providerOpts?.type === "artist" &&
            t("spotify.topTracks", { default: "Popüler Şarkılar" })}
        </div>
        {items.map((it, idx) => (
          <a
            key={(it.id || it.link || "") + idx}
            href={it.link}
            onClick={(e) => onItemClick(e, it)}
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
              <div className="text-sm font-medium truncate">{it.title}</div>
              {it.summary && (
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {it.summary}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    );
  }

  // YouTube layout - videos and shorts
  return (
    <div
      className={`grid grid-cols-1 ${
        currentProvider?.id === "youtube" && showShorts
          ? "md:grid-cols-[1fr_minmax(280px,360px)]"
          : "md:grid-cols-1"
      } gap-3`}
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
              onClick={(e) => onItemClick(e, it)}
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
                <div className="text-sm font-medium truncate">{it.title}</div>
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
                onClick={(e) => onItemClick(e, it)}
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
  );
}
