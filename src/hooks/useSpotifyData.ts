import { useState, useEffect } from "react";
import { SpotifyService } from "@/lib/spotifyService";

/**
 * Custom hook for Spotify data management
 * Handles data loading, state management, and data operations
 */
export function useSpotifyData(
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [profile, setProfile] = useState<any>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [savedTracks, setSavedTracks] = useState<any[]>([]);
  const [savedAlbums, setSavedAlbums] = useState<any[]>([]);
  const [followedArtists, setFollowedArtists] = useState<any[]>([]);

  /**
   * Load all Spotify data
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await SpotifyService.loadAllData(timeRange);

      setProfile(data.profile);
      setPlaylists(data.playlists);
      setCurrentlyPlaying(data.currentlyPlaying);
      setRecentlyPlayed(data.recentlyPlayed);
      setTopTracks(data.topTracks);
      setTopArtists(data.topArtists);
      setSavedTracks(data.savedTracks);
      setSavedAlbums(data.savedAlbums);
      setFollowedArtists(data.followedArtists);
    } catch (e: any) {
      setError(e?.message || "Failed to load Spotify data");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load specific data type
   */
  const loadProfile = async () => {
    try {
      const profileData = await SpotifyService.getUserProfile();
      setProfile(profileData);
    } catch (e: any) {
      setError(e?.message || "Failed to load profile");
    }
  };

  const loadPlaylists = async () => {
    try {
      const playlistsData = await SpotifyService.getUserPlaylists(10);
      setPlaylists(playlistsData);
    } catch (e: any) {
      setError(e?.message || "Failed to load playlists");
    }
  };

  const loadCurrentlyPlaying = async () => {
    try {
      const nowPlaying = await SpotifyService.getCurrentlyPlaying();
      setCurrentlyPlaying(nowPlaying);
    } catch (e: any) {
      setError(e?.message || "Failed to load currently playing");
    }
  };

  const loadRecentlyPlayed = async () => {
    try {
      const recent = await SpotifyService.getRecentlyPlayed(15);
      setRecentlyPlayed(recent);
    } catch (e: any) {
      setError(e?.message || "Failed to load recently played");
    }
  };

  const loadTopTracks = async () => {
    try {
      const tracks = await SpotifyService.getTopTracks(timeRange, 10);
      setTopTracks(tracks);
    } catch (e: any) {
      setError(e?.message || "Failed to load top tracks");
    }
  };

  const loadTopArtists = async () => {
    try {
      const artists = await SpotifyService.getTopArtists(timeRange, 6);
      setTopArtists(artists);
    } catch (e: any) {
      setError(e?.message || "Failed to load top artists");
    }
  };

  const loadSavedTracks = async () => {
    try {
      const tracks = await SpotifyService.getSavedTracks(10);
      setSavedTracks(tracks);
    } catch (e: any) {
      setError(e?.message || "Failed to load saved tracks");
    }
  };

  const loadSavedAlbums = async () => {
    try {
      const albums = await SpotifyService.getSavedAlbums(10);
      setSavedAlbums(albums);
    } catch (e: any) {
      setError(e?.message || "Failed to load saved albums");
    }
  };

  const loadFollowedArtists = async () => {
    try {
      const artists = await SpotifyService.getFollowedArtists(10);
      setFollowedArtists(artists);
    } catch (e: any) {
      setError(e?.message || "Failed to load followed artists");
    }
  };

  /**
   * Clear all data
   */
  const clearData = () => {
    setProfile(null);
    setPlaylists([]);
    setCurrentlyPlaying(null);
    setRecentlyPlayed([]);
    setTopTracks([]);
    setTopArtists([]);
    setSavedTracks([]);
    setSavedAlbums([]);
    setFollowedArtists([]);
    setError(null);
  };

  /**
   * Refresh specific data
   */
  const refreshData = async (dataType?: string) => {
    switch (dataType) {
      case "profile":
        await loadProfile();
        break;
      case "playlists":
        await loadPlaylists();
        break;
      case "currentlyPlaying":
        await loadCurrentlyPlaying();
        break;
      case "recentlyPlayed":
        await loadRecentlyPlayed();
        break;
      case "topTracks":
        await loadTopTracks();
        break;
      case "topArtists":
        await loadTopArtists();
        break;
      case "savedTracks":
        await loadSavedTracks();
        break;
      case "savedAlbums":
        await loadSavedAlbums();
        break;
      case "followedArtists":
        await loadFollowedArtists();
        break;
      default:
        await loadData();
    }
  };

  return {
    // State
    loading,
    error,
    profile,
    playlists,
    currentlyPlaying,
    recentlyPlayed,
    topTracks,
    topArtists,
    savedTracks,
    savedAlbums,
    followedArtists,

    // Actions
    loadData,
    clearData,
    refreshData,
    setError,

    // Individual loaders
    loadProfile,
    loadPlaylists,
    loadCurrentlyPlaying,
    loadRecentlyPlayed,
    loadTopTracks,
    loadTopArtists,
    loadSavedTracks,
    loadSavedAlbums,
    loadFollowedArtists,
  };
}
