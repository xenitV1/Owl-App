'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PostCard } from '@/components/content/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import PoolItemActions from '@/components/pools/PoolItemActions';
import SavedPostCard from '@/components/pools/SavedPostCard';
import { Droplets, Filter, Grid, List } from 'lucide-react';

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
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  _count: {
    likes: number;
    comments: number;
    pools: number;
  };
}

interface PoolCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
}

interface SavedPostsProps {
  selectedCategoryId?: string | null;
  categories: PoolCategory[];
}

export default function SavedPosts({ selectedCategoryId, categories }: SavedPostsProps) {
  const t = useTranslations('saved');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  const fetchSavedPosts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedCategoryId) {
        params.append('categoryId', selectedCategoryId);
      }

      const response = await fetch(`/api/pools?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
        
        // Initialize saved posts set
        const savedSet = new Set<string>(data.posts.map((post: Post) => post.id));
        setSavedPosts(savedSet);
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setIsLoading(false);
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
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      
      // Update the post in the list
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, _count: { ...post._count, likes: data.likesCount } }
          : post
      ));

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
        throw new Error('Failed to toggle save');
      }

      const data = await response.json();
      
      // Update the post in the list
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, _count: { ...post._count, pools: data.poolsCount } }
          : post
      ));

      // Update saved posts set
      if (data.saved) {
        setSavedPosts(prev => new Set(prev).add(postId));
      } else {
        setSavedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        
        // Remove from posts list if unsaved
        setPosts(prev => prev.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleMoveToCategory = async (postId: string, categoryId: string | null) => {
    try {
      const response = await fetch(`/api/pools/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryId }),
      });

      if (response.ok) {
        // Refresh the posts list
        fetchSavedPosts();
      }
    } catch (error) {
      console.error('Error moving post to category:', error);
    }
  };

  const handleRemove = async (postId: string) => {
    try {
      const response = await fetch('/api/pools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      if (response.ok) {
        // Remove from posts list
        setPosts(prev => prev.filter(post => post.id !== postId));
        setSavedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error removing post:', error);
    }
  };

  const getSortedPosts = (posts: Post[]) => {
    const sorted = [...posts];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  };

  const selectedCategory = selectedCategoryId 
    ? categories.find(cat => cat.id === selectedCategoryId)
    : null;

  useEffect(() => {
    fetchSavedPosts();
  }, [selectedCategoryId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            {selectedCategory ? selectedCategory.name : t('allSavedItems')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        </CardContent>
      </Card>
    );
  }

  const sortedPosts = getSortedPosts(posts);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              {selectedCategory ? selectedCategory.name : t('allSavedItems')}
            </CardTitle>
            <CardDescription>
              {selectedCategory 
                ? `${selectedCategory.description || t('organizeMaterials')} • ${posts.length} ${t('items')}`
                : `${t('organizeMaterials')} • ${posts.length} ${t('items')}`
              }
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('newest')}</SelectItem>
                <SelectItem value="oldest">{t('oldest')}</SelectItem>
                <SelectItem value="title">{t('title')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <Droplets className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t('noSavedItemsYet')}</h3>
            <p className="text-muted-foreground mb-4">
              {selectedCategory 
                ? t('collectionEmpty')
                : t('startSaving')
              }
            </p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" 
              : "space-y-4"
          }>
            {sortedPosts.map((post) => (
              <SavedPostCard
                key={post.id}
                post={post}
                currentUserId={undefined} // Will be set by AuthContext
                isLiked={likedPosts.has(post.id)}
                isSaved={savedPosts.has(post.id)}
                onLike={handleLike}
                onSave={handleSave}
                categories={categories}
                onMoveToCategory={handleMoveToCategory}
                onRemove={handleRemove}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}