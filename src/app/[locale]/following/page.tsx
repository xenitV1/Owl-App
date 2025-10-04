'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostCard } from '@/components/content/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Users, Clock, RefreshCw } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface Post {
  id: string;
  title: string;
  content?: string;
  image?: string;
  subject?: string;
  createdAt: string;
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
  };
  isLiked?: boolean;
  isSaved?: boolean;
}

interface FollowingUser {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
  school?: string;
  grade?: string;
  favoriteSubject?: string;
  bio?: string;
  isVerified: boolean;
  createdAt: string;
  _count?: {
    posts: number;
    followers: number;
    following: number;
  };
}

export default function FollowingPage() {
  const { user, dbUser, isGuest } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const t = useTranslations('common');
  const tFollowing = useTranslations('followingPage');
  const tAuth = useTranslations('auth');

  const fetchFollowingPosts = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const response = await fetch(`/api/posts?following=true&page=${pageNum}&limit=10`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch following posts');
      }

      const data = await response.json();

      if (append) {
        setPosts(prev => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }

      setHasMore(data.pagination.page < data.pagination.pages);
    } catch (error) {
      console.error('Error fetching following posts:', error);
      toast({
        title: t('error'),
        description: tFollowing('emptyState.startFollowingMessage'),
        variant: "destructive",
      });
    }
  };

  const fetchFollowingUsers = async () => {
    if (!user || isGuest) return;

    try {
      const response = await fetch(`/api/users/${dbUser?.id}/following?limit=6`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFollowingUsers(data.following || []);
      }
    } catch (error) {
      console.error('Error fetching following users:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(1);
    await Promise.all([
      fetchFollowingPosts(1, false),
      fetchFollowingUsers()
    ]);
    setIsRefreshing(false);
  };

  const loadMorePosts = () => {
    if (!hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFollowingPosts(nextPage, true);
  };

  const handleDelete = (postId: string) => {
    // Remove the post from the posts array
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  const handleLike = async (postId: string) => {
    if (isGuest) {
      toast({
        title: t('error'),
        description: tAuth('guestDescription'),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      const data = await response.json();
      
      // Update post likes count
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              _count: { 
                ...post._count, 
                likes: data.liked ? post._count.likes + 1 : post._count.likes - 1 
              } 
            }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: t('error'),
        description: t('likeError'),
        variant: "destructive",
      });
    }
  };

  const handleSave = async (postId: string) => {
    if (isGuest) {
      toast({
        title: t('error'),
        description: tAuth('guestDescription'),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/pools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        throw new Error('Failed to save post');
      }

      const data = await response.json();
      
      // Update post pools count
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              _count: { 
                ...post._count, 
                pools: data.saved ? post._count.pools + 1 : post._count.pools - 1 
              } 
            }
          : post
      ));

      toast({
        title: data.saved ? t('saved') : t('unsaved'),
        description: data.saved ? t('savedSuccess') : t('unsavedSuccess'),
      });
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: t('error'),
        description: t('saveError'),
        variant: "destructive",
      });
    }
  };

  const handleCommentAdded = (postId: string) => {
    // Increment comment count when a new comment is added
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            _count: { 
              ...post._count, 
              comments: post._count.comments + 1 
            } 
          }
        : post
    ));
  };

  const handleUnfollowUser = async (userId: string, userName: string) => {
    if (isGuest) return;

    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ followingId: userId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.following) {
          // Remove user from following list and refresh posts
          setFollowingUsers(prev => prev.filter(u => u.id !== userId));
          await fetchFollowingPosts(1, false);

          toast({
            title: t('unfollow'),
            description: `${userName || t('user')} ${t('unfollow').toLowerCase()}ildi`,
          });
        }
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: t('error'),
        description: tFollowing('emptyState.noPostsYet'),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user || isGuest) return;
      
      setIsLoading(true);
      await Promise.all([
        fetchFollowingPosts(1, false),
        fetchFollowingUsers()
      ]);
      setIsLoading(false);
    };
    
    loadData();
  }, [user, isGuest]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Şimdi';
    if (diffInHours < 24) return `${diffInHours}sa önce`;
    if (diffInHours < 48) return 'Dün';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (isGuest) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">{tAuth('signInWithGoogle')}</h3>
              <p className="text-muted-foreground mb-4">
                {tAuth('guestDescription')}
              </p>
              <Button onClick={() => window.location.href = '/api/auth/signin'}>
                {t('login')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-12 w-48 mb-4" />
            <Skeleton className="h-6 w-64" />
          </div>
          
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
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
            
            <div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{tFollowing('title')}</h1>
            <p className="text-muted-foreground text-lg">
              {tFollowing('subtitle')}
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? t('loading') : t('refresh')}
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main Feed */}
          <div className="lg:col-span-3">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">{tFollowing('emptyState.noPostsYet')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {followingUsers.length === 0
                      ? tFollowing('emptyState.startFollowingMessage')
                      : tFollowing('emptyState.noPostsYet')
                    }
                  </p>
                  {followingUsers.length === 0 && (
                    <Button onClick={() => window.location.href = '/discover'}>
                      {tFollowing('discoverUsersButton')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={dbUser?.id}
                      isLiked={post.isLiked}
                      isSaved={post.isSaved}
                      onLike={handleLike}
                      onSave={handleSave}
                      onCommentAdded={handleCommentAdded}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
                
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button onClick={loadMorePosts}>
                      {t('loadMore')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Following Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {tFollowing('followingSection.title', { count: followingUsers.length })}
                </CardTitle>
                <CardDescription>
                  {tFollowing('followingSection.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {followingUsers.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      {tFollowing('followingSection.noFollowingYet')}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => window.location.href = '/discover'}
                    >
                      {tFollowing('discoverUsersButton')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {followingUsers.map((followingUser) => (
                      <div key={followingUser.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={followingUser.avatar} alt={followingUser.name || 'User'} />
                            <AvatarFallback>
                              {followingUser.name ? getInitials(followingUser.name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {followingUser.name || t('anonymousUser')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {followingUser._count?.posts || 0} {t('posts').toLowerCase()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnfollowUser(followingUser.id, followingUser.name || t('user'))}
                        >
                          {t('unfollow')}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>{tFollowing('activitySection.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{tFollowing('activitySection.following')}</span>
                    <span className="font-medium">{followingUsers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{tFollowing('activitySection.recentPosts')}</span>
                    <span className="font-medium">{posts.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{tFollowing('activitySection.lastUpdated')}</span>
                    <span className="font-medium text-sm">{tFollowing('activitySection.justNow')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}