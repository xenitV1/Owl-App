import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, LogOut, Trash2 } from "lucide-react";

interface SpotifyProfileProps {
  profile: any;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onClearCache: () => void;
  onDisconnect: () => void;
}

export function SpotifyProfile({
  profile,
  loading,
  error,
  onRefresh,
  onClearCache,
  onDisconnect,
}: SpotifyProfileProps) {
  const avatarUrl = profile?.images?.[0]?.url;

  return (
    <div className="flex items-center gap-3 pb-3 border-b">
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt={profile?.display_name || "Avatar"}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">
          {profile?.display_name || profile?.id}
        </div>
        <div className="flex items-center gap-2">
          {profile?.followers?.total != null && (
            <div className="text-xs text-muted-foreground">
              {(profile.followers.total / 1000).toFixed(1)}K followers
            </div>
          )}
          {profile?.product && (
            <Badge
              variant={profile.product === "premium" ? "default" : "secondary"}
              className="text-xs"
            >
              {profile.product === "premium" ? "⭐ Premium" : "Free"}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearCache}
          title="Clear Spotify cache"
          className="hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDisconnect}
          title="Disconnect Spotify"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
