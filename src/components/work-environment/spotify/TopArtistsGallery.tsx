'use client';

import React from 'react';
import { Crown, TrendingUp } from 'lucide-react';

interface TopArtistsGalleryProps {
  artists: any[];
  timeRange: 'short_term' | 'medium_term' | 'long_term';
  onTimeRangeChange: (range: 'short_term' | 'medium_term' | 'long_term') => void;
}

export function TopArtistsGallery({ artists, timeRange, onTimeRangeChange }: TopArtistsGalleryProps) {
  const timeRangeLabels = {
    short_term: 'Last 4 Weeks',
    medium_term: 'Last 6 Months',
    long_term: 'All Time'
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'from-yellow-500 to-amber-600';
    if (index === 1) return 'from-gray-300 to-gray-400';
    if (index === 2) return 'from-orange-600 to-orange-700';
    return 'from-muted to-muted/50';
  };

  return (
    <div className="space-y-4">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">Top Artists</h3>
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

      {/* Artists Grid */}
      {artists.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No top artists data available
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {artists.slice(0, 6).map((artist, index) => (
            <div
              key={artist.id}
              className="group relative bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition border border-transparent hover:border-primary/20"
            >
              {/* Rank Badge */}
              <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-br ${getRankColor(index)} flex items-center justify-center text-white text-xs font-bold shadow-lg z-10`}>
                {index + 1}
              </div>

              <div className="flex items-center gap-3">
                {/* Artist Image */}
                {artist.images?.[0]?.url ? (
                  <div className="relative">
                    <img
                      src={artist.images[0].url}
                      alt={artist.name}
                      className="w-16 h-16 rounded-full object-cover shadow-md ring-2 ring-background"
                    />
                    {index < 3 && (
                      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                        <TrendingUp className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Crown className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                {/* Artist Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate mb-1">
                    {artist.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{artist.genres?.[0] || 'Artist'}</span>
                  </div>
                  {artist.followers?.total && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {(artist.followers.total / 1000000).toFixed(1)}M followers
                    </p>
                  )}
                </div>
              </div>

              {/* Popularity Bar */}
              {artist.popularity && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-full transition-all"
                        style={{ width: `${artist.popularity}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {artist.popularity}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Time Range Info */}
      <p className="text-xs text-center text-muted-foreground">
        Showing {timeRangeLabels[timeRange].toLowerCase()}
      </p>
    </div>
  );
}
