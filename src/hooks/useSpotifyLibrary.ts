import { useState } from "react";
import { SpotifyService } from "@/lib/spotifyService";

/**
 * Custom hook for Spotify library management
 * Handles saved tracks, albums, artists, and library operations
 */
export function useSpotifyLibrary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Library state
  const [savedTracks, setSavedTracks] = useState<any[]>([]);
  const [savedAlbums, setSavedAlbums] = useState<any[]>([]);
  const [followedArtists, setFollowedArtists] = useState<any[]>([]);

  /**
   * Load all library data
   */
  const loadLibraryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [tracks, albums, artists] = await Promise.all([
        SpotifyService.getSavedTracks(10),
        SpotifyService.getSavedAlbums(10),
        SpotifyService.getFollowedArtists(10),
      ]);

      setSavedTracks(tracks);
      setSavedAlbums(albums);
      setFollowedArtists(artists);
    } catch (e: any) {
      setError(e?.message || "Failed to load library data");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load saved tracks
   */
  const loadSavedTracks = async (limit: number = 10) => {
    try {
      setLoading(true);
      const tracks = await SpotifyService.getSavedTracks(limit);
      setSavedTracks(tracks);
    } catch (e: any) {
      setError(e?.message || "Failed to load saved tracks");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load saved albums
   */
  const loadSavedAlbums = async (limit: number = 10) => {
    try {
      setLoading(true);
      const albums = await SpotifyService.getSavedAlbums(limit);
      setSavedAlbums(albums);
    } catch (e: any) {
      setError(e?.message || "Failed to load saved albums");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load followed artists
   */
  const loadFollowedArtists = async (limit: number = 10) => {
    try {
      setLoading(true);
      const artists = await SpotifyService.getFollowedArtists(limit);
      setFollowedArtists(artists);
    } catch (e: any) {
      setError(e?.message || "Failed to load followed artists");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear all library data
   */
  const clearLibraryData = () => {
    setSavedTracks([]);
    setSavedAlbums([]);
    setFollowedArtists([]);
    setError(null);
  };

  /**
   * Refresh library data
   */
  const refreshLibrary = async () => {
    await loadLibraryData();
  };

  /**
   * Get library statistics
   */
  const getLibraryStats = () => {
    return {
      totalTracks: savedTracks.length,
      totalAlbums: savedAlbums.length,
      totalArtists: followedArtists.length,
      totalItems:
        savedTracks.length + savedAlbums.length + followedArtists.length,
    };
  };

  /**
   * Get library summary
   */
  const getLibrarySummary = () => {
    const stats = getLibraryStats();
    return {
      tracks: {
        count: stats.totalTracks,
        label: "Saved Tracks",
        icon: "🎵",
      },
      albums: {
        count: stats.totalAlbums,
        label: "Saved Albums",
        icon: "💿",
      },
      artists: {
        count: stats.totalArtists,
        label: "Followed Artists",
        icon: "👥",
      },
    };
  };

  /**
   * Search within library
   */
  const searchInLibrary = (
    query: string,
    type: "tracks" | "albums" | "artists" | "all" = "all",
  ) => {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) return { tracks: [], albums: [], artists: [] };

    const results = {
      tracks:
        type === "tracks" || type === "all"
          ? savedTracks.filter(
              (item: any) =>
                item.track?.name?.toLowerCase().includes(normalizedQuery) ||
                item.track?.artists?.some((artist: any) =>
                  artist.name.toLowerCase().includes(normalizedQuery),
                ),
            )
          : [],
      albums:
        type === "albums" || type === "all"
          ? savedAlbums.filter(
              (item: any) =>
                item.album?.name?.toLowerCase().includes(normalizedQuery) ||
                item.album?.artists?.some((artist: any) =>
                  artist.name.toLowerCase().includes(normalizedQuery),
                ),
            )
          : [],
      artists:
        type === "artists" || type === "all"
          ? followedArtists.filter((artist: any) =>
              artist.name?.toLowerCase().includes(normalizedQuery),
            )
          : [],
    };

    return results;
  };

  /**
   * Get recently added items
   */
  const getRecentlyAdded = () => {
    // This would typically sort by added_at date
    // For now, return the first few items from each category
    return {
      tracks: savedTracks.slice(0, 5),
      albums: savedAlbums.slice(0, 5),
      artists: followedArtists.slice(0, 5),
    };
  };

  return {
    // State
    loading,
    error,
    savedTracks,
    savedAlbums,
    followedArtists,

    // Actions
    loadLibraryData,
    loadSavedTracks,
    loadSavedAlbums,
    loadFollowedArtists,
    clearLibraryData,
    refreshLibrary,

    // Utilities
    getLibraryStats,
    getLibrarySummary,
    searchInLibrary,
    getRecentlyAdded,
    setError,
  };
}
