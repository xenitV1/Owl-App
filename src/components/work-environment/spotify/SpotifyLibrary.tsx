import React from "react";
import { Heart, Disc, Users } from "lucide-react";

interface SpotifyLibraryProps {
  savedTracks: any[];
  savedAlbums: any[];
  followedArtists: any[];
  onTrackClick: (trackId: string, trackName: string, track?: any) => void;
  onCreatePlaylistCard: (item: any) => void;
}

export function SpotifyLibrary({
  savedTracks,
  savedAlbums,
  followedArtists,
  onTrackClick,
  onCreatePlaylistCard,
}: SpotifyLibraryProps) {
  return (
    <div className="space-y-4">
      {/* Saved Tracks */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
          <Heart className="h-3 w-3" />
          Saved Tracks ({savedTracks.length})
        </div>
        {savedTracks.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            No saved tracks
          </div>
        ) : (
          <div className="space-y-2">
            {savedTracks.map((item: any) => (
              <a
                key={item.track.id}
                className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/40 transition cursor-pointer"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onTrackClick(item.track.id, item.track.name, item.track);
                }}
              >
                {item.track.album?.images?.[0]?.url ? (
                  <img
                    src={item.track.album.images[0].url}
                    alt={item.track.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">
                    {item.track.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.track.artists?.map((a: any) => a.name).join(", ")}
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
          <div className="text-xs text-muted-foreground text-center py-4">
            No saved albums
          </div>
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
                  onCreatePlaylistCard({
                    id: item.album.id,
                    name: item.album.name,
                    images: item.album.images,
                  });
                }}
              >
                {item.album.images?.[0]?.url ? (
                  <img
                    src={item.album.images[0].url}
                    alt={item.album.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">
                    {item.album.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.album.artists?.map((a: any) => a.name).join(", ")}
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
          <div className="text-xs text-muted-foreground text-center py-4">
            No followed artists
          </div>
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
                  onCreatePlaylistCard({
                    id: artist.id,
                    name: artist.name,
                    images: artist.images,
                  });
                }}
              >
                {artist.images?.[0]?.url ? (
                  <img
                    src={artist.images[0].url}
                    alt={artist.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">
                    {artist.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(artist.followers?.total / 1000).toFixed(0)}K followers
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
