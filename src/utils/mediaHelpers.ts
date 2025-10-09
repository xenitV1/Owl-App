/**
 * Media Helper Utilities
 * Functions for handling media URLs and connections (YouTube, Spotify, etc.)
 */

import { CardConnection } from "@/types/richNoteEditor";

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // If no pattern matches, try to extract from query parameters
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("v");
  } catch {
    return null;
  }
};

/**
 * Converts Spotify URL to embed URL format
 */
export const getSpotifyEmbedUrl = (url: string): string | null => {
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
};

/**
 * Calculates Bezier curve path for visual connection between cards
 */
export const calculateConnectionPath = (connection: CardConnection): string => {
  const sourceX = connection.sourcePosition.x + connection.sourceSize.width;
  const sourceY =
    connection.sourcePosition.y + connection.sourceSize.height / 2;
  const targetX = connection.targetPosition.x;
  const targetY =
    connection.targetPosition.y + connection.targetSize.height / 2;

  // Control points for Bezier curve
  const controlPointOffset = Math.abs(targetX - sourceX) * 0.4;
  const cp1x = sourceX + controlPointOffset;
  const cp1y = sourceY;
  const cp2x = targetX - controlPointOffset;
  const cp2y = targetY;

  return `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`;
};
