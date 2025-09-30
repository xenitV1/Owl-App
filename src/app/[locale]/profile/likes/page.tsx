'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/content/PostCard';

interface Author {
  id: string;
  name: string;
  avatar?: string;
  school?: string;
  grade?: string;
}

interface Post {
  id: string;
  title: string;
  content?: string;
  image?: string;
  author: Author;
  createdAt: string;
  _count: { likes: number; comments: number; pools: number };
}

export default function ProfileLikesPage() {
  const { dbUser, isGuest, loading } = useAuth();
  const t = useTranslations();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLiked = async (pageNum: number = 1, append: boolean = false) => {
    if (!dbUser?.id) return;
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/likes?userId=${dbUser.id}&page=${pageNum}&limit=12`);
      if (!response.ok) throw new Error('Failed to fetch liked posts');
      const data = await response.json();
      setPosts(prev => (append ? [...prev, ...data.posts] : data.posts));
      setHasMore(data.pagination.page < data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !isGuest && dbUser?.id) {
      fetchLiked(1, false);
    }
  }, [loading, isGuest, dbUser?.id]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchLiked(next, true);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
        <div className="grid gap-[5px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">{t('saved.signInToView')}</h3>
            <p className="text-muted-foreground">{t('saved.signInDescription')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{t('userProfile.yourPosts')} – Likes</h1>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No liked posts</h3>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-[5px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
            {posts.map((post) => (
              <div key={post.id} className="h-fit">
                <PostCard post={post} currentUserId={dbUser?.id} />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button onClick={loadMore} disabled={isLoading}>
                {t('posts.loadMore')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}


