'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';

interface SpotifyProfile {
  id: string;
  display_name?: string;
  email?: string;
  images?: Array<{ url: string }>;
  followers?: { total: number };
  product?: string;
}

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
}

interface SpotifyCardProps {
  cardId?: string;
  cardData?: any;
}

export function SpotifyCard({ cardId, cardData }: SpotifyCardProps) {
  const { data: session, status } = useSession();
  const spotifyAccessToken = (session as any)?.spotifyAccessToken as string | undefined;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'track' | 'album' | 'artist' | 'playlist'>('playlist');
  const [searchResults, setSearchResults] = useState<SpotifySearchItem[]>([]);

  const isReady = status !== 'loading';
  const isLoggedInToSpotify = !!spotifyAccessToken;

  const fetchWithToken = async (url: string) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${spotifyAccessToken}` },
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json();
  };

  const loadData = async () => {
    if (!spotifyAccessToken) return;
    try {
      setLoading(true);
      setError(null);
      const me = (await fetchWithToken('https://api.spotify.com/v1/me')) as SpotifyProfile;
      setProfile(me);
      const pls = await fetchWithToken('https://api.spotify.com/v1/me/playlists?limit=10');
      setPlaylists(pls.items || []);
    } catch (e: any) {
      setError(e?.message || 'Spotify API error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (spotifyAccessToken) loadData();
  }, [spotifyAccessToken]);

  const toEmbed = (type: string, id: string) => `https://open.spotify.com/${type}/${id}`;

  const runSearch = async () => {
    if (!spotifyAccessToken || !searchQuery.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithToken(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}&limit=10`);
      const list: SpotifySearchItem[] = (data?.[searchType + 's']?.items || []).map((it: any) => ({
        id: it.id,
        name: it.name,
        images: it.images || it.album?.images || [],
        type: searchType,
      }));
      setSearchResults(list);
    } catch (e: any) {
      setError(e?.message || 'Spotify search error');
    } finally {
      setLoading(false);
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

  return (
    <div className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
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

      <CardContent className="flex-1 overflow-auto pr-1">
        {!isReady || loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading Spotify...
          </div>
        ) : !isLoggedInToSpotify ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-3">Connect your Spotify account to view profile and playlists.</p>
            <Button onClick={() => signIn('spotify')} className="inline-flex items-center gap-2">
              Continue with Spotify
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {error && <div className="text-xs text-red-500">{error}</div>}

            {/* Profile */}
            <div className="flex items-center gap-4">
              {avatarUrl && (
                <img src={avatarUrl} alt={profile?.display_name || 'Avatar'} className="w-14 h-14 rounded-full object-cover" />
              )}
              <div>
                <div className="font-medium">{profile?.display_name || profile?.id}</div>
                <div className="text-xs text-muted-foreground">{profile?.email}</div>
                {profile?.followers?.total != null && (
                  <div className="text-xs text-muted-foreground">Followers: {profile.followers.total}</div>
                )}
              </div>
              <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={loadData}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>
              </div>
            </div>

            {/* Playlists */}
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">My Playlists</div>
              {playlists.length === 0 ? (
                <div className="text-xs text-muted-foreground">No playlists found.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {playlists.map((pl) => (
                    <a key={pl.id} className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted/40 transition" href="#" onClick={(e) => { e.preventDefault(); createPlaylistCard(pl); }}>
                      {pl.images?.[0]?.url ? (
                        <img src={pl.images[0].url} alt={pl.name} className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{pl.name}</div>
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
            <div className="pt-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Search</div>
              <div className="flex gap-2">
                <Input placeholder={`Search ${searchType}s...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <select className="border rounded px-2 text-sm" value={searchType} onChange={(e) => setSearchType(e.target.value as any)}>
                  <option value="playlist">Playlists</option>
                  <option value="track">Tracks</option>
                  <option value="album">Albums</option>
                  <option value="artist">Artists</option>
                </select>
                <Button variant="outline" onClick={runSearch}>Go</Button>
              </div>
              {searchResults.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {searchResults.map((it) => (
                    <a key={`${it.type}_${it.id}`} className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted/40 transition" href="#" onClick={(e) => { e.preventDefault(); createPlaylistCard({ id: it.id, name: it.name, images: it.images } as any); }}>
                      {it.images?.[0]?.url ? (
                        <img src={it.images[0].url} alt={it.name} className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{it.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{it.type}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );
}

export default SpotifyCard;


