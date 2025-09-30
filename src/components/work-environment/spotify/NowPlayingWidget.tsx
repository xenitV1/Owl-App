'use client';

import React from 'react';
import { Music, Pause, Play } from 'lucide-react';

interface NowPlayingWidgetProps {
  currentTrack: any;
}

export function NowPlayingWidget({ currentTrack }: NowPlayingWidgetProps) {
  if (!currentTrack) {
    return (
      <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-lg p-4 border border-green-500/20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Music className="h-5 w-5" />
          <span className="text-sm">No track currently playing</span>
        </div>
      </div>
    );
  }

  const track = currentTrack.item;
  const isPlaying = currentTrack.is_playing;
  const progress = currentTrack.progress_ms;
  const duration = track?.duration_ms;
  const progressPercentage = duration ? (progress / duration) * 100 : 0;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg p-4 border border-green-500/30 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-blue-500/5 to-purple-500/5 animate-pulse" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          {isPlaying ? (
            <Play className="h-4 w-4 text-green-500 animate-pulse" fill="currentColor" />
          ) : (
            <Pause className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-xs uppercase tracking-wide text-green-500 font-semibold">
            {isPlaying ? 'Now Playing' : 'Paused'}
          </span>
        </div>

        <div className="flex gap-4">
          {/* Album Art */}
          {track?.album?.images?.[0]?.url && (
            <div className="relative group">
              <img
                src={track.album.images[0].url}
                alt={track.name}
                className="w-20 h-20 rounded-md object-cover shadow-lg"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-green-500/20 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Music className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
          )}

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate mb-1">
              {track?.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate mb-2">
              {track?.artists?.map((a: any) => a.name).join(', ')}
            </p>
            
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Album Name */}
        {track?.album?.name && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-muted-foreground truncate">
              from <span className="text-foreground/80">{track.album.name}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
