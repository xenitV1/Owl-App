import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, RefreshCw } from "lucide-react";
import { PostCard } from "@/components/content/PostCard";
import { Post } from "@/types/userProfile";

interface UserProfilePostsProps {
  posts: Post[];
  hasMore: boolean;
  isOwnProfile: boolean;
  currentUserId?: string;
  profileName?: string;
  t: any;
  autoRefreshEnabled?: boolean;
  onAutoRefreshToggle?: () => void;
  onLoadMore: () => void;
}

export const UserProfilePosts: React.FC<UserProfilePostsProps> = ({
  posts,
  hasMore,
  isOwnProfile,
  currentUserId,
  profileName,
  t,
  autoRefreshEnabled,
  onAutoRefreshToggle,
  onLoadMore,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {isOwnProfile
            ? t("userProfile.yourPosts")
            : `${profileName || t("common.user")} ${t("common.posts")}`}
        </h2>
        {onAutoRefreshToggle && (
          <Button
            variant={autoRefreshEnabled ? "default" : "outline"}
            size="sm"
            onClick={onAutoRefreshToggle}
            title={
              autoRefreshEnabled
                ? "Auto-refresh enabled (10s)"
                : "Auto-refresh disabled"
            }
          >
            <RefreshCw
              className={`h-4 w-4 ${autoRefreshEnabled ? "animate-spin-slow" : ""}`}
            />
          </Button>
        )}
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t("posts.noPosts")}</h3>
            <p className="text-muted-foreground mb-4">
              {isOwnProfile ? t("home.beFirst") : t("posts.noPosts")}
            </p>
            {isOwnProfile && (
              <Button onClick={() => (window.location.href = "/")}>
                {t("home.createFirstPost")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div
            className="grid gap-[5px]"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
            }}
          >
            {posts.map((post) => (
              <div key={post.id} className="h-fit">
                <PostCard post={post} currentUserId={currentUserId} />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button onClick={onLoadMore}>{t("posts.loadMore")}</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
