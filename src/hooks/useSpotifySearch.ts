import { useState } from "react";
import { SpotifyService } from "@/lib/spotifyService";

export interface SpotifySearchItem {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
  type: "track" | "album" | "artist" | "playlist";
  fullData?: any;
}

/**
 * Custom hook for Spotify search functionality
 * Handles search queries, results, and search state management
 */
export function useSpotifySearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<
    "track" | "album" | "artist" | "playlist"
  >("playlist");
  const [searchResults, setSearchResults] = useState<SpotifySearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Execute search query
   */
  const runSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const results = await SpotifyService.search(searchQuery, searchType, 10);
      setSearchResults(results);
    } catch (e: any) {
      setError(e?.message || "Search failed");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear search results
   */
  const clearSearch = () => {
    setSearchResults([]);
    setSearchQuery("");
    setError(null);
  };

  /**
   * Update search query
   */
  const updateSearchQuery = (query: string) => {
    setSearchQuery(query);
    if (error) setError(null);
  };

  /**
   * Update search type
   */
  const updateSearchType = (
    type: "track" | "album" | "artist" | "playlist",
  ) => {
    setSearchType(type);
    if (error) setError(null);
  };

  /**
   * Handle search result selection
   */
  const onSearchResultClick = (item: SpotifySearchItem) => {
    // This will be handled by the parent component
    // The hook just provides the selection mechanism
    return item;
  };

  /**
   * Get search suggestions based on current query
   */
  const getSearchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) return [];

    try {
      // Get suggestions for different types
      const [trackSuggestions, playlistSuggestions] = await Promise.all([
        SpotifyService.search(query, "track", 3),
        SpotifyService.search(query, "playlist", 3),
      ]);

      return [...trackSuggestions, ...playlistSuggestions];
    } catch (e) {
      console.warn("[useSpotifySearch] Failed to get suggestions:", e);
      return [];
    }
  };

  /**
   * Check if search is ready
   */
  const isSearchReady = () => {
    return searchQuery.trim().length > 0 && !loading;
  };

  /**
   * Get search statistics
   */
  const getSearchStats = () => {
    return {
      totalResults: searchResults.length,
      queryLength: searchQuery.length,
      searchType,
      hasResults: searchResults.length > 0,
    };
  };

  return {
    // State
    searchQuery,
    searchType,
    searchResults,
    loading,
    error,

    // Actions
    runSearch,
    clearSearch,
    updateSearchQuery,
    updateSearchType,
    onSearchResultClick,
    getSearchSuggestions,

    // Utilities
    isSearchReady,
    getSearchStats,
    setError,
  };
}
