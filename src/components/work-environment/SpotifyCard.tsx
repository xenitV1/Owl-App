"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Music,
  TrendingUp,
  Clock,
  Library,
  BarChart3,
} from "lucide-react";

// Custom hooks
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import { useSpotifyData } from "@/hooks/useSpotifyData";
import { useSpotifySearch } from "@/hooks/useSpotifySearch";
import { useSpotifyLibrary } from "@/hooks/useSpotifyLibrary";

// Services
import { SpotifyCardService } from "@/lib/spotifyCardService";

// UI Components
import { SpotifyProfile } from "./spotify/SpotifyProfile";
import { SpotifyOverview } from "./spotify/SpotifyOverview";
import { SpotifyLibrary } from "./spotify/SpotifyLibrary";
import { SpotifyStats } from "./spotify/SpotifyStats";
import { NowPlayingWidget } from "./spotify/NowPlayingWidget";
import { TopArtistsGallery } from "./spotify/TopArtistsGallery";
import { TopTracksChart } from "./spotify/TopTracksChart";
import { RecentlyPlayedTimeline } from "./spotify/RecentlyPlayedTimeline";

interface SpotifyCardProps {
  cardId?: string;
  cardData?: any;
}

export function SpotifyCard({ cardId, cardData }: SpotifyCardProps) {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState<
    "short_term" | "medium_term" | "long_term"
  >("medium_term");

  // Custom hooks
  const {
    isLoggedInToSpotify,
    loading: authLoading,
    error: authError,
    startSpotifyAuth,
    clearAuthData,
  } = useSpotifyAuth();
  const {
    loading: dataLoading,
    error: dataError,
    profile,
    playlists,
    currentlyPlaying,
    recentlyPlayed,
    topTracks,
    topArtists,
    loadData,
    refreshData,
  } = useSpotifyData(timeRange);
  const {
    searchQuery,
    searchType,
    searchResults,
    loading: searchLoading,
    error: searchError,
    runSearch,
    updateSearchQuery,
    updateSearchType,
    onSearchResultClick,
  } = useSpotifySearch();
  const { savedTracks, savedAlbums, followedArtists, loadLibraryData } =
    useSpotifyLibrary();

  const isReady = isAuthenticated;
  const loading = authLoading || dataLoading;
  const error = authError || dataError || searchError;

  // Card creation handlers
  const handleCreatePlaylistCard = (playlist: any) => {
    SpotifyCardService.createPlaylistCard(playlist, cardData, cardId);
  };

  const handleTrackClick = (
    trackId: string,
    trackName: string,
    track?: any,
  ) => {
    SpotifyCardService.handleTrackClick(
      trackId,
      trackName,
      track,
      cardData,
      cardId,
    );
  };

  const handleSearchResultClick = (item: any) => {
    SpotifyCardService.handleSearchResultClick(item, cardData, cardId);
  };

  const handleClearCache = () => {
    clearAuthData();
  };

  const handleRefresh = () => {
    refreshData();
  };

  // Load data when authenticated
  useEffect(() => {
    if (isLoggedInToSpotify) {
      loadData();
      loadLibraryData();
    }
  }, [isLoggedInToSpotify, timeRange]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="text-lg">🎧</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">Spotify</div>
              <div className="text-xs text-muted-foreground truncate">
                Profile & Playlists
              </div>
            </div>
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Integration
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto overflow-x-hidden pr-1 min-h-0">
        {!isReady || loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading
            Spotify...
          </div>
        ) : !isLoggedInToSpotify ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-3">
              Connect your Spotify account to view profile and playlists.
            </p>
            <Button
              onClick={startSpotifyAuth}
              className="inline-flex items-center gap-2"
              disabled={loading}
            >
              Continue with Spotify
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && <div className="text-xs text-red-500">{error}</div>}

            {/* Profile Header */}
            <SpotifyProfile
              profile={profile}
              loading={loading}
              error={error}
              onRefresh={handleRefresh}
              onClearCache={handleClearCache}
              onDisconnect={handleClearCache}
            />

            {/* Now Playing Widget */}
            {currentlyPlaying && (
              <NowPlayingWidget currentTrack={currentlyPlaying} />
            )}

            {/* Tabs for Different Views */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
                <TabsTrigger value="overview" className="text-xs">
                  <Music className="h-3 w-3 mr-1" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="library" className="text-xs">
                  <Library className="h-3 w-3 mr-1" />
                  Library
                </TabsTrigger>
                <TabsTrigger value="top" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Top
                </TabsTrigger>
                <TabsTrigger value="recent" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Recent
                </TabsTrigger>
                <TabsTrigger value="stats" className="text-xs">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Stats
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent
                value="overview"
                className="space-y-4 mt-4 flex-1 overflow-y-auto"
              >
                <SpotifyOverview
                  playlists={playlists}
                  searchQuery={searchQuery}
                  searchType={searchType}
                  searchResults={searchResults}
                  searchLoading={searchLoading}
                  onCreatePlaylistCard={handleCreatePlaylistCard}
                  onSearchQueryChange={updateSearchQuery}
                  onSearchTypeChange={updateSearchType}
                  onRunSearch={runSearch}
                  onSearchResultClick={handleSearchResultClick}
                />
              </TabsContent>

              {/* Library Tab */}
              <TabsContent
                value="library"
                className="space-y-4 mt-4 flex-1 overflow-y-auto"
              >
                <SpotifyLibrary
                  savedTracks={savedTracks}
                  savedAlbums={savedAlbums}
                  followedArtists={followedArtists}
                  onTrackClick={handleTrackClick}
                  onCreatePlaylistCard={handleCreatePlaylistCard}
                />
              </TabsContent>

              {/* Top Tab */}
              <TabsContent
                value="top"
                className="space-y-6 mt-4 flex-1 overflow-y-auto"
              >
                <TopArtistsGallery
                  artists={topArtists}
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                />
                <div className="pt-4 border-t">
                  <TopTracksChart
                    tracks={topTracks}
                    timeRange={timeRange}
                    onTimeRangeChange={setTimeRange}
                    onTrackClick={handleTrackClick}
                  />
                </div>
              </TabsContent>

              {/* Recent Tab */}
              <TabsContent
                value="recent"
                className="mt-4 flex-1 overflow-y-auto"
              >
                <RecentlyPlayedTimeline
                  recentTracks={recentlyPlayed}
                  onTrackClick={handleTrackClick}
                />
              </TabsContent>

              {/* Listening Stats Tab */}
              <TabsContent
                value="stats"
                className="space-y-4 mt-4 flex-1 overflow-y-auto"
              >
                <SpotifyStats
                  savedTracks={savedTracks}
                  savedAlbums={savedAlbums}
                  followedArtists={followedArtists}
                  playlists={playlists}
                  topArtists={topArtists}
                  recentlyPlayed={recentlyPlayed}
                  currentlyPlaying={currentlyPlaying}
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </div>
  );
}

export default SpotifyCard;
