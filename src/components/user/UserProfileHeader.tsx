import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Edit, UserPlus, UserMinus } from "lucide-react";
import { UserControls } from "@/components/moderation/UserControls";
import { UserProfile } from "@/types/userProfile";
import {
  getInitials,
  formatDate,
  translateGrade,
  translateSubject,
} from "@/utils/userProfile";

interface UserProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  isEditing: boolean;
  isFollowing: boolean;
  followLoading: boolean;
  isBlockedByMe: boolean;
  isMuted: boolean;
  currentLocale: string;
  t: any;
  trRoles: any;
  onEditClick: () => void;
  onFollowUnfollow: () => void;
  onBlockChange: (isBlocked: boolean) => void;
  onMuteChange: (isMuted: boolean) => void;
  onAvatarClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  isEditing,
  isFollowing,
  followLoading,
  isBlockedByMe,
  isMuted,
  currentLocale,
  t,
  trRoles,
  onEditClick,
  onFollowUnfollow,
  onBlockChange,
  onMuteChange,
  onAvatarClick,
  fileInputRef,
}) => {
  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24 cursor-pointer" onClick={onAvatarClick}>
            <AvatarImage
              src={profile.avatar || undefined}
              alt={profile.name || "User"}
            />
            <AvatarFallback className="text-2xl">
              {profile.name ? getInitials(profile.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
          />

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  {profile.name || t("common.anonymousUser")}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {t("userProfile.joinedOn", {
                      date: formatDate(profile.createdAt, t),
                    })}
                  </span>
                </div>
              </div>

              {isOwnProfile ? (
                <Button variant="outline" size="sm" onClick={onEditClick}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t("profile.editProfile")}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={onFollowUnfollow}
                    disabled={followLoading}
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                  >
                    {followLoading ? (
                      t("common.loading")
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="h-4 w-4 mr-2" />
                        {t("common.unfollow")}
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t("common.follow")}
                      </>
                    )}
                  </Button>

                  <UserControls
                    targetUserId={profile.id}
                    targetUserName={profile.name || t("common.user")}
                    isBlocked={isBlockedByMe}
                    isMuted={isMuted}
                    onBlockChange={onBlockChange}
                    onMuteChange={onMuteChange}
                  >
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <span className="sr-only">More options</span>
                    </Button>
                  </UserControls>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-3">
              {profile.role && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {t("userProfile.roleLabel")}
                  </span>
                  <Badge variant="secondary">
                    {trRoles(profile.role as any)}
                  </Badge>
                </div>
              )}
              {profile.school && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {t("userProfile.schoolLabel")}
                  </span>
                  <Badge variant="secondary">{profile.school}</Badge>
                </div>
              )}

              {profile.grade && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {t("userProfile.gradeLabel")}
                  </span>
                  <Badge variant="outline">
                    {translateGrade(profile.grade, currentLocale)}
                  </Badge>
                </div>
              )}

              {profile.favoriteSubject && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {t("userProfile.favoriteSubjectLabel")}
                  </span>
                  <Badge variant="default">
                    {translateSubject(profile.favoriteSubject, currentLocale)}
                  </Badge>
                </div>
              )}

              {profile.bio && (
                <div>
                  <span className="font-medium">
                    {t("userProfile.bioLabel")}
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile.bio}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
