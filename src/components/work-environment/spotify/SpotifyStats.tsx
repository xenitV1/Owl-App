import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Headphones,
  Users,
  Disc,
  Music,
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  Heart,
} from "lucide-react";

interface SpotifyStatsProps {
  savedTracks: any[];
  savedAlbums: any[];
  followedArtists: any[];
  playlists: any[];
  topArtists: any[];
  recentlyPlayed: any[];
  currentlyPlaying: any;
  timeRange: "short_term" | "medium_term" | "long_term";
  onTimeRangeChange: (
    range: "short_term" | "medium_term" | "long_term",
  ) => void;
}

export function SpotifyStats({
  savedTracks,
  savedAlbums,
  followedArtists,
  playlists,
  topArtists,
  recentlyPlayed,
  currentlyPlaying,
  timeRange,
  onTimeRangeChange,
}: SpotifyStatsProps) {
  // Calculate top genres from top artists
  const topGenres = Array.from(
    new Set(
      topArtists.flatMap((artist: any) => artist.genres || []).slice(0, 10),
    ),
  ).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Listening Overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Headphones className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium">Total Tracks</p>
          </div>
          <p className="text-2xl font-bold">
            {savedTracks.length + topArtists.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Saved & Top</p>
        </div>

        <div className="bg-primary/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium">Artists</p>
          </div>
          <p className="text-2xl font-bold">{followedArtists.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Following</p>
        </div>

        <div className="bg-primary/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Disc className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium">Albums</p>
          </div>
          <p className="text-2xl font-bold">{savedAlbums.length}</p>
          <p className="text-xs text-muted-foreground mt-1">In Library</p>
        </div>

        <div className="bg-primary/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Music className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium">Playlists</p>
          </div>
          <p className="text-2xl font-bold">{playlists.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Created</p>
        </div>
      </div>

      {/* Top Genres */}
      <div className="pt-2 border-t">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="h-3 w-3" />
          Top Genres
        </div>
        {topGenres.length > 0 ? (
          <div className="space-y-2">
            {topGenres.map((genre: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs capitalize">{genre}</span>
                <Badge variant="secondary" className="text-xs">
                  {
                    topArtists.filter((a: any) => a.genres?.includes(genre))
                      .length
                  }{" "}
                  artists
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            No genre data available
          </p>
        )}
      </div>

      {/* Listening Time Ranges */}
      <div className="pt-2 border-t">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
          <Calendar className="h-3 w-3" />
          Time Periods
        </div>
        <div className="space-y-2">
          <Button
            variant={timeRange === "short_term" ? "default" : "outline"}
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => onTimeRangeChange("short_term")}
          >
            <Clock className="h-3 w-3 mr-2" />
            Last 4 Weeks
          </Button>
          <Button
            variant={timeRange === "medium_term" ? "default" : "outline"}
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => onTimeRangeChange("medium_term")}
          >
            <Calendar className="h-3 w-3 mr-2" />
            Last 6 Months
          </Button>
          <Button
            variant={timeRange === "long_term" ? "default" : "outline"}
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => onTimeRangeChange("long_term")}
          >
            <TrendingUp className="h-3 w-3 mr-2" />
            All Time
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Current view:{" "}
          <span className="font-medium">
            {timeRange === "short_term"
              ? "Last 4 Weeks"
              : timeRange === "medium_term"
                ? "Last 6 Months"
                : "All Time"}
          </span>
        </p>
      </div>

      {/* Activity Summary */}
      <div className="pt-2 border-t">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="h-3 w-3" />
          Recent Activity
        </div>
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          {currentlyPlaying && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs">Currently listening</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs">
              {recentlyPlayed.length} tracks played recently
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs">
              {savedTracks.length} tracks in your library
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
