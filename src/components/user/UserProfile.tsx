"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Droplets, Users2 } from "lucide-react";
import Link from "next/link";
import { useUserProfile } from "@/hooks/useUserProfile";
import { UserProfileHeader } from "./UserProfileHeader";
import { UserProfileStats } from "./UserProfileStats";
import { UserProfilePosts } from "./UserProfilePosts";
import { UserProfileEdit } from "./UserProfileEdit";
import { BlockedUsersModal } from "./BlockedUsersModal";
import { UserProfileProps } from "@/types/userProfile";

export const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const {
    // State
    profile,
    posts,
    isLoading,
    isEditing,
    isSaving,
    isFollowing,
    followLoading,
    isBlockedByMe,
    isMuted,
    blockedUsers,
    showBlockedUsers,
    unblockingUsers,
    editForm,
    fileInputRef,
    hasMore,
    isOwnProfile,
    isBlocked,
    blockLoading,
    currentLocale,
    autoRefreshEnabled,

    // Computed values
    user,
    dbUser,
    isGuest,
    t,
    trRoles,

    // Actions
    setEditForm,
    setIsEditing,
    setShowBlockedUsers,
    handleSaveProfile,
    loadMorePosts,
    handleFollowUnfollow,
    unblockUser,
    onAvatarClick,
    onAvatarSelected,
    setIsBlockedByMe,
    setIsMuted,
    setAutoRefreshEnabled,
  } = useUserProfile({ userId });

  // Handle form changes for edit dialog
  const handleFormChange = (updates: Partial<typeof editForm>) => {
    setEditForm((prev) => ({ ...prev, ...updates }));
  };

  // Show blocked message if user is blocked
  if (isBlocked && !blockLoading && !isOwnProfile) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <Users2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {t("common.blocked")}
              </h3>
              <p className="text-muted-foreground">
                {t("profile.blockedMessage")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6 mb-8">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-72 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-8 mx-auto mb-2" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <Users2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {t("common.user")} {t("errors.notFound")}
              </h3>
              <p className="text-muted-foreground">
                {t("common.user")} {t("errors.notFound")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <UserProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          isEditing={isEditing}
          isFollowing={isFollowing}
          followLoading={followLoading}
          isBlockedByMe={isBlockedByMe}
          isMuted={isMuted}
          currentLocale={currentLocale}
          t={t}
          trRoles={trRoles}
          onEditClick={() => setIsEditing(true)}
          onFollowUnfollow={handleFollowUnfollow}
          onBlockChange={(isBlocked) => setIsBlockedByMe(isBlocked)}
          onMuteChange={(isMuted) => setIsMuted(isMuted)}
          onAvatarClick={onAvatarClick}
          fileInputRef={fileInputRef}
        />

        {/* Stats */}
        <UserProfileStats profile={profile} t={t} />

        {/* Quick Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {(isOwnProfile || isFollowing) && (
            <Link
              href={`/${currentLocale}/profile/likes`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-accent"
            >
              <Heart className="h-4 w-4" />
              <span>Likes</span>
            </Link>
          )}
          {(isOwnProfile || isFollowing) && (
            <Link
              href={`/${currentLocale}/profile/comments`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-accent"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Comments</span>
            </Link>
          )}
          {isOwnProfile && (
            <Link
              href={`/${currentLocale}/saved`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-accent"
            >
              <Droplets className="h-4 w-4" />
              <span>Pool</span>
            </Link>
          )}
          {isOwnProfile && (
            <Button
              variant="outline"
              onClick={() => setShowBlockedUsers(true)}
              className="inline-flex items-center gap-2 px-3 py-2"
            >
              <Users2 className="h-4 w-4" />
              <span>Blocked ({blockedUsers.length})</span>
            </Button>
          )}
        </div>

        {/* User Posts */}
        <UserProfilePosts
          posts={posts}
          hasMore={hasMore}
          isOwnProfile={isOwnProfile}
          currentUserId={dbUser?.id}
          profileName={profile.name}
          t={t}
          autoRefreshEnabled={autoRefreshEnabled}
          onAutoRefreshToggle={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
          onLoadMore={loadMorePosts}
        />

        {/* Edit Profile Dialog */}
        <UserProfileEdit
          isOpen={isEditing}
          editForm={editForm}
          isSaving={isSaving}
          currentLocale={currentLocale}
          t={t}
          trRoles={trRoles}
          onClose={() => setIsEditing(false)}
          onSave={handleSaveProfile}
          onFormChange={handleFormChange}
        />

        {/* Blocked Users Modal */}
        <BlockedUsersModal
          isOpen={showBlockedUsers}
          blockedUsers={blockedUsers}
          unblockingUsers={unblockingUsers}
          t={t}
          onClose={() => setShowBlockedUsers(false)}
          onUnblock={unblockUser}
        />
      </div>
    </div>
  );
};
