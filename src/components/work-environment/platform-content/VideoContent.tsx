"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";
import { VideoPlayer } from "@/components/media/VideoPlayer";

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("v");
  } catch {
    return null;
  }
}

function extractSpotifyEmbedUrl(url: string): string | null {
  const patterns = [
    /spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const [, type, id] = match;
      return `https://open.spotify.com/embed/${type}/${id}`;
    }
  }
  return null;
}

export function VideoContent({ content }: { content: string }) {
  try {
    const mediaData = JSON.parse(content);
    const { videoType, videoUrl, videoFile, videoTitle } = mediaData;

    return (
      <div className="w-full h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="text-lg">
                {videoType === "spotify"
                  ? "🎵"
                  : videoType === "youtube"
                    ? "▶️"
                    : "🎬"}
              </span>
              {videoTitle ||
                (videoType === "spotify"
                  ? "Spotify"
                  : videoType === "youtube"
                    ? "YouTube Video"
                    : "Video")}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {videoType === "spotify"
                ? "Spotify"
                : videoType === "youtube"
                  ? "YouTube"
                  : videoType === "direct"
                    ? "Video URL"
                    : "Local File"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <div
            className="w-full bg-muted rounded-md overflow-hidden relative"
            style={{
              height: videoType === "spotify" ? "352px" : "auto",
              aspectRatio: videoType === "spotify" ? "auto" : "16/9",
            }}
          >
            {videoType === "youtube" && videoUrl && (
              <>
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeVideoId(videoUrl) || "dQw4w9WgXcQ"}?rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  title="YouTube Video"
                  onError={(e) => {
                    const target = e.target as HTMLIFrameElement;
                    target.style.display = "none";
                    const fallback =
                      target.parentElement?.querySelector(".youtube-fallback");
                    if (fallback)
                      (fallback as HTMLElement).style.display = "flex";
                  }}
                />
                <div className="youtube-fallback absolute inset-0 items-center justify-center bg-muted/50 hidden flex-col">
                  <div className="text-center p-4">
                    <Play className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      YouTube Video
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Video may be blocked by privacy settings
                    </p>
                    <a
                      href={
                        videoUrl.startsWith("http")
                          ? videoUrl
                          : `https://www.youtube.com/watch?v=${videoUrl}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-2 inline-block"
                    >
                      Open in YouTube
                    </a>
                  </div>
                </div>
              </>
            )}
            {videoType === "spotify" && videoUrl && (
              <iframe
                src={
                  extractSpotifyEmbedUrl(videoUrl) ||
                  "https://open.spotify.com/embed/playlist/2VLBh9qpGUB7a6hQxIdGtw"
                }
                style={{ width: "100%", height: "100%" }}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title="Spotify"
              />
            )}
            {videoType === "direct" && videoUrl && (
              <VideoPlayer src={videoUrl} />
            )}
            {videoType === "file" && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Play className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Local video file: {videoFile}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Local file playback not supported in this view
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    );
  } catch (error) {
    console.error("Error parsing video data:", error);
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500">Error loading video content</p>
        </div>
      </div>
    );
  }
}
