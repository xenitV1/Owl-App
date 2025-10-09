import { useState, useEffect } from "react";
import { spotifyAuth } from "@/lib/spotify-auth";
import { getSpotifyAuthUrl } from "@/lib/spotify-config";
import { SpotifyService } from "@/lib/spotifyService";

/**
 * Custom hook for Spotify authentication management
 * Handles OAuth flow, token management, and authentication state
 */
export function useSpotifyAuth() {
  const [isLoggedInToSpotify, setIsLoggedInToSpotify] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle Spotify OAuth callback
   */
  const handleSpotifyCallback = async (code: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/spotify/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const tokenData = await response.json();
        spotifyAuth.setTokenData(tokenData);
        setIsLoggedInToSpotify(true);

        // Clean URL
        window.history.replaceState({}, "", "/work-environment");
      } else {
        setError("Failed to authorize with Spotify");
      }
    } catch (e: any) {
      setError(e?.message || "Spotify authorization error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start Spotify OAuth flow
   */
  const startSpotifyAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/spotify/config");
      const config = await response.json();

      if (!config.clientId) {
        throw new Error("Spotify Client ID not configured");
      }

      const state = Math.random().toString(36).substring(7);
      const authUrl = getSpotifyAuthUrl(config.clientId, state);

      console.log("[Spotify OAuth] Starting authorization");
      console.log("[Spotify OAuth] Auth URL:", authUrl);

      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to get Spotify config:", error);
      setError("Failed to start Spotify authorization");
      setLoading(false);
    }
  };

  /**
   * Clear Spotify authentication data
   */
  const clearAuthData = () => {
    try {
      SpotifyService.clearAuthData();
      setIsLoggedInToSpotify(false);
      setError(null);

      console.log("[useSpotifyAuth] Authentication data cleared successfully");
    } catch (e) {
      console.error("[useSpotifyAuth] Failed to clear auth data:", e);
      setError("Failed to clear authentication data");
    }
  };

  /**
   * Check authentication status
   */
  const checkAuthStatus = () => {
    const authenticated = SpotifyService.isAuthenticated();
    setIsLoggedInToSpotify(authenticated);

    // If not authenticated, try to load from localStorage
    if (!authenticated) {
      const loaded = SpotifyService.loadTokenData();
      setIsLoggedInToSpotify(loaded);
    }
  };

  /**
   * Handle URL parameters for OAuth callback
   */
  const handleUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("spotify_code");
    const error = urlParams.get("spotify_error");

    if (error) {
      setError(`Spotify authorization failed: ${error}`);
      // Clean URL
      window.history.replaceState({}, "", "/work-environment");
    } else if (code) {
      // Exchange code for token
      handleSpotifyCallback(code);
    }
  };

  // Initialize authentication status
  useEffect(() => {
    checkAuthStatus();
    handleUrlParams();
  }, []);

  return {
    isLoggedInToSpotify,
    loading,
    error,
    setError,
    startSpotifyAuth,
    clearAuthData,
    checkAuthStatus,
  };
}
