// Spotify authentication utility for NextAuth integration
import type { Session } from 'next-auth';

// Extend Session type to include spotifyAccessToken
declare module 'next-auth' {
  interface Session {
    spotifyAccessToken?: string;
  }
}

// Helper to get session in client components
let cachedSession: Session | null = null;

export interface SpotifyTokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface SpotifyUser {
  id: string;
  display_name?: string;
  email?: string;
  images?: Array<{ url: string }>;
  followers?: { total: number };
  product?: string;
}

class SpotifyAuthManager {
  private static instance: SpotifyAuthManager;
  private tokenData: SpotifyTokenData | null = null;
  private tokenExpiry: number = 0;

  static getInstance(): SpotifyAuthManager {
    if (!SpotifyAuthManager.instance) {
      SpotifyAuthManager.instance = new SpotifyAuthManager();
    }
    return SpotifyAuthManager.instance;
  }

  // Initialize Spotify authentication with NextAuth session
  initializeWithSession(session: Session | null): boolean {
    try {
      if (session?.spotifyAccessToken) {
        // Use Spotify token from NextAuth session
        const tokenData: SpotifyTokenData = {
          access_token: session.spotifyAccessToken as string,
          refresh_token: '', // Refresh token is handled by NextAuth
          expires_in: 3600, // Default 1 hour, NextAuth handles renewal
          token_type: 'Bearer',
          scope: 'user-read-email user-read-private playlist-read-private user-library-read user-top-read'
        };

        this.setTokenData(tokenData);
        cachedSession = session;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to initialize Spotify auth:', error);
      return false;
    }
  }

  // Set token data and calculate expiry
  setTokenData(tokenData: SpotifyTokenData): void {
    this.tokenData = tokenData;
    this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('spotify_token_data', JSON.stringify(tokenData));
      localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
    }
  }

  // Load token data from localStorage
  loadTokenData(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const storedTokenData = localStorage.getItem('spotify_token_data');
      const storedExpiry = localStorage.getItem('spotify_token_expiry');
      
      if (storedTokenData && storedExpiry) {
        this.tokenData = JSON.parse(storedTokenData);
        this.tokenExpiry = parseInt(storedExpiry);
        
        // Check if token is still valid
        if (Date.now() < this.tokenExpiry) {
          return true;
        } else {
          // Token expired, clear storage
          this.clearTokenData();
        }
      }
    } catch (error) {
      console.error('Failed to load Spotify token data:', error);
      this.clearTokenData();
    }
    
    return false;
  }

  // Clear token data
  clearTokenData(): void {
    this.tokenData = null;
    this.tokenExpiry = 0;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('spotify_token_data');
      localStorage.removeItem('spotify_token_expiry');
    }
  }

  // Get current access token (with auto-refresh if needed)
  async getAccessToken(): Promise<string | null> {
    if (!this.tokenData) {
      if (!this.loadTokenData()) {
        return null;
      }
    }

    // Check if token needs refresh (refresh 5 minutes before expiry)
    if (Date.now() > (this.tokenExpiry - 5 * 60 * 1000)) {
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        return null;
      }
    }

    return this.tokenData?.access_token || null;
  }

  // Refresh access token
  async refreshToken(): Promise<boolean> {
    if (!this.tokenData?.refresh_token) {
      return false;
    }

    try {
      const response = await fetch('/api/spotify/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.tokenData.refresh_token,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokenData(data);
        return true;
      }
    } catch (error) {
      console.error('Failed to refresh Spotify token:', error);
    }

    return false;
  }

  // Make authenticated request to Spotify API
  async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = await this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No valid Spotify access token available');
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  // Get Spotify user profile
  async getUserProfile(): Promise<SpotifyUser | null> {
    try {
      const response = await this.makeRequest('https://api.spotify.com/v1/me');
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get Spotify user profile:', error);
    }
    
    return null;
  }

  // Get user's playlists
  async getUserPlaylists(limit: number = 20): Promise<any[]> {
    try {
      const response = await this.makeRequest(`https://api.spotify.com/v1/me/playlists?limit=${limit}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.items || [];
      }
    } catch (error) {
      console.error('Failed to get user playlists:', error);
    }
    
    return [];
  }

  // Search Spotify
  async search(query: string, type: string = 'track', limit: number = 10): Promise<any[]> {
    try {
      const response = await this.makeRequest(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data[type + 's']?.items || [];
      }
    } catch (error) {
      console.error('Failed to search Spotify:', error);
    }
    
    return [];
  }

  // Check if user is authenticated with Spotify
  isAuthenticated(): boolean {
    return this.tokenData !== null && Date.now() < this.tokenExpiry;
  }

  // Get currently playing track
  async getCurrentlyPlaying(): Promise<any | null> {
    try {
      const response = await this.makeRequest('https://api.spotify.com/v1/me/player/currently-playing');
      
      if (response.status === 204) {
        return null; // Nothing playing
      }
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get currently playing:', error);
    }
    
    return null;
  }

  // Get recently played tracks
  async getRecentlyPlayed(limit: number = 20): Promise<any[]> {
    try {
      const response = await this.makeRequest(`https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.items || [];
      }
    } catch (error) {
      console.error('Failed to get recently played:', error);
    }
    
    return [];
  }

  // Get user's top tracks
  async getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 10): Promise<any[]> {
    try {
      const response = await this.makeRequest(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.items || [];
      }
    } catch (error) {
      console.error('Failed to get top tracks:', error);
    }
    
    return [];
  }

  // Get user's top artists
  async getTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 10): Promise<any[]> {
    try {
      const response = await this.makeRequest(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.items || [];
      }
    } catch (error) {
      console.error('Failed to get top artists:', error);
    }
    
    return [];
  }

  // Get audio features for a track
  async getAudioFeatures(trackId: string): Promise<any | null> {
    try {
      // Try without market parameter first (original behavior)
      let response = await this.makeRequest(`https://api.spotify.com/v1/audio-features/${trackId}`);
      
      // If we get 403, this might be a regional restriction
      // Audio features endpoint doesn't actually support market parameter, so 403 means unavailable
      if (response.status === 403) {
        const errorText = await response.text();
        console.warn('[Spotify] Audio features forbidden (403) for track:', trackId);
        console.warn('[Spotify] Error details:', errorText);
        console.warn('[Spotify] This may be due to regional restrictions or API limitations');
        console.warn('[Spotify] Note: Audio Features API has known issues in some regions (Turkey, etc.)');
        return null;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Spotify] Audio features loaded successfully for track:', trackId);
        return data;
      } else if (response.status === 404) {
        console.warn('[Spotify] Audio features not found (404) for track:', trackId);
        console.warn('[Spotify] This track does not have audio analysis data');
        return null;
      } else {
        const errorText = await response.text();
        console.error('[Spotify] Unexpected error getting audio features:', response.status, errorText);
        return null;
      }
    } catch (error) {
      console.error('[Spotify] Failed to get audio features for track:', trackId, error);
    }
    
    return null;
  }

  // Get audio features for multiple tracks
  async getAudioFeaturesMultiple(trackIds: string[]): Promise<any[]> {
    try {
      const ids = trackIds.join(',');
      const response = await this.makeRequest(`https://api.spotify.com/v1/audio-features?ids=${ids}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.audio_features || [];
      }
    } catch (error) {
      console.error('Failed to get audio features:', error);
    }
    
    return [];
  }

  // Get recommendations based on seeds
  async getRecommendations(params: { seed_artists?: string[], seed_tracks?: string[], seed_genres?: string[], limit?: number }): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.seed_artists?.length) queryParams.set('seed_artists', params.seed_artists.join(','));
      if (params.seed_tracks?.length) queryParams.set('seed_tracks', params.seed_tracks.join(','));
      if (params.seed_genres?.length) queryParams.set('seed_genres', params.seed_genres.join(','));
      if (params.limit) queryParams.set('limit', params.limit.toString());
      
      const response = await this.makeRequest(`https://api.spotify.com/v1/recommendations?${queryParams.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.tracks || [];
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error);
    }
    
    return [];
  }

  // Get followed artists
  async getFollowedArtists(limit: number = 20): Promise<any[]> {
    try {
      const response = await this.makeRequest(`https://api.spotify.com/v1/me/following?type=artist&limit=${limit}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.artists?.items || [];
      }
    } catch (error) {
      console.error('Failed to get followed artists:', error);
    }
    
    return [];
  }

  // Get user's saved tracks
  async getSavedTracks(limit: number = 20): Promise<any[]> {
    try {
      const response = await this.makeRequest(`https://api.spotify.com/v1/me/tracks?limit=${limit}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.items || [];
      }
    } catch (error) {
      console.error('Failed to get saved tracks:', error);
    }
    
    return [];
  }

  // Get user's saved albums
  async getSavedAlbums(limit: number = 20): Promise<any[]> {
    try {
      const response = await this.makeRequest(`https://api.spotify.com/v1/me/albums?limit=${limit}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.items || [];
      }
    } catch (error) {
      console.error('Failed to get saved albums:', error);
    }
    
    return [];
  }
}

export const spotifyAuth = SpotifyAuthManager.getInstance();
