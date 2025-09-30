'use client';

import React, { useMemo } from 'react';
import { Activity, Zap, Music, Heart, Volume2, Speaker } from 'lucide-react';

interface AudioFeaturesRadarProps {
  audioFeatures: any;
  trackName?: string;
}

export function AudioFeaturesRadar({ audioFeatures, trackName }: AudioFeaturesRadarProps) {
  // useMemo must be called before any conditional returns (React Hooks rules)
  const features = useMemo(() => {
    if (!audioFeatures) return [];
    return [
      { name: 'Energy', value: audioFeatures.energy || 0, color: '#ef4444', icon: Zap },
      { name: 'Danceability', value: audioFeatures.danceability || 0, color: '#8b5cf6', icon: Music },
      { name: 'Valence', value: audioFeatures.valence || 0, color: '#f59e0b', icon: Heart },
      { name: 'Acousticness', value: audioFeatures.acousticness || 0, color: '#10b981', icon: Speaker },
      { name: 'Speechiness', value: audioFeatures.speechiness || 0, color: '#3b82f6', icon: Volume2 },
      { name: 'Instrumentalness', value: audioFeatures.instrumentalness || 0, color: '#ec4899', icon: Activity },
    ];
  }, [audioFeatures]);

  if (!audioFeatures) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No audio features available</p>
      </div>
    );
  }

  // Calculate points for hexagon radar chart
  const getRadarPoints = () => {
    const centerX = 100;
    const centerY = 100;
    const radius = 80;
    const angleStep = (Math.PI * 2) / features.length;

    return features.map((feature, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const value = feature.value * radius;
      const x = centerX + Math.cos(angle) * value;
      const y = centerY + Math.sin(angle) * value;
      return { x, y, angle, ...feature };
    });
  };

  const points = getRadarPoints();
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Background grid circles
  const gridCircles = [0.25, 0.5, 0.75, 1].map(scale => {
    const gridPoints = features.map((_, index) => {
      const angle = ((Math.PI * 2) / features.length) * index - Math.PI / 2;
      const x = 100 + Math.cos(angle) * (80 * scale);
      const y = 100 + Math.sin(angle) * (80 * scale);
      return `${x},${y}`;
    }).join(' ');
    return gridPoints;
  });

  return (
    <div className="space-y-4">
      {trackName && (
        <div className="text-center">
          <h3 className="font-semibold text-sm mb-1">Audio Features</h3>
          <p className="text-xs text-muted-foreground truncate">{trackName}</p>
        </div>
      )}

      {/* Radar Chart */}
      <div className="relative">
        <svg viewBox="0 0 200 200" className="w-full h-auto">
          {/* Background Grid */}
          {gridCircles.map((gridPoints, i) => (
            <polygon
              key={i}
              points={gridPoints}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-muted-foreground/20"
            />
          ))}

          {/* Axis Lines */}
          {points.map((point, i) => (
            <line
              key={`axis-${i}`}
              x1="100"
              y1="100"
              x2={100 + Math.cos(point.angle) * 80}
              y2={100 + Math.sin(point.angle) * 80}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-muted-foreground/30"
            />
          ))}

          {/* Data Area */}
          <defs>
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          
          <path
            d={pathData}
            fill="url(#radarGradient)"
            stroke="#8b5cf6"
            strokeWidth="2"
            className="drop-shadow-lg"
          />

          {/* Data Points */}
          {points.map((point, i) => (
            <g key={`point-${i}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill={point.color}
                className="drop-shadow-md"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill={point.color}
                opacity="0.3"
                className="animate-pulse"
              />
            </g>
          ))}
        </svg>

        {/* Labels */}
        <div className="absolute inset-0 pointer-events-none">
          {points.map((point, i) => {
            const labelAngle = point.angle;
            const labelRadius = 95;
            const labelX = 50 + (Math.cos(labelAngle) * labelRadius * 0.5);
            const labelY = 50 + (Math.sin(labelAngle) * labelRadius * 0.5);
            
            return (
              <div
                key={`label-${i}`}
                className="absolute text-xs font-medium pointer-events-auto"
                style={{
                  left: `${labelX}%`,
                  top: `${labelY}%`,
                  transform: 'translate(-50%, -50%)',
                  color: point.color,
                }}
              >
                {point.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Bars */}
      <div className="grid grid-cols-2 gap-2">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3 w-3" style={{ color: feature.color }} />
                  <span className="text-xs font-medium">{feature.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round(feature.value * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${feature.value * 100}%`,
                    backgroundColor: feature.color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Tempo</p>
          <p className="text-sm font-semibold">{Math.round(audioFeatures.tempo)} BPM</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Key</p>
          <p className="text-sm font-semibold">
            {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][audioFeatures.key] || 'N/A'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Loudness</p>
          <p className="text-sm font-semibold">{audioFeatures.loudness?.toFixed(1)} dB</p>
        </div>
      </div>
    </div>
  );
}
