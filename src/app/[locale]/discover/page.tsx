'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/content/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Search, TrendingUp, Users, BookOpen, UserPlus, Clock, Hash } from 'lucide-react';
import { MasonryGrid } from '@/components/ui/masonry-grid';

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
}

interface User {
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
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
}

interface Subject {
  name: string;
  count: number;
}

interface Community {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  isPublic: boolean;
  createdAt: string;
  _count: {
    members: number;
    posts: number;
  };
}

export default function DiscoverPage() {
  const t = useTranslations();
  const { user, dbUser, isGuest } = useAuth();
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const [popularSubjects, setPopularSubjects] = useState<Subject[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('trending');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchTrendingPosts = async () => {
    try {
      const response = await fetch('/api/posts?trending=true&limit=12');
      if (response.ok) {
        const data = await response.json();
        setTrendingPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching trending posts:', error);
    }
  };

  const fetchRecommendedUsers = async () => {
    if (isGuest) return;
    
    try {
      const response = await fetch('/api/users?recommended=true&limit=8');
      if (response.ok) {
        const data = await response.json();
        setRecommendedUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching recommended users:', error);
    }
  };

  const fetchPopularSubjects = async () => {
    try {
      const response = await fetch('/api/posts?subjects=true&limit=10');
      if (response.ok) {
        const data = await response.json();
        setPopularSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching popular subjects:', error);
    }
  };

  const fetchRecentPosts = async () => {
    try {
      const response = await fetch('/api/posts?recent=true&limit=12');
      if (response.ok) {
        const data = await response.json();
        setRecentPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching recent posts:', error);
    }
  };

  const fetchCommunities = async () => {
    try {
      const response = await fetch('/api/communities?limit=12');
      if (response.ok) {
        const data = await response.json();
        setCommunities(data.communities || []);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    }
  };


  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(`/api/posts?search=${encodeURIComponent(searchQuery)}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setTrendingPosts(data.posts || []);
        setActiveTab('trending');
      }
    } catch (error) {
      console.error('Error searching posts:', error);
      toast({
        title: "Search Error",
        description: "Failed to search posts",
        variant: "destructive",
      });
    }
  };

  const handleFollowUser = async (userId: string, userName: string) => {
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
        if (data.following) {
          // Update user list to reflect the follow
          setRecommendedUsers(prev => prev.map(u => 
            u.id === userId 
              ? { ...u, _count: { ...u._count, followers: u._count.followers + 1 } }
              : u
          ));
          
          toast({
            title: "Followed",
            description: `You are now following ${userName || 'this user'}`,
          });
        }
      }
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle like: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update the post in both trending and recent posts
      const updatePostLikes = (posts: Post[]) => 
        posts.map(post => 
          post.id === postId 
            ? { ...post, _count: { ...post._count, likes: data.likesCount } }
            : post
        );
      
      setTrendingPosts(updatePostLikes);
      setRecentPosts(updatePostLikes);

      // Update liked posts set
      if (data.liked) {
        setLikedPosts(prev => new Set(prev).add(postId));
      } else {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to toggle like",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (postId: string) => {
    try {
      const response = await fetch('/api/pools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle save: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update the post in both trending and recent posts
      const updatePostSaves = (posts: Post[]) => 
        posts.map(post => 
          post.id === postId 
            ? { ...post, _count: { ...post._count, pools: data.poolsCount } }
            : post
        );
      
      setTrendingPosts(updatePostSaves);
      setRecentPosts(updatePostSaves);

      // Update saved posts set
      if (data.saved) {
        setSavedPosts(prev => new Set(prev).add(postId));
      } else {
        setSavedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast({
        title: "Error",
        description: "Failed to toggle save",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = (postId: string) => {
    // Remove the deleted post from both trending and recent posts
    setTrendingPosts(prev => prev.filter(post => post.id !== postId));
    setRecentPosts(prev => prev.filter(post => post.id !== postId));
    
    // Also remove from liked and saved sets if present
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      newSet.delete(postId);
      return newSet;
    });
    
    setSavedPosts(prev => {
      const newSet = new Set(prev);
      newSet.delete(postId);
      return newSet;
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchTrendingPosts(),
        fetchRecommendedUsers(),
        fetchPopularSubjects(),
        fetchRecentPosts(),
        fetchCommunities()
      ]);
      setIsLoading(false);
    };
    
    loadData();
  }, [isGuest]);

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
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
          
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            
            <div className="space-y-6">
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
              
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-8 w-20" />
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
    <div className="container mx-auto py-8 pb-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{t('discoverPage.title')}</h1>
          <p className="text-xl text-muted-foreground">
            {t('discoverPage.subtitle')}
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('discoverPage.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="trending" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t('discoverPage.tabs.trending')}
                </TabsTrigger>
                <TabsTrigger value="recent" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('discoverPage.tabs.recent')}
                </TabsTrigger>
                <TabsTrigger value="communities" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  {t('discoverPage.tabs.communities')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="trending">
                {trendingPosts.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">{t('discoverPage.emptyState.noTrendingPosts')}</h3>
                      <p className="text-muted-foreground">
                        {t('discoverPage.emptyState.checkBackLater')}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <MasonryGrid
                    items={trendingPosts}
                    columns={[1, 2, 3]}
                    gap={[16, 20, 24]}
                    media={[640, 768, 1024]}
                    useBalancedLayout={true}
                    renderItem={(post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={dbUser?.id}
                        isLiked={likedPosts.has(post.id)}
                        isSaved={savedPosts.has(post.id)}
                        onLike={handleLike}
                        onSave={handleSave}
                        onDelete={handleDeletePost}
                      />
                    )}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="recent">
                {recentPosts.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">{t('common.noPosts')}</h3>
                      <p className="text-muted-foreground">
                        {t('home.beFirst')}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <MasonryGrid
                    items={recentPosts}
                    columns={[1, 2, 3]}
                    gap={[16, 20, 24]}
                    media={[640, 768, 1024]}
                    useBalancedLayout={true}
                    renderItem={(post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={dbUser?.id}
                        isLiked={likedPosts.has(post.id)}
                        isSaved={savedPosts.has(post.id)}
                        onLike={handleLike}
                        onSave={handleSave}
                        onDelete={handleDeletePost}
                      />
                    )}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="communities">
                {communities.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">{t('communities.noCommunities')}</h3>
                      <p className="text-muted-foreground">
                        {t('communities.createNew')}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <MasonryGrid
                    items={communities}
                    columns={[1, 2, 3]}
                    gap={[16, 20, 24]}
                    media={[640, 768, 1024]}
                    useBalancedLayout={true}
                    renderItem={(community) => (
                      <Card key={community.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                              {community.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base leading-5 truncate">
                                {community.name}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={community.isPublic ? "default" : "secondary"} className="text-xs">
                                  {community.isPublic ? t('common.public') : t('common.private')}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {community._count.members} {t('common.members')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          {community.description && (
                            <CardDescription className="mb-3 line-clamp-2 text-sm">
                              {community.description}
                            </CardDescription>
                          )}
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{community._count.posts} {t('common.posts')}</span>
                            <Button size="sm" variant="outline">
                              {t('common.view')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recommended Users */}
            {!isGuest && recommendedUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t('home.stats.activeStudents')}
                  </CardTitle>
                  <CardDescription>
                    {t('home.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recommendedUsers.slice(0, 4).map((recommendedUser) => (
                      <div key={recommendedUser.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={recommendedUser.avatar} alt={recommendedUser.name || t('common.user')} />
                            <AvatarFallback className="text-xs">
                              {recommendedUser.name ? getInitials(recommendedUser.name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {recommendedUser.name || t('common.anonymousUser')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {recommendedUser._count.posts} {t('common.posts')} • {recommendedUser._count.followers} {t('common.followers')}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleFollowUser(recommendedUser.id, recommendedUser.name || t('common.user'))}
                          disabled={isGuest}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          {t('common.follow')}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Popular Subjects */}
            {popularSubjects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {t('discover.subjects')}
                  </CardTitle>
                  <CardDescription>
                    {t('home.stats.studyMaterials')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {popularSubjects.slice(0, 8).map((subject, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-primary/80">
                        {subject.name}
                        <span className="ml-1 text-xs">({subject.count})</span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Platform Stats */}
            <Card>
              <CardHeader>
                <CardTitle>{t('discoverPage.platformStats.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('discoverPage.platformStats.totalPosts')}</span>
                    <span className="font-medium">{trendingPosts.length + recentPosts.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('discoverPage.platformStats.activeUsers')}</span>
                    <span className="font-medium">{recommendedUsers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('discoverPage.platformStats.subjects')}</span>
                    <span className="font-medium">{popularSubjects.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('discoverPage.platformStats.communities')}</span>
                    <span className="font-medium">{communities.length}</span>
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