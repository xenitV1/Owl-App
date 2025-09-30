'use client';

import React from 'react';
import { Music2, TrendingUp, Headphones } from 'lucide-react';

interface TopTracksChartProps {
  tracks: any[];
  timeRange: 'short_term' | 'medium_term' | 'long_term';
  onTimeRangeChange: (range: 'short_term' | 'medium_term' | 'long_term') => void;
  onTrackClick?: (trackId: string, trackName: string, track: any) => void;
}

export function TopTracksChart({ tracks, timeRange, onTimeRangeChange, onTrackClick }: TopTracksChartProps) {
  const timeRangeLabels = {
    short_term: 'Last 4 Weeks',
    medium_term: 'Last 6 Months',
    long_term: 'All Time'
  };

  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music2 className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">Top Tracks</h3>
        </div>
        <select 
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value as any)}
          className="text-xs border rounded px-2 py-1 bg-background"
        >
          <option value="short_term">Last 4 Weeks</option>
          <option value="medium_term">Last 6 Months</option>
          <option value="long_term">All Time</option>
        </select>
      </div>

      {/* Tracks List */}
      {tracks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Headphones className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No top tracks data available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track, index) => {
            const medal = getMedalEmoji(index);
            
            return (
              <div
                key={track.id}
                onClick={() => onTrackClick?.(track.id, track.name, track)}
                className="group flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition cursor-pointer relative"
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 text-center">
                  {medal ? (
                    <span className="text-lg">{medal}</span>
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Album Art */}
                {track.album?.images?.[2]?.url && (
                  <div className="relative flex-shrink-0">
                    <img
                      src={track.album.images[2].url}
                      alt={track.name}
                      className="w-12 h-12 rounded object-cover shadow-sm group-hover:shadow-md transition"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Music2 className="h-4 w-4 text-white" />
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
                  <p className="text-xs text-muted-foreground/60 truncate mt-0.5">
                    {track.album?.name}
                  </p>
                </div>

                {/* Popularity Indicator */}
                {track.popularity !== undefined && (
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {track.popularity}%
                      </span>
                    </div>
                    <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all"
                        style={{ width: `${track.popularity}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Duration */}
                {track.duration_ms && (
                  <div className="flex-shrink-0 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                    {Math.floor(track.duration_ms / 60000)}:
                    {Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Time Range Info */}
      <p className="text-xs text-center text-muted-foreground">
        Showing {timeRangeLabels[timeRange].toLowerCase()}
      </p>
    </div>
  );
}
