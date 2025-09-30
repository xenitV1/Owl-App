'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/content/PostCard';
import { useLocale } from 'next-intl';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Author {
  id: string;
  name: string;
  avatar?: string;
  school?: string;
  grade?: string;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  post: {
    id: string;
    title: string;
    content?: string;
    image?: string;
    author: Author;
    createdAt: string;
    _count: { likes: number; comments: number; pools: number };
  };
}

export default function ProfileCommentsPage() {
  const { dbUser, isGuest, loading, user } = useAuth();
  const t = useTranslations();
  const locale = useLocale();
  const [items, setItems] = useState<CommentItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const fetchComments = async (pageNum: number = 1, append: boolean = false) => {
    if (!dbUser?.id) return;
    try {
      setIsLoading(true);
      
      // Use NextAuth session (cookie-based, no token needed)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(`/api/users/comments?userId=${dbUser.id}&page=${pageNum}&limit=12`, { headers });
      if (!response.ok) throw new Error('Failed to fetch user comments');
      const data = await response.json();
      setItems(prev => (append ? [...prev, ...data.comments] : data.comments));
      setHasMore(data.pagination.page < data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !isGuest && dbUser?.id) {
      fetchComments(1, false);
    }
  }, [loading, isGuest, dbUser?.id]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchComments(next, true);
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
      <h1 className="text-3xl font-bold mb-6">Comments</h1>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-[5px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
            {items.map((item) => (
              <div key={item.id} className="h-fit">
                <div className="relative">
                  <PostCard post={item.post} currentUserId={dbUser?.id} />
                  {/* Connector line: thin, matte, not affected by backdrop */}
                  <div
                    className="pointer-events-none absolute left-3 -bottom-[22px] h-10 w-0.5 rounded -z-10 bg-foreground/30 dark:bg-foreground/40"
                  />
                </div>
                <div className="mt-6 rounded-md border p-3 text-sm bg-background relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium">
                      {dbUser?.name ? `${dbUser.name}` : t('common.user')}
                    </div>
                    <button
                      aria-label={t('comments.deleteComment')}
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive"
                      onClick={async () => {
                        setPendingDeleteId(item.id);
                        setConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t('comments.deleteComment')}</span>
                    </button>
                  </div>
                  <div className="text-muted-foreground whitespace-pre-wrap">{item.content}</div>
                </div>
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

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('comments.deleteComment')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('comments.deleteConfirm')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (!pendingDeleteId) return;
                    try {
                      const res = await fetch(`/api/comments/${pendingDeleteId}`, { method: 'DELETE' });
                      if (!res.ok) throw new Error('Failed');
                      setItems(prev => prev.filter(c => c.id !== pendingDeleteId));
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setConfirmOpen(false);
                      setPendingDeleteId(null);
                    }
                  }}
                >
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}


