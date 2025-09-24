'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export function SpotifyCard() {
  const { data: session, status } = useSession();
  const spotifyAccessToken = (session as any)?.spotifyAccessToken as string | undefined;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);

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

  const avatarUrl = useMemo(() => profile?.images?.[0]?.url, [profile]);

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

      <CardContent className="flex-1 overflow-auto">
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
                    <a key={pl.id} className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted/40 transition" href={pl.external_urls?.spotify || `https://open.spotify.com/playlist/${pl.id}`} target="_blank" rel="noopener noreferrer">
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
          </div>
        )}
      </CardContent>
    </div>
  );
}

export default SpotifyCard;


