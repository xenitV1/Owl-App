/**
 * Spotify OAuth Configuration
 * Centralized configuration for Spotify authentication
 */

/**
 * Get the base URL for the application
 * Uses environment variable or falls back to localhost for development
 */
export function getBaseUrl(): string {
  // Check if we're in browser
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Server-side: use environment variable or default
  return process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000';
}

/**
 * Get Spotify redirect URI
 * This MUST match exactly what's registered in Spotify Developer Dashboard
 */
export function getSpotifyRedirectUri(): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/spotify/callback`;
}

/**
 * Get Spotify authorization URL
 * @param clientId - Spotify Client ID
 * @param state - Random state for CSRF protection
 * @param forceDialog - Force Spotify to show authorization dialog (useful after cache clear)
 */
export function getSpotifyAuthUrl(clientId: string, state: string, forceDialog: boolean = true): string {
  const redirectUri = getSpotifyRedirectUri();
  
  const scopes = [
    'user-read-email',
    'user-read-private',
    'playlist-read-private',
    'user-library-read',
    'user-top-read',
    'user-read-currently-playing',
    'user-read-recently-played',
    'user-read-playback-state',
    'user-follow-read',
  ];
  
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    state: state,
  });
  
  // Force authorization dialog to show every time
  // This ensures user must re-authenticate after clearing cache
  if (forceDialog) {
    params.set('show_dialog', 'true');
  }
  
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

/**
 * Spotify OAuth configuration
 */
export const SPOTIFY_CONFIG = {
  scopes: [
    'user-read-email',
    'user-read-private',
    'playlist-read-private',
    'user-library-read',
    'user-top-read',
    'user-read-currently-playing',
    'user-read-recently-played',
    'user-read-playback-state',
    'user-follow-read',
  ],
} as const;
