'use client';

import React from 'react';
import { Clock, Music } from 'lucide-react';

interface RecentlyPlayedTimelineProps {
  recentTracks: any[];
  onTrackClick?: (trackId: string, trackName: string, track: any) => void;
}

export function RecentlyPlayedTimeline({ recentTracks, onTrackClick }: RecentlyPlayedTimelineProps) {
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const playedAt = new Date(timestamp);
    const diffMs = now.getTime() - playedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  if (recentTracks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No recently played tracks</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Recently Played</h3>
      </div>

      <div className="space-y-3">
        {recentTracks.map((item, index) => {
          const track = item.track;
          const playedAt = item.played_at;

          return (
            <div
              key={`${track.id}-${playedAt}-${index}`}
              onClick={() => onTrackClick?.(track.id, track.name, track)}
              className="group relative flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition cursor-pointer"
            >
              {/* Timeline Line */}
              {index < recentTracks.length - 1 && (
                <div className="absolute left-[18px] top-12 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-transparent" />
              )}

              {/* Timeline Dot */}
              <div className="relative flex-shrink-0 mt-1">
                <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex gap-3">
                  {/* Album Art */}
                  {track.album?.images?.[2]?.url && (
                    <div className="relative flex-shrink-0">
                      <img
                        src={track.album.images[2].url}
                        alt={track.name}
                        className="w-12 h-12 rounded object-cover shadow-sm group-hover:shadow-md transition"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Music className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate group-hover:text-primary transition">
                      {track.name}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artists?.map((a: any) => a.name).join(', ')}
                    </p>
                    
                    {/* Time Info */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(playedAt)}
                      </span>
                      <span className="text-xs text-muted-foreground/50">•</span>
                      <span className="text-xs text-muted-foreground/70">
                        {formatTime(playedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Track Duration */}
                  {track.duration_ms && (
                    <div className="flex-shrink-0 text-xs text-muted-foreground self-start mt-1">
                      {Math.floor(track.duration_ms / 60000)}:
                      {Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>

                {/* Album Name (hover) */}
                {track.album?.name && (
                  <p className="text-xs text-muted-foreground/60 truncate mt-1 opacity-0 group-hover:opacity-100 transition">
                    {track.album.name}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More Hint */}
      {recentTracks.length >= 10 && (
        <p className="text-xs text-center text-muted-foreground pt-2 border-t border-border">
          Showing last {recentTracks.length} tracks
        </p>
      )}
    </div>
  );
}
