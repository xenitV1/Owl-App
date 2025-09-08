'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/content/PostCard';
import PoolItemActions from './PoolItemActions';

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
  color: string;
  icon: string;
}

interface SavedPostCardProps {
  post: Post;
  currentUserId?: string;
  isLiked?: boolean;
  isSaved?: boolean;
  onLike?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onComment?: (postId: string) => void;
  categories: PoolCategory[];
  onMoveToCategory: (postId: string, categoryId: string | null) => void;
  onRemove: (postId: string) => void;
  viewMode?: 'grid' | 'list';
}

export default function SavedPostCard({
  post,
  currentUserId,
  isLiked = false,
  isSaved = false,
  onLike,
  onSave,
  onComment,
  categories,
  onMoveToCategory,
  onRemove,
  viewMode = 'grid'
}: SavedPostCardProps) {
  if (viewMode === 'list') {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <PostCard
                post={post}
                currentUserId={currentUserId}
                isLiked={isLiked}
                isSaved={isSaved}
                onLike={onLike}
                onSave={onSave}
                onComment={onComment}
                showCategory={true}
              />
            </div>
            <div className="ml-4 flex items-center gap-2">
              <PoolItemActions
                postId={post.id}
                currentCategoryId={post.category?.id}
                categories={categories}
                onMoveToCategory={onMoveToCategory}
                onRemove={onRemove}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative group">
      <PostCard
        post={post}
        currentUserId={currentUserId}
        isLiked={isLiked}
        isSaved={isSaved}
        onLike={onLike}
        onSave={onSave}
        onComment={onComment}
        showCategory={true}
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <PoolItemActions
          postId={post.id}
          currentCategoryId={post.category?.id}
          categories={categories}
          onMoveToCategory={onMoveToCategory}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}