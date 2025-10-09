/**
 * RSS Media Helpers
 * Utility functions for extracting and processing media URLs from RSS feeds
 */

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * Supports: youtube.com/watch, youtu.be, youtube.com/shorts, youtube.com/embed
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  try {
    const u = new URL(url);
    return u.searchParams.get("v");
  } catch {
    return null;
  }
};

/**
 * Extracts Spotify embed URL from full Spotify URLs or IDs
 * Handles tracks, albums, playlists, and artists
 */
export const extractSpotifyEmbedUrl = (url: string): string | null => {
  // Handle full URLs
  const fullUrlMatch = url.match(
    /spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/,
  );
  if (fullUrlMatch) {
    const [, type, id] = fullUrlMatch;
    return `https://open.spotify.com/embed/${type}/${id}`;
  }

  // Handle embed URLs (with anchor for security)
  const embedMatch = url.match(
    /^https?:\/\/open\.spotify\.com\/embed\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/,
  );
  if (embedMatch) {
    return url; // Already an embed URL
  }

  // Handle just IDs (assume playlist if no type specified)
  if (/^[a-zA-Z0-9]+$/.test(url)) {
    return `https://open.spotify.com/embed/playlist/${url}`;
  }

  return null;
};

/**
 * Extracts Spotify ID from various input formats
 * Handles full URLs, embed URLs, or direct IDs
 */
export const extractSpotifyId = (
  input: string,
  type: string,
): string | null => {
  // If it's already just an ID
  if (/^[a-zA-Z0-9]+$/.test(input)) {
    return input;
  }

  // Extract from full Spotify URL
  const urlMatch = input.match(
    /spotify\.com\/(?:track|album|playlist|artist)\/([a-zA-Z0-9]+)/,
  );
  if (urlMatch) {
    return urlMatch[1];
  }

  // Extract from embed URL
  const embedMatch = input.match(
    /open\.spotify\.com\/embed\/(?:track|album|playlist|artist)\/([a-zA-Z0-9]+)/,
  );
  if (embedMatch) {
    return embedMatch[1];
  }

  return null;
};
