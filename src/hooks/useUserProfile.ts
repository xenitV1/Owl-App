import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBlockCheck } from "@/hooks/useBlockCheck";
import { useToast } from "@/hooks/use-toast";
import { useTranslations, useLocale } from "next-intl";
import { UserProfile, Post, EditForm } from "@/types/userProfile";
import { encodeToBase64 } from "@/utils/userProfile";
import { GRADES_EN, SUBJECTS_EN } from "@/constants/userProfile";

interface UseUserProfileProps {
  userId?: string;
  username?: string;
}

export const useUserProfile = ({ userId, username }: UseUserProfileProps) => {
  const { user, dbUser, isGuest } = useAuth();
  const t = useTranslations();
  const trRoles = useTranslations("roles");
  const locale = useLocale();
  const { isBlocked, isLoading: blockLoading } = useBlockCheck(userId || "");

  // Fallback locale if useLocale fails
  const currentLocale = locale || "en";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [unblockingUsers, setUnblockingUsers] = useState<Set<string>>(
    new Set(),
  );
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    username: "", // Add username field
    role: "STUDENT",
    school: "",
    grade: "",
    favoriteSubject: "",
    bio: "",
    avatar: undefined,
    country: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const { toast } = useToast();

  const isOwnProfile =
    (!userId && !username) || (!!userId && userId === dbUser?.id);

  const fetchProfile = async () => {
    try {
      const targetUserId = userId || dbUser?.id;
      const lookupByUsername = username;

      if ((!targetUserId && !lookupByUsername) || !user) {
        return;
      }

      const url = lookupByUsername
        ? `/api/users?username=${encodeURIComponent(lookupByUsername)}`
        : `/api/users?userId=${targetUserId}`;

      const response = await fetch(url, {
        headers: {
          ...(user?.email
            ? { "x-user-email": encodeToBase64(user.email) }
            : {}),
          ...(dbUser?.name
            ? { "x-user-name": encodeToBase64(dbUser.name) }
            : {}),
        },
      });
      let data;
      if (!response.ok) {
        // Fallback: try by email in dev, server will upsert if needed
        if (user?.email) {
          const byEmail = await fetch(
            `/api/users?email=${encodeURIComponent(user.email)}`,
            {
              headers: {
                "x-user-email": encodeToBase64(user.email),
                ...(dbUser?.name
                  ? { "x-user-name": encodeToBase64(dbUser.name) }
                  : {}),
              },
            },
          );
          if (!byEmail.ok) {
            throw new Error("Failed to fetch profile");
          }
          data = await byEmail.json();
        } else {
          throw new Error("Failed to fetch profile");
        }
      } else {
        data = await response.json();
      }
      setProfile(data);

      // Initialize edit form - Grade ve Subject alanlarını doğru şekilde ayarla
      // Eğer grade alanında subject değeri varsa, bunu düzelt
      let correctedGrade = data.grade || "";
      let correctedSubject = data.favoriteSubject || "";

      // Grade alanında subject değeri varsa, bunu düzelt
      if (correctedGrade && SUBJECTS_EN.includes(correctedGrade)) {
        correctedSubject = correctedGrade;
        correctedGrade = "";
      }

      setEditForm({
        name: data.name || "",
        username: data.username || "", // Add username field
        role: data.role || "STUDENT",
        school: data.school || "",
        grade: correctedGrade,
        favoriteSubject: correctedSubject,
        bio: data.bio || "",
        avatar: data.avatar || undefined,
        country: data.country || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: t("common.error"),
        description: t("profile.updateError"),
        variant: "destructive",
      });
    }
  };

  const fetchUserPosts = async (
    pageNum: number = 1,
    append: boolean = false,
  ) => {
    try {
      const targetUserId = userId || dbUser?.id;
      if (!targetUserId || !user) return;

      const response = await fetch(
        `/api/users/posts?userId=${targetUserId}&page=${pageNum}&limit=6`,
        {
          headers: {
            ...(user?.email
              ? { "x-user-email": encodeToBase64(user.email) }
              : {}),
            ...(dbUser?.name
              ? { "x-user-name": encodeToBase64(dbUser.name) }
              : {}),
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();

      if (append) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }

      setHasMore(data.pagination.page < data.pagination.pages);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setIsSaving(true);

    try {
      // Validate username before saving
      if (editForm.username) {
        // Check username length
        if (editForm.username.length < 3 || editForm.username.length > 20) {
          toast({
            title: t("common.error"),
            description: "Username must be between 3 and 20 characters",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }

        // Check username format
        if (!/^[a-zA-Z0-9_]+$/.test(editForm.username)) {
          toast({
            title: t("common.error"),
            description:
              "Username can only contain letters, numbers, and underscores",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }

        // Check if username starts or ends with underscore
        if (
          editForm.username.startsWith("_") ||
          editForm.username.endsWith("_")
        ) {
          toast({
            title: t("common.error"),
            description: "Username cannot start or end with an underscore",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }

        // Check for consecutive underscores
        if (editForm.username.includes("__")) {
          toast({
            title: t("common.error"),
            description: "Username cannot contain consecutive underscores",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }

        // Check username availability
        const usernameCheckResponse = await fetch(
          `/api/auth/check-username?username=${encodeURIComponent(editForm.username)}&currentUserId=${profile.id}`,
          {
            headers: {
              ...(user?.email
                ? { "x-user-email": encodeToBase64(user.email) }
                : {}),
              ...(dbUser?.name
                ? { "x-user-name": encodeToBase64(dbUser.name) }
                : {}),
            },
          },
        );

        if (!usernameCheckResponse.ok) {
          toast({
            title: t("common.error"),
            description: "Failed to check username availability",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }

        const usernameCheckData = await usernameCheckResponse.json();
        if (!usernameCheckData.available) {
          toast({
            title: t("common.error"),
            description:
              usernameCheckData.message || "Username is not available",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
      }

      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(user?.email
            ? { "x-user-email": encodeToBase64(user.email) }
            : {}),
          ...(dbUser?.name
            ? { "x-user-name": encodeToBase64(dbUser.name) }
            : {}),
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedProfile = await response.json();
      setProfile((prev) => (prev ? { ...prev, ...updatedProfile } : null));
      setIsEditing(false);

      toast({
        title: t("common.success"),
        description: t("profile.updateSuccess"),
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: t("common.error"),
        description: t("profile.updateError"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadMorePosts = () => {
    if (!hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUserPosts(nextPage, true);
  };

  const checkFollowStatus = async () => {
    if (!profile || isOwnProfile || isGuest) return;

    try {
      const response = await fetch(`/api/follow/${profile.id}/status`);
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.following);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const checkBlockStatus = async () => {
    if (!profile || isOwnProfile || isGuest) return;

    try {
      const response = await fetch("/api/blocks");
      if (response.ok) {
        const data = await response.json();
        const isUserBlocked = data.blockedUsers.some(
          (block: any) => block.blockedId === profile.id,
        );
        setIsBlockedByMe(isUserBlocked);
      }
    } catch (error) {
      console.error("Error checking block status:", error);
    }
  };

  const checkMuteStatus = async () => {
    if (!profile || isOwnProfile || isGuest) return;

    try {
      const response = await fetch("/api/mutes");
      if (response.ok) {
        const data = await response.json();
        const isUserMuted = data.mutedUsers.some(
          (mute: any) => mute.mutedId === profile.id,
        );
        setIsMuted(isUserMuted);
      }
    } catch (error) {
      console.error("Error checking mute status:", error);
    }
  };

  const fetchBlockedUsers = async () => {
    if (isGuest) return;

    try {
      const response = await fetch("/api/blocks");
      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data.blockedUsers || []);
      }
    } catch (error) {
      console.error("Error fetching blocked users:", error);
    }
  };

  const unblockUser = async (blockedUserId: string) => {
    // Start unblocking animation
    setUnblockingUsers((prev) => new Set(prev).add(blockedUserId));

    try {
      const response = await fetch(`/api/blocks/${blockedUserId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Add a small delay for better UX
        await new Promise((resolve) => setTimeout(resolve, 500));

        setBlockedUsers((prev) =>
          prev.filter((user) => user.blockedId !== blockedUserId),
        );
        toast({
          title: t("common.success"),
          description: t("profile.unblockedSuccessfully"),
        });
      } else {
        throw new Error("Failed to unblock user");
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast({
        title: t("common.error"),
        description: t("profile.unblockError"),
        variant: "destructive",
      });
    } finally {
      // Remove from unblocking state
      setUnblockingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(blockedUserId);
        return newSet;
      });
    }
  };

  const handleFollowUnfollow = async () => {
    if (!profile || isGuest) return;

    setFollowLoading(true);
    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ followingId: profile.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to follow/unfollow");
      }

      const data = await response.json();
      setIsFollowing(data.following);

      // Update follower count
      if (profile) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                _count: {
                  ...prev._count,
                  followers: data.following
                    ? prev._count.followers + 1
                    : prev._count.followers - 1,
                },
              }
            : null,
        );
      }

      toast({
        title: data.following ? t("common.follow") : t("common.unfollow"),
        description: data.following
          ? `${profile.name || t("common.user")} ${t("notifications.notificationTypes.follow")}`
          : `${profile.name || t("common.user")} ${t("common.unfollow")}`,
      });
    } catch (error) {
      console.error("Error following/unfollowing:", error);
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const onAvatarClick = () => fileInputRef.current?.click();

  const onAvatarSelected: React.ChangeEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast({
        title: t("common.error"),
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("common.error"),
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;

      // Update local state immediately for UI feedback
      setEditForm((prev) => ({ ...prev, avatar: dataUrl }));
      setProfile((prev) => (prev ? { ...prev, avatar: dataUrl } : prev));

      // Auto-save the avatar to database
      try {
        const response = await fetch("/api/users", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(user?.email
              ? { "x-user-email": encodeToBase64(user.email) }
              : {}),
            ...(dbUser?.name
              ? { "x-user-name": encodeToBase64(dbUser.name) }
              : {}),
          },
          body: JSON.stringify({
            name: editForm.name,
            username: editForm.username, // Add username field
            role: editForm.role,
            school: editForm.school,
            grade: editForm.grade,
            favoriteSubject: editForm.favoriteSubject,
            bio: editForm.bio,
            avatar: dataUrl,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save avatar");
        }

        const updatedProfile = await response.json();

        toast({
          title: t("common.success"),
          description: "Profile picture updated successfully",
        });
      } catch (error) {
        console.error("Error saving avatar:", error);
        toast({
          title: t("common.error"),
          description: "Failed to save profile picture",
          variant: "destructive",
        });

        // Revert the UI change if save failed
        setEditForm((prev) => ({ ...prev, avatar: profile?.avatar }));
        setProfile((prev) =>
          prev ? { ...prev, avatar: profile?.avatar } : prev,
        );
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchProfile(), fetchUserPosts(1, false)]);
      setIsLoading(false);
    };

    // Clear profile data when user logs out
    if (isGuest || !user) {
      setProfile(null);
      setPosts([]);
      setIsLoading(false);
      return;
    }

    if (!isGuest && user) {
      loadData();
    }
  }, [userId, username, dbUser, isGuest, user]);

  useEffect(() => {
    if (profile && !isOwnProfile && !isGuest) {
      checkFollowStatus();
      checkBlockStatus();
      checkMuteStatus();
    }
  }, [profile, isOwnProfile, isGuest]);

  useEffect(() => {
    if (isOwnProfile && !isGuest && user) {
      fetchBlockedUsers();
    }
  }, [isOwnProfile, isGuest, user]);

  // Auto-refresh user posts every 10 seconds
  useEffect(() => {
    if (!autoRefreshEnabled || isGuest || !user) return;

    const refreshInterval = setInterval(async () => {
      // Silent refresh (page 1 only)
      if (page === 1) {
        await fetchUserPosts(1, false);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(refreshInterval);
  }, [autoRefreshEnabled, isGuest, user, page]);

  return {
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
    page,
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
  };
};
