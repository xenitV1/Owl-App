'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { spotifyAuth, SpotifyUser } from '@/lib/spotify-auth';
import { getSpotifyAuthUrl } from '@/lib/spotify-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Music, TrendingUp, Activity, Clock, LogOut, Trash2, Library, Heart, Disc, Users, BarChart3, Calendar, Headphones } from 'lucide-react';
import { NowPlayingWidget } from './spotify/NowPlayingWidget';
import { TopArtistsGallery } from './spotify/TopArtistsGallery';
import { TopTracksChart } from './spotify/TopTracksChart';
import { RecentlyPlayedTimeline } from './spotify/RecentlyPlayedTimeline';

// SpotifyProfile interface is now imported from spotify-auth.ts

interface SpotifyPlaylist {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
  tracks?: { total: number };
  external_urls?: { spotify?: string };
}

interface SpotifySearchItem {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
  type: 'track' | 'album' | 'artist' | 'playlist';
  fullData?: any;
}

interface SpotifyCardProps {
  cardId?: string;
  cardData?: any;
}

export function SpotifyCard({ cardId, cardData }: SpotifyCardProps) {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'track' | 'album' | 'artist' | 'playlist'>('playlist');
  const [searchResults, setSearchResults] = useState<SpotifySearchItem[]>([]);
  
  // New state for enhanced features
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Library & Following state
  const [savedTracks, setSavedTracks] = useState<any[]>([]);
  const [savedAlbums, setSavedAlbums] = useState<any[]>([]);
  const [followedArtists, setFollowedArtists] = useState<any[]>([]);

  const isReady = isAuthenticated;
  const [isLoggedInToSpotify, setIsLoggedInToSpotify] = useState(false);

  // Handle Spotify OAuth callback
  const handleSpotifyCallback = async (code: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/spotify/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      
      if (response.ok) {
        const tokenData = await response.json();
        spotifyAuth.setTokenData(tokenData);
        setIsLoggedInToSpotify(true);
        
        // Clean URL
        window.history.replaceState({}, '', '/work-environment');
      } else {
        setError('Failed to authorize with Spotify');
      }
    } catch (e: any) {
      setError(e?.message || 'Spotify authorization error');
    } finally {
      setLoading(false);
    }
  };

  // Check Spotify authentication status
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = spotifyAuth.isAuthenticated();
      setIsLoggedInToSpotify(authenticated);
      
      // If not authenticated, try to load from localStorage
      if (!authenticated) {
        const loaded = spotifyAuth.loadTokenData();
        setIsLoggedInToSpotify(loaded);
      }
    };
    
    checkAuth();
    
    // Check for Spotify callback code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('spotify_code');
    const error = urlParams.get('spotify_error');
    
    if (error) {
      setError(`Spotify authorization failed: ${error}`);
      // Clean URL
      window.history.replaceState({}, '', '/work-environment');
    } else if (code) {
      // Exchange code for token
      handleSpotifyCallback(code);
    }
  }, []);

  const loadData = async () => {
    if (!isLoggedInToSpotify) return;
    try {
      setLoading(true);
      setError(null);
      
      const [
        userProfile, 
        userPlaylists, 
        nowPlaying,
        recent,
        topTracksData,
        topArtistsData,
        savedTracksData,
        savedAlbumsData,
        followedArtistsData
      ] = await Promise.all([
        spotifyAuth.getUserProfile(),
        spotifyAuth.getUserPlaylists(10),
        spotifyAuth.getCurrentlyPlaying(),
        spotifyAuth.getRecentlyPlayed(15),
        spotifyAuth.getTopTracks(timeRange, 10),
        spotifyAuth.getTopArtists(timeRange, 6),
        spotifyAuth.getSavedTracks(10),
        spotifyAuth.getSavedAlbums(10),
        spotifyAuth.getFollowedArtists(10)
      ]);
      
      setProfile(userProfile);
      setPlaylists(userPlaylists);
      setCurrentlyPlaying(nowPlaying);
      setRecentlyPlayed(recent);
      setTopTracks(topTracksData);
      setTopArtists(topArtistsData);
      setSavedTracks(savedTracksData);
      setSavedAlbums(savedAlbumsData);
      setFollowedArtists(followedArtistsData);
    } catch (e: any) {
      setError(e?.message || 'Spotify API error');
    } finally {
      setLoading(false);
    }
  };

  // Create a track card in workspace
  const createTrackCard = (track: any) => {
    try {
      const baseX = cardData?.position?.x ?? 0;
      const baseY = cardData?.position?.y ?? 0;
      const baseW = cardData?.size?.width ?? 400;
      const offset = 40;

      const newCard = {
        id: `card-${Date.now()}`,
        type: 'platformContent' as const,
        title: track.name || 'Spotify Track',
        content: JSON.stringify({
          videoType: 'spotify',
          videoUrl: `https://open.spotify.com/track/${track.id}`,
          videoTitle: track.name,
          connectedTo: cardId ? { sourceCardId: cardId } : undefined,
        }),
        position: { x: baseX + baseW + offset, y: baseY },
        size: { width: 600, height: 420 },
        zIndex: 1,
      } as any;

      const ev = new CustomEvent('workspace:addCard', { detail: newCard });
      window.dispatchEvent(ev);
    } catch (e) {
      console.warn('[SpotifyCard] Failed to create track card', e);
    }
  };

  // Create track card in workspace
  const handleTrackClick = (trackId: string, trackName: string, track?: any) => {
    console.log('[handleTrackClick] Creating card for:', { trackId, trackName, hasTrack: !!track });
    
    try {
      // Create the track card in workspace
      if (track) {
        createTrackCard(track);
      }
    } catch (e: any) {
      console.error('[handleTrackClick] Error creating track card:', e);
    }
  };

  useEffect(() => {
    if (isLoggedInToSpotify) {
      loadData();
    }
  }, [isLoggedInToSpotify, timeRange]);

  const toEmbed = (type: string, id: string) => `https://open.spotify.com/${type}/${id}`;

  const runSearch = async () => {
    if (!isLoggedInToSpotify || !searchQuery.trim()) return;
    try {
      setLoading(true);
      setError(null);
      
      const results = await spotifyAuth.search(searchQuery, searchType, 10);
      const list: SpotifySearchItem[] = results.map((it: any) => ({
        id: it.id,
        name: it.name,
        images: it.images || it.album?.images || [],
        type: searchType,
        fullData: it, // Store full data for track creation
      }));
      setSearchResults(list);
    } catch (e: any) {
      setError(e?.message || 'Spotify search error');
    } finally {
      setLoading(false);
    }
  };

  // Handle search result click
  const handleSearchResultClick = (item: SpotifySearchItem) => {
    if (item.type === 'track' && item.fullData) {
      createTrackCard(item.fullData);
    } else {
      createPlaylistCard({ 
        id: item.id, 
        name: item.name, 
        images: item.images 
      } as any);
    }
  };

  const avatarUrl = useMemo(() => profile?.images?.[0]?.url, [profile]);

  const createPlaylistCard = (playlist: SpotifyPlaylist) => {
    try {
      // Create a media card using existing video embedding logic (spotify)
      const baseX = cardData?.position?.x ?? 0;
      const baseY = cardData?.position?.y ?? 0;
      const baseW = cardData?.size?.width ?? 400;
      const offset = 40;

      const newCard = {
        id: `card-${Date.now()}`,
        type: 'platformContent' as const,
        title: playlist.name || 'Spotify Playlist',
        content: JSON.stringify({
          videoType: 'spotify',
          videoUrl: `https://open.spotify.com/playlist/${playlist.id}`,
          videoTitle: playlist.name,
          connectedTo: cardId ? { sourceCardId: cardId } : undefined,
        }),
        position: { x: baseX + baseW + offset, y: baseY },
        size: { width: 600, height: 420 },
        zIndex: 1,
      } as any;

      // Defer addCard to parent via custom event to avoid tight coupling
      const ev = new CustomEvent('workspace:addCard', { detail: newCard });
      window.dispatchEvent(ev);
    } catch (e) {
      console.warn('[SpotifyCard] Failed to create playlist card', e);
    }
  };

  // Clear Spotify cache only
  const handleClearCache = () => {
    try {
      // Clear Spotify token data
      spotifyAuth.clearTokenData();
      
      // Clear all local state
      setProfile(null);
      setPlaylists([]);
      setCurrentlyPlaying(null);
      setRecentlyPlayed([]);
      setTopTracks([]);
      setTopArtists([]);
      setSearchResults([]);
      setSearchQuery('');
      setSavedTracks([]);
      setSavedAlbums([]);
      setFollowedArtists([]);
      setIsLoggedInToSpotify(false);
      setError(null);
      
      console.log('[SpotifyCard] Cache cleared successfully - User will be prompted for authorization on next login');
    } catch (e) {
      console.error('[SpotifyCard] Failed to clear cache:', e);
      setError('Failed to clear cache');
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="text-lg">🎧</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">Spotify</div>
              <div className="text-xs text-muted-foreground truncate">Profile & Playlists</div>
            </div>
          </CardTitle>
          <Badge variant="secondary" className="text-xs">Integration</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto overflow-x-hidden pr-1 min-h-0">
        {!isReady || loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading Spotify...
          </div>
        ) : !isLoggedInToSpotify ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-3">Connect your Spotify account to view profile and playlists.</p>
            <Button onClick={async () => {
              try {
                setLoading(true);
                const response = await fetch('/api/spotify/config');
                const config = await response.json();
                
                if (!config.clientId) {
                  throw new Error('Spotify Client ID not configured');
                }
                
                const state = Math.random().toString(36).substring(7);
                const authUrl = getSpotifyAuthUrl(config.clientId, state);
                
                console.log('[Spotify OAuth] Starting authorization');
                console.log('[Spotify OAuth] Auth URL:', authUrl);
                
                window.location.href = authUrl;
              } catch (error) {
                console.error('Failed to get Spotify config:', error);
                setError('Failed to start Spotify authorization');
                setLoading(false);
              }
            }} className="inline-flex items-center gap-2" disabled={loading}>
              Continue with Spotify
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && <div className="text-xs text-red-500">{error}</div>}

            {/* Profile Header */}
            <div className="flex items-center gap-3 pb-3 border-b">
              {avatarUrl && (
                <img src={avatarUrl} alt={profile?.display_name || 'Avatar'} className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{profile?.display_name || profile?.id}</div>
                <div className="flex items-center gap-2">
                  {profile?.followers?.total != null && (
                    <div className="text-xs text-muted-foreground">{(profile.followers.total / 1000).toFixed(1)}K followers</div>
                  )}
                  {profile?.product && (
                    <Badge variant={profile.product === 'premium' ? 'default' : 'secondary'} className="text-xs">
                      {profile.product === 'premium' ? '⭐ Premium' : 'Free'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading} title="Refresh data">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearCache}
                  title="Clear Spotify cache"
                  className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearCache}
                  title="Disconnect Spotify"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Now Playing Widget */}
            {currentlyPlaying && (
              <NowPlayingWidget currentTrack={currentlyPlaying} />
            )}

            {/* Tabs for Different Views */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
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
              <TabsContent value="overview" className="space-y-4 mt-4 flex-1 overflow-y-auto">
                {/* Playlists */}
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                    <Music className="h-3 w-3" />
                    My Playlists
                  </div>
                  {playlists.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-4">No playlists found</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {playlists.slice(0, 6).map((pl) => (
                        <a key={pl.id} className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/40 transition" href="#" onClick={(e) => { e.preventDefault(); createPlaylistCard(pl); }}>
                          {pl.images?.[0]?.url ? (
                            <img src={pl.images[0].url} alt={pl.name} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-medium">{pl.name}</div>
                            {pl.tracks?.total != null && (
                              <div className="text-xs text-muted-foreground">{pl.tracks.total} tracks</div>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search */}
                <div className="pt-2 border-t">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Search Music</div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder={`Search ${searchType}s...`} 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                      className="text-sm"
                    />
                    <select className="border rounded px-2 text-xs bg-background" value={searchType} onChange={(e) => setSearchType(e.target.value as any)}>
                      <option value="playlist">Playlists</option>
                      <option value="track">Tracks</option>
                      <option value="album">Albums</option>
                      <option value="artist">Artists</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={runSearch}>Search</Button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {searchResults.map((it) => (
                        <a 
                          key={`${it.type}_${it.id}`} 
                          className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/40 transition cursor-pointer" 
                          href="#" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            handleSearchResultClick(it);
                          }}
                        >
                          {it.images?.[0]?.url ? (
                            <img src={it.images[0].url} alt={it.name} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-medium">{it.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">{it.type}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Library Tab */}
              <TabsContent value="library" className="space-y-4 mt-4 flex-1 overflow-y-auto">
                {/* Saved Tracks */}
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                    <Heart className="h-3 w-3" />
                    Saved Tracks ({savedTracks.length})
                  </div>
                  {savedTracks.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-4">No saved tracks</div>
                  ) : (
                    <div className="space-y-2">
                      {savedTracks.map((item: any) => (
                        <a 
                          key={item.track.id} 
                          className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/40 transition cursor-pointer" 
                          href="#" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            handleTrackClick(item.track.id, item.track.name, item.track);
                          }}
                        >
                          {item.track.album?.images?.[0]?.url ? (
                            <img src={item.track.album.images[0].url} alt={item.track.name} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-medium">{item.track.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {item.track.artists?.map((a: any) => a.name).join(', ')}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Saved Albums */}
                <div className="pt-2 border-t">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                    <Disc className="h-3 w-3" />
                    Saved Albums ({savedAlbums.length})
                  </div>
                  {savedAlbums.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-4">No saved albums</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {savedAlbums.map((item: any) => (
                        <a 
                          key={item.album.id} 
                          className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/40 transition cursor-pointer" 
                          href="#" 
                          onClick={(e) => { 
                            e.preventDefault();
                            // Create album card (similar to playlist)
                            const albumUrl = `https://open.spotify.com/album/${item.album.id}`;
                            createPlaylistCard({ 
                              id: item.album.id, 
                              name: item.album.name, 
                              images: item.album.images 
                            } as any);
                          }}
                        >
                          {item.album.images?.[0]?.url ? (
                            <img src={item.album.images[0].url} alt={item.album.name} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-medium">{item.album.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {item.album.artists?.map((a: any) => a.name).join(', ')}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Followed Artists */}
                <div className="pt-2 border-t">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    Followed Artists ({followedArtists.length})
                  </div>
                  {followedArtists.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-4">No followed artists</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {followedArtists.map((artist: any) => (
                        <a 
                          key={artist.id} 
                          className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/40 transition cursor-pointer" 
                          href="#" 
                          onClick={(e) => { 
                            e.preventDefault();
                            // Create artist card
                            const artistUrl = `https://open.spotify.com/artist/${artist.id}`;
                            createPlaylistCard({ 
                              id: artist.id, 
                              name: artist.name, 
                              images: artist.images 
                            } as any);
                          }}
                        >
                          {artist.images?.[0]?.url ? (
                            <img src={artist.images[0].url} alt={artist.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-medium">{artist.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {(artist.followers?.total / 1000).toFixed(0)}K followers
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Top Tab */}
              <TabsContent value="top" className="space-y-6 mt-4 flex-1 overflow-y-auto">
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
              <TabsContent value="recent" className="mt-4 flex-1 overflow-y-auto">
                <RecentlyPlayedTimeline 
                  recentTracks={recentlyPlayed} 
                  onTrackClick={handleTrackClick}
                />
              </TabsContent>

              {/* Listening Stats Tab */}
              <TabsContent value="stats" className="space-y-4 mt-4 flex-1 overflow-y-auto">
                {/* Listening Overview */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Headphones className="h-4 w-4 text-primary" />
                      <p className="text-xs font-medium">Total Tracks</p>
                    </div>
                    <p className="text-2xl font-bold">{savedTracks.length + topTracks.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Saved & Top</p>
                  </div>
                  
                  <div className="bg-primary/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-primary" />
                      <p className="text-xs font-medium">Artists</p>
                    </div>
                    <p className="text-2xl font-bold">{followedArtists.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Following</p>
                  </div>
                  
                  <div className="bg-primary/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Disc className="h-4 w-4 text-primary" />
                      <p className="text-xs font-medium">Albums</p>
                    </div>
                    <p className="text-2xl font-bold">{savedAlbums.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">In Library</p>
                  </div>
                  
                  <div className="bg-primary/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Music className="h-4 w-4 text-primary" />
                      <p className="text-xs font-medium">Playlists</p>
                    </div>
                    <p className="text-2xl font-bold">{playlists.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Created</p>
                  </div>
                </div>

                {/* Top Genres (extracted from top artists) */}
                <div className="pt-2 border-t">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                    <BarChart3 className="h-3 w-3" />
                    Top Genres
                  </div>
                  {topArtists.length > 0 ? (
                    <div className="space-y-2">
                      {Array.from(new Set(topArtists.flatMap((artist: any) => artist.genres || []).slice(0, 10))).slice(0, 5).map((genre: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-xs capitalize">{genre}</span>
                          <Badge variant="secondary" className="text-xs">
                            {topArtists.filter((a: any) => a.genres?.includes(genre)).length} artists
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No genre data available</p>
                  )}
                </div>

                {/* Listening Time Ranges */}
                <div className="pt-2 border-t">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Time Periods
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant={timeRange === 'short_term' ? 'default' : 'outline'}
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => setTimeRange('short_term')}
                    >
                      <Clock className="h-3 w-3 mr-2" />
                      Last 4 Weeks
                    </Button>
                    <Button
                      variant={timeRange === 'medium_term' ? 'default' : 'outline'}
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => setTimeRange('medium_term')}
                    >
                      <Calendar className="h-3 w-3 mr-2" />
                      Last 6 Months
                    </Button>
                    <Button
                      variant={timeRange === 'long_term' ? 'default' : 'outline'}
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => setTimeRange('long_term')}
                    >
                      <TrendingUp className="h-3 w-3 mr-2" />
                      All Time
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Current view: <span className="font-medium">
                      {timeRange === 'short_term' ? 'Last 4 Weeks' : timeRange === 'medium_term' ? 'Last 6 Months' : 'All Time'}
                    </span>
                  </p>
                </div>

                {/* Activity Summary */}
                <div className="pt-2 border-t">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    Recent Activity
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    {currentlyPlaying && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <p className="text-xs">Currently listening</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs">{recentlyPlayed.length} tracks played recently</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs">{savedTracks.length} tracks in your library</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </div>
  );
}

export default SpotifyCard;


