import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music } from "lucide-react";

interface SpotifySearchItem {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
  type: "track" | "album" | "artist" | "playlist";
  fullData?: any;
}

interface SpotifySearchProps {
  searchQuery: string;
  searchType: "track" | "album" | "artist" | "playlist";
  searchResults: SpotifySearchItem[];
  loading: boolean;
  onSearchQueryChange: (query: string) => void;
  onSearchTypeChange: (type: "track" | "album" | "artist" | "playlist") => void;
  onRunSearch: () => void;
  onSearchResultClick: (item: SpotifySearchItem) => void;
}

export function SpotifySearch({
  searchQuery,
  searchType,
  searchResults,
  loading,
  onSearchQueryChange,
  onSearchTypeChange,
  onRunSearch,
  onSearchResultClick,
}: SpotifySearchProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onRunSearch();
    }
  };

  return (
    <div className="pt-2 border-t">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
        <Music className="h-3 w-3" />
        Search Music
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={`Search ${searchType}s...`}
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-sm"
        />
        <select
          className="border rounded px-2 text-xs bg-background"
          value={searchType}
          onChange={(e) => onSearchTypeChange(e.target.value as any)}
        >
          <option value="playlist">Playlists</option>
          <option value="track">Tracks</option>
          <option value="album">Albums</option>
          <option value="artist">Artists</option>
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={onRunSearch}
          disabled={loading}
        >
          Search
        </Button>
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
                onSearchResultClick(it);
              }}
            >
              {it.images?.[0]?.url ? (
                <img
                  src={it.images[0].url}
                  alt={it.name}
                  className="w-10 h-10 rounded object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{it.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {it.type}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
