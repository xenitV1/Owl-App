"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoginButton } from "@/components/auth/LoginButton";
import { PostCreationForm } from "@/components/content/PostCreationForm";
import { PostCard } from "@/components/content/PostCard";
import { PostDetailModal } from "@/components/content/PostDetailModal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/ui/Logo";
import { MasonryGrid } from "@/components/ui/masonry-grid";
import { MiniChart } from "@/components/ui/mini-chart";
import {
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  Plus,
  Filter,
  RefreshCw,
} from "lucide-react";
import { ErrorBoundary, useErrorBoundary } from "@/components/ErrorBoundary";
import debugLogger from "@/lib/debug";

interface Post {
  id: string;
  title: string;
  content?: string;
  image?: string;
  subject?: string;
  createdAt: string;
  isLikedByCurrentUser?: boolean;
  isSavedByCurrentUser?: boolean;
  author: {
    id: string;
    name: string;
    avatar?: string;
    school?: string;
    grade?: string;
  };
  _count: {
    likes: number;
    comments: number;
    pools: number;
    echoes?: number;
  };
  isEchoedByCurrentUser?: boolean;
  echoedBy?: {
    id: string;
    name: string;
    avatar?: string;
  };
  echoComment?: string | null;
  echoCreatedAt?: string;
}

interface PlatformStats {
  totalUsers: number;
  totalPosts: number;
  totalCommunities: number;
  totalLikes: number;
  totalComments: number;
  totalSaves: number;
  activeUsers: number;
}

export default function Home() {
  const { error, resetError, captureError } = useErrorBoundary();
  const t = useTranslations();
  const { loading, isGuest, user, dbUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(t("subjects.all"));
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [echoedPosts, setEchoedPosts] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalCommunities: 0,
    totalLikes: 0,
    totalComments: 0,
    totalSaves: 0,
    activeUsers: 0,
  });

  // Component lifecycle logging
  useEffect(() => {
    debugLogger.logComponentMount("Home", {
      isGuest,
      user: dbUser?.id,
      loading,
    });

    return () => {
      debugLogger.logComponentUnmount("Home");
    };
  }, []);

  // Error handling
  useEffect(() => {
    if (error) {
      debugLogger.logComponentError("Home", error);
    }
  }, [error]);

  const SUBJECTS = [
    t("subjects.all"),
    t("subjects.mathematics"),
    t("subjects.science"),
    t("subjects.english"),
    t("subjects.history"),
    t("subjects.geography"),
    t("subjects.physics"),
    t("subjects.chemistry"),
    t("subjects.biology"),
    t("subjects.computerScience"),
    t("subjects.literature"),
    t("subjects.art"),
    t("subjects.music"),
    t("subjects.physicalEducation"),
    t("subjects.foreignLanguage"),
    t("subjects.economics"),
    t("subjects.psychology"),
    t("subjects.sociology"),
    t("subjects.philosophy"),
    t("subjects.other"),
  ];

  const fetchStats = async () => {
    try {
      debugLogger.logNetworkRequest("GET", "/api/stats", {});

      const response = await fetch("/api/stats");

      if (!response.ok) {
        const error = new Error(
          `Failed to fetch stats: ${response.status} ${response.statusText}`,
        );
        debugLogger.logNetworkError("GET", "/api/stats", error);
        throw error;
      }

      const data = await response.json();

      debugLogger.logNetworkResponse(
        "GET",
        "/api/stats",
        response.status,
        data,
      );

      setPlatformStats(data);
      debugLogger.debug("ui", "Platform stats updated", data);
    } catch (error) {
      debugLogger.error(
        "ui",
        "Error fetching platform stats",
        error,
        "Home.fetchStats",
      );
      console.error("Error fetching platform stats:", error);
    }
  };

  const fetchPosts = async (pageNum: number = 1, append: boolean = false) => {
    debugLogger.startPerformanceMark("fetchPosts");

    try {
      setIsLoading(true);
      const subjectParam =
        selectedSubject === t("subjects.all") ? "" : selectedSubject;

      // Use posts API
      const apiUrl = `/api/posts?page=${pageNum}&limit=10${subjectParam ? `&subject=${subjectParam}` : ""}`;

      debugLogger.logNetworkRequest("GET", apiUrl, {
        page: pageNum,
        subject: subjectParam,
        append,
      });

      // Use NextAuth session (cookie-based, no token needed)
      const response = await fetch(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = new Error(
          `Failed to fetch posts: ${response.status} ${response.statusText}`,
        );
        debugLogger.logNetworkError(
          "GET",
          `/api/posts?page=${pageNum}&limit=10&subject=${subjectParam}`,
          error,
        );
        throw error;
      }

      const data = await response.json();

      debugLogger.logNetworkResponse(
        "GET",
        `/api/posts?page=${pageNum}&limit=10&subject=${subjectParam}`,
        response.status,
        {
          postsCount: data.posts?.length || 0,
          pagination: data.pagination,
        },
      );

      // Update liked, saved, and echoed posts from backend data
      if (data.posts && data.posts.length > 0) {
        const newLikedPosts = new Set(likedPosts);
        const newSavedPosts = new Set(savedPosts);
        const newEchoedPosts = new Set(echoedPosts);

        data.posts.forEach((post: Post) => {
          if (post.isLikedByCurrentUser) {
            newLikedPosts.add(post.id);
          } else {
            newLikedPosts.delete(post.id);
          }

          if (post.isSavedByCurrentUser) {
            newSavedPosts.add(post.id);
          } else {
            newSavedPosts.delete(post.id);
          }

          if (post.isEchoedByCurrentUser) {
            newEchoedPosts.add(post.id);
          } else {
            newEchoedPosts.delete(post.id);
          }
        });

        setLikedPosts(newLikedPosts);
        setSavedPosts(newSavedPosts);
        setEchoedPosts(newEchoedPosts);

        debugLogger.debug("ui", "Updated like/save/echo states from backend", {
          likedCount: newLikedPosts.size,
          savedCount: newSavedPosts.size,
          echoedCount: newEchoedPosts.size,
        });
      }

      if (append) {
        setPosts((prev) => [...prev, ...data.posts]);
        debugLogger.debug("ui", "Appended posts to existing list", {
          previousCount: posts.length,
          newCount: data.posts?.length || 0,
          totalCount: posts.length + (data.posts?.length || 0),
        });
      } else {
        setPosts(data.posts);
        debugLogger.debug("ui", "Replaced posts with new list", {
          count: data.posts?.length || 0,
        });
      }

      setHasMore(data.pagination.page < data.pagination.pages);
      debugLogger.debug("ui", "Updated pagination state", {
        currentPage: data.pagination.page,
        totalPages: data.pagination.pages,
        hasMore: data.pagination.page < data.pagination.pages,
      });
    } catch (error) {
      debugLogger.error("ui", "Error fetching posts", error, "Home.fetchPosts");
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
      debugLogger.endPerformanceMark("fetchPosts");
    }
  };

  const handleLike = async (postId: string) => {
    debugLogger.startPerformanceMark("handleLike");

    try {
      debugLogger.logNetworkRequest("POST", "/api/likes", { postId });

      // Use NextAuth session (cookie-based, no token needed)
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        const error = new Error(
          `Failed to toggle like: ${response.status} ${response.statusText}`,
        );
        debugLogger.logNetworkError("POST", "/api/likes", error);
        throw error;
      }

      const data = await response.json();

      debugLogger.logNetworkResponse("POST", "/api/likes", response.status, {
        liked: data.liked,
        likesCount: data.likesCount,
      });

      // Update the post in the list
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, _count: { ...post._count, likes: data.likesCount } }
            : post,
        ),
      );

      // Update liked posts set
      if (data.liked) {
        setLikedPosts((prev) => new Set(prev).add(postId));
        debugLogger.debug("ui", "Added post to liked posts", { postId });
      } else {
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        debugLogger.debug("ui", "Removed post from liked posts", { postId });
      }

      // Refresh platform stats after like/unlike
      fetchStats();
    } catch (error) {
      debugLogger.error("ui", "Error toggling like", error, "Home.handleLike");
      console.error("Error toggling like:", error);
    } finally {
      debugLogger.endPerformanceMark("handleLike");
    }
  };

  const handleSave = async (postId: string) => {
    debugLogger.startPerformanceMark("handleSave");

    try {
      debugLogger.logNetworkRequest("POST", "/api/pools", { postId });

      // Use NextAuth session (cookie-based, no token needed)
      const response = await fetch("/api/pools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        const error = new Error(
          `Failed to toggle save: ${response.status} ${response.statusText}`,
        );
        debugLogger.logNetworkError("POST", "/api/pools", error);
        throw error;
      }

      const data = await response.json();

      debugLogger.logNetworkResponse("POST", "/api/pools", response.status, {
        saved: data.saved,
        poolsCount: data.poolsCount,
      });

      // Update the post in the list
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, _count: { ...post._count, pools: data.poolsCount } }
            : post,
        ),
      );

      // Update saved posts set
      if (data.saved) {
        setSavedPosts((prev) => new Set(prev).add(postId));
        debugLogger.debug("ui", "Added post to saved posts", { postId });
      } else {
        setSavedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        debugLogger.debug("ui", "Removed post from saved posts", { postId });
      }

      // Refresh platform stats after save/unsave
      fetchStats();
    } catch (error) {
      debugLogger.error("ui", "Error toggling save", error, "Home.handleSave");
      console.error("Error toggling save:", error);
    } finally {
      debugLogger.endPerformanceMark("handleSave");
    }
  };

  const handleEcho = async (
    postId: string,
    comment?: string,
    remove?: boolean,
  ) => {
    debugLogger.startPerformanceMark("handleEcho");

    try {
      if (remove) {
        // Remove echo
        debugLogger.logNetworkRequest("DELETE", "/api/echoes", { postId });

        const response = await fetch("/api/echoes", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ postId }),
        });

        if (!response.ok) {
          const error = new Error(
            `Failed to remove echo: ${response.status} ${response.statusText}`,
          );
          debugLogger.logNetworkError("DELETE", "/api/echoes", error);
          throw error;
        }

        const data = await response.json();

        debugLogger.logNetworkResponse(
          "DELETE",
          "/api/echoes",
          response.status,
          {
            echoed: data.echoed,
            echoCount: data.echoCount,
          },
        );

        // Remove the echoed version from feed and update original post count
        setPosts((prev) =>
          prev
            .filter(
              (post) =>
                !(post.id === postId && post.echoedBy?.id === dbUser?.id),
            )
            .map((post) =>
              post.id === postId
                ? {
                    ...post,
                    _count: { ...post._count, echoes: data.echoCount },
                  }
                : post,
            ),
        );

        // Update echoed posts set
        setEchoedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        debugLogger.debug("ui", "Removed echo post from feed", { postId });
      } else {
        // Create echo
        debugLogger.logNetworkRequest("POST", "/api/echoes", {
          postId,
          comment,
        });

        const response = await fetch("/api/echoes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ postId, comment }),
        });

        if (!response.ok) {
          const error = new Error(
            `Failed to create echo: ${response.status} ${response.statusText}`,
          );
          debugLogger.logNetworkError("POST", "/api/echoes", error);
          throw error;
        }

        const data = await response.json();

        debugLogger.logNetworkResponse("POST", "/api/echoes", response.status, {
          echoed: data.echoed,
          echoCount: data.echoCount,
        });

        // Find the original post to duplicate
        const originalPost = posts.find((p) => p.id === postId && !p.echoedBy);

        if (originalPost && dbUser) {
          // Create echoed version with banner
          const echoedPost = {
            ...originalPost,
            _count: { ...originalPost._count, echoes: data.echoCount },
            echoedBy: {
              id: dbUser.id,
              name: dbUser.name || "You",
              avatar: dbUser.avatar || undefined,
            },
            echoComment: comment || null,
            echoCreatedAt: new Date().toISOString(),
            isEchoedByCurrentUser: true,
          };

          // Add echoed version at the top and update original post count
          setPosts((prev) => [
            echoedPost,
            ...prev.map((post) =>
              post.id === postId && !post.echoedBy
                ? {
                    ...post,
                    _count: { ...post._count, echoes: data.echoCount },
                  }
                : post,
            ),
          ]);

          debugLogger.debug("ui", "Added echoed post to feed", { postId });
        }

        // Update echoed posts set
        if (data.echoed) {
          setEchoedPosts((prev) => new Set(prev).add(postId));
          debugLogger.debug("ui", "Added post to echoed posts", { postId });
        }
      }

      // Refresh platform stats after echo/remove
      fetchStats();
    } catch (error) {
      debugLogger.error("ui", "Error toggling echo", error, "Home.handleEcho");
      throw error; // Re-throw to be handled by PostCard
    } finally {
      debugLogger.endPerformanceMark("handleEcho");
    }
  };

  const handleCommentAdded = (postId: string) => {
    // Increment comment count when a new comment is added
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              _count: {
                ...post._count,
                comments: post._count.comments + 1,
              },
            }
          : post,
      ),
    );
    debugLogger.debug("ui", "Comment count incremented", { postId });
  };

  const handleDelete = (postId: string) => {
    debugLogger.debug("ui", "Post deleted, removing from UI", { postId });
    // Remove the post from the posts array
    setPosts((prev) => prev.filter((post) => post.id !== postId));

    // Also remove from liked and saved sets if present
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      newSet.delete(postId);
      return newSet;
    });

    setSavedPosts((prev) => {
      const newSet = new Set(prev);
      newSet.delete(postId);
      return newSet;
    });
  };

  const handlePostCreated = () => {
    debugLogger.debug("ui", "Post created successfully, refreshing feed");
    setShowCreateForm(false);
    setPage(1);
    fetchPosts(1, false);
    fetchStats(); // Refresh platform stats
  };

  const loadMorePosts = () => {
    debugLogger.debug("ui", "Loading more posts", {
      currentPage: page,
      hasMore,
      isLoading,
    });

    if (!hasMore || isLoading) {
      debugLogger.warn("ui", "Cannot load more posts - condition not met", {
        hasMore,
        isLoading,
      });
      return;
    }

    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  };

  useEffect(() => {
    debugLogger.debug("ui", "Effect triggered for fetching posts", {
      selectedSubject,
      loading,
      page,
    });

    if (!loading) {
      setPage(1);
      fetchPosts(1, false);
      fetchStats(); // Fetch platform stats
    }
  }, [selectedSubject, loading]);

  // Auto-refresh feed every 30 seconds (silent background update)
  useEffect(() => {
    if (!autoRefreshEnabled || loading || isGuest) return;

    const refreshInterval = setInterval(async () => {
      // Silent refresh without showing loading state (only refresh first page)
      try {
        const subjectParam =
          selectedSubject === t("subjects.all") ? "" : selectedSubject;
        const apiUrl = `/api/posts?page=1&limit=10${subjectParam ? `&subject=${subjectParam}` : ""}`;

        const response = await fetch(apiUrl, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();

          // Only update if we're on page 1
          if (page === 1 && data.posts) {
            setPosts(data.posts);

            // Update interaction states
            const newLikedPosts = new Set(likedPosts);
            const newSavedPosts = new Set(savedPosts);
            const newEchoedPosts = new Set(echoedPosts);

            data.posts.forEach((post: Post) => {
              if (post.isLikedByCurrentUser) newLikedPosts.add(post.id);
              else newLikedPosts.delete(post.id);

              if (post.isSavedByCurrentUser) newSavedPosts.add(post.id);
              else newSavedPosts.delete(post.id);

              if (post.isEchoedByCurrentUser) newEchoedPosts.add(post.id);
              else newEchoedPosts.delete(post.id);
            });

            setLikedPosts(newLikedPosts);
            setSavedPosts(newSavedPosts);
            setEchoedPosts(newEchoedPosts);
          }
        }
      } catch (error) {
        console.error("Auto-refresh error:", error);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(refreshInterval);
  }, [autoRefreshEnabled, loading, isGuest, page, selectedSubject]);

  if (loading) {
    debugLogger.debug("ui", "Showing loading state");
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div className="text-center">
            <Skeleton className="h-12 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
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

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              Component Error
            </CardTitle>
            <CardDescription>
              An error occurred in the Home component
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error.message}
            </p>
            <Button onClick={resetError} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary context="Home">
      <div className="container mx-auto py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            {t("home.title")}
            <Logo size="lg" showText={false} />
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("home.subtitle")}
          </p>
          {isGuest && (
            <div className="flex justify-center">
              <LoginButton />
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Content - Study Materials */}
          <div className="lg:col-span-3">
            {/* Filter Section */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t("home.studyMaterials")}</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={autoRefreshEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
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
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedSubject}
                  onValueChange={(value) => {
                    debugLogger.debug("ui", "Subject filter changed", {
                      from: selectedSubject,
                      to: value,
                    });
                    setSelectedSubject(value);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content Feed */}
            <div className="space-y-6">
              {isLoading && posts.length === 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
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
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      {t("home.noMaterials")}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t("home.beFirst")}
                    </p>
                    {!isGuest && (
                      <Button onClick={() => setShowCreateForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("home.createFirstPost")}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <MasonryGrid
                    items={posts}
                    columns={[1, 2]}
                    gap={[16, 20]}
                    media={[640, 768]}
                    useBalancedLayout={true}
                    renderItem={(post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={dbUser?.id}
                        isLiked={likedPosts.has(post.id)}
                        isSaved={savedPosts.has(post.id)}
                        isEchoed={echoedPosts.has(post.id)}
                        onLike={handleLike}
                        onSave={handleSave}
                        onEcho={handleEcho}
                        onCommentAdded={handleCommentAdded}
                        onDelete={handleDelete}
                        onClick={() => {
                          setSelectedPost(post);
                          setShowPostModal(true);
                        }}
                      />
                    )}
                  />

                  {hasMore && (
                    <div className="flex justify-center mt-8">
                      <Button onClick={loadMorePosts} disabled={isLoading}>
                        {isLoading ? t("common.loading") : t("posts.loadMore")}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Create Post Section */}
            {!isGuest && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Share Study Material
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!showCreateForm ? (
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="w-full"
                      variant="default"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <PostCreationForm
                        onPostCreated={handlePostCreated}
                        onCancel={() => setShowCreateForm(false)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Stats Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Platform Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">
                      {platformStats.totalPosts}
                    </span>
                  </div>
                  <MiniChart
                    type="line"
                    data={
                      platformStats.totalPosts > 0
                        ? [
                            Math.max(1, platformStats.totalPosts - 5),
                            Math.max(1, platformStats.totalPosts - 4),
                            Math.max(1, platformStats.totalPosts - 3),
                            Math.max(1, platformStats.totalPosts - 2),
                            Math.max(1, platformStats.totalPosts - 1),
                            platformStats.totalPosts,
                          ]
                        : [1, 2, 3, 4, 5, 6]
                    }
                    color="#3b82f6"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">
                      {platformStats.totalUsers}
                    </span>
                  </div>
                  <MiniChart
                    type="line"
                    data={
                      platformStats.totalUsers > 0
                        ? [
                            Math.max(0, platformStats.totalUsers - 5),
                            Math.max(0, platformStats.totalUsers - 4),
                            Math.max(0, platformStats.totalUsers - 3),
                            Math.max(0, platformStats.totalUsers - 2),
                            Math.max(0, platformStats.totalUsers - 1),
                            platformStats.totalUsers,
                          ]
                        : [0, 0, 0, 0, 0, 0]
                    }
                    color="#10b981"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">
                      {platformStats.totalComments}
                    </span>
                  </div>
                  <MiniChart
                    type="line"
                    data={
                      platformStats.totalComments > 0
                        ? [
                            Math.max(0, platformStats.totalComments - 5),
                            Math.max(0, platformStats.totalComments - 4),
                            Math.max(0, platformStats.totalComments - 3),
                            Math.max(0, platformStats.totalComments - 2),
                            Math.max(0, platformStats.totalComments - 1),
                            platformStats.totalComments,
                          ]
                        : [0, 0, 0, 0, 0, 0]
                    }
                    color="#f97316"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">
                      {platformStats.totalSaves}
                    </span>
                  </div>
                  <MiniChart
                    type="line"
                    data={
                      platformStats.totalSaves > 0
                        ? [
                            Math.max(0, platformStats.totalSaves - 5),
                            Math.max(0, platformStats.totalSaves - 4),
                            Math.max(0, platformStats.totalSaves - 3),
                            Math.max(0, platformStats.totalSaves - 2),
                            Math.max(0, platformStats.totalSaves - 1),
                            platformStats.totalSaves,
                          ]
                        : [0, 0, 0, 0, 0, 0]
                    }
                    color="#8b5cf6"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action for Guests */}
        {isGuest && (
          <Card className="mt-12">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <BookOpen className="h-6 w-6" />
                {t("home.readyToLearn")}
              </CardTitle>
              <CardDescription className="text-lg">
                {t("home.joinCommunity")}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <LoginButton />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Post Detail Modal */}
      <PostDetailModal
        post={selectedPost}
        open={showPostModal}
        onOpenChange={setShowPostModal}
        currentUserId={dbUser?.id}
        isLiked={selectedPost ? likedPosts.has(selectedPost.id) : false}
        isSaved={selectedPost ? savedPosts.has(selectedPost.id) : false}
        isEchoed={selectedPost ? echoedPosts.has(selectedPost.id) : false}
        onLike={handleLike}
        onSave={handleSave}
        onEcho={handleEcho}
        onCommentAdded={handleCommentAdded}
        onDelete={handleDelete}
      />
    </ErrorBoundary>
  );
}
