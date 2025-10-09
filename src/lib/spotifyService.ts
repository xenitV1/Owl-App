import { spotifyAuth } from "./spotify-auth";

export interface SpotifyPlaylist {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
  tracks?: { total: number };
  external_urls?: { spotify?: string };
}

export interface SpotifySearchItem {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
  type: "track" | "album" | "artist" | "playlist";
  fullData?: any;
}

export interface SpotifyData {
  profile: any;
  playlists: SpotifyPlaylist[];
  currentlyPlaying: any;
  recentlyPlayed: any[];
  topTracks: any[];
  topArtists: any[];
  savedTracks: any[];
  savedAlbums: any[];
  followedArtists: any[];
}

/**
 * Centralized Spotify API service
 * Handles all Spotify API calls and data management
 */
export class SpotifyService {
  /**
   * Load all Spotify data for the user
   */
  static async loadAllData(
    timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  ): Promise<SpotifyData> {
    try {
      const [
        userProfile,
        userPlaylists,
        nowPlaying,
        recent,
        topTracksData,
        topArtistsData,
        savedTracksData,
        savedAlbumsData,
        followedArtistsData,
      ] = await Promise.all([
        spotifyAuth.getUserProfile(),
        spotifyAuth.getUserPlaylists(10),
        spotifyAuth.getCurrentlyPlaying(),
        spotifyAuth.getRecentlyPlayed(15),
        spotifyAuth.getTopTracks(timeRange, 10),
        spotifyAuth.getTopArtists(timeRange, 6),
        spotifyAuth.getSavedTracks(10),
        spotifyAuth.getSavedAlbums(10),
        spotifyAuth.getFollowedArtists(10),
      ]);

      return {
        profile: userProfile,
        playlists: userPlaylists,
        currentlyPlaying: nowPlaying,
        recentlyPlayed: recent,
        topTracks: topTracksData,
        topArtists: topArtistsData,
        savedTracks: savedTracksData,
        savedAlbums: savedAlbumsData,
        followedArtists: followedArtistsData,
      };
    } catch (error: any) {
      throw new Error(error?.message || "Spotify API error");
    }
  }

  /**
   * Search for content on Spotify
   */
  static async search(
    query: string,
    type: "track" | "album" | "artist" | "playlist",
    limit: number = 10,
  ): Promise<SpotifySearchItem[]> {
    try {
      const results = await spotifyAuth.search(query, type, limit);
      return results.map((it: any) => ({
        id: it.id,
        name: it.name,
        images: it.images || it.album?.images || [],
        type: type,
        fullData: it,
      }));
    } catch (error: any) {
      throw new Error(error?.message || "Spotify search error");
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile() {
    return spotifyAuth.getUserProfile();
  }

  /**
   * Get user playlists
   */
  static async getUserPlaylists(limit: number = 10) {
    return spotifyAuth.getUserPlaylists(limit);
  }

  /**
   * Get currently playing track
   */
  static async getCurrentlyPlaying() {
    return spotifyAuth.getCurrentlyPlaying();
  }

  /**
   * Get recently played tracks
   */
  static async getRecentlyPlayed(limit: number = 15) {
    return spotifyAuth.getRecentlyPlayed(limit);
  }

  /**
   * Get top tracks
   */
  static async getTopTracks(
    timeRange: "short_term" | "medium_term" | "long_term",
    limit: number = 10,
  ) {
    return spotifyAuth.getTopTracks(timeRange, limit);
  }

  /**
   * Get top artists
   */
  static async getTopArtists(
    timeRange: "short_term" | "medium_term" | "long_term",
    limit: number = 6,
  ) {
    return spotifyAuth.getTopArtists(timeRange, limit);
  }

  /**
   * Get saved tracks
   */
  static async getSavedTracks(limit: number = 10) {
    return spotifyAuth.getSavedTracks(limit);
  }

  /**
   * Get saved albums
   */
  static async getSavedAlbums(limit: number = 10) {
    return spotifyAuth.getSavedAlbums(limit);
  }

  /**
   * Get followed artists
   */
  static async getFollowedArtists(limit: number = 10) {
    return spotifyAuth.getFollowedArtists(limit);
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return spotifyAuth.isAuthenticated();
  }

  /**
   * Clear authentication data
   */
  static clearAuthData(): void {
    spotifyAuth.clearTokenData();
  }

  /**
   * Load token data from storage
   */
  static loadTokenData(): boolean {
    return spotifyAuth.loadTokenData();
  }
}
