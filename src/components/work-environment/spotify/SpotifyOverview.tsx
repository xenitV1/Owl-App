import React from "react";
import { Music } from "lucide-react";
import { SpotifySearch } from "./SpotifySearch";

interface SpotifyPlaylist {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
  tracks?: { total: number };
}

interface SpotifySearchItem {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
  type: "track" | "album" | "artist" | "playlist";
  fullData?: any;
}

interface SpotifyOverviewProps {
  playlists: SpotifyPlaylist[];
  searchQuery: string;
  searchType: "track" | "album" | "artist" | "playlist";
  searchResults: SpotifySearchItem[];
  searchLoading: boolean;
  onCreatePlaylistCard: (playlist: SpotifyPlaylist) => void;
  onSearchQueryChange: (query: string) => void;
  onSearchTypeChange: (type: "track" | "album" | "artist" | "playlist") => void;
  onRunSearch: () => void;
  onSearchResultClick: (item: SpotifySearchItem) => void;
}

export function SpotifyOverview({
  playlists,
  searchQuery,
  searchType,
  searchResults,
  searchLoading,
  onCreatePlaylistCard,
  onSearchQueryChange,
  onSearchTypeChange,
  onRunSearch,
  onSearchResultClick,
}: SpotifyOverviewProps) {
  return (
    <div className="space-y-4">
      {/* Playlists Section */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
          <Music className="h-3 w-3" />
          My Playlists
        </div>
        {playlists.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            No playlists found
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {playlists.slice(0, 6).map((pl) => (
              <a
                key={pl.id}
                className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/40 transition"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onCreatePlaylistCard(pl);
                }}
              >
                {pl.images?.[0]?.url ? (
                  <img
                    src={pl.images[0].url}
                    alt={pl.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{pl.name}</div>
                  {pl.tracks?.total != null && (
                    <div className="text-xs text-muted-foreground">
                      {pl.tracks.total} tracks
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Search Section */}
      <SpotifySearch
        searchQuery={searchQuery}
        searchType={searchType}
        searchResults={searchResults}
        loading={searchLoading}
        onSearchQueryChange={onSearchQueryChange}
        onSearchTypeChange={onSearchTypeChange}
        onRunSearch={onRunSearch}
        onSearchResultClick={onSearchResultClick}
      />
    </div>
  );
}
