'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ContentInteraction } from './ContentInteraction';
import { CommentDialog } from './CommentDialog';
import { ReportDialog } from '@/components/moderation/ReportDialog';
import { ContentPreview } from './ContentPreview';
import { LazyOptimizedImage } from '@/components/ui/optimized-image';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { SimpleImageLightbox } from '@/components/ui/image-lightbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Bookmark, Clock, Eye, MoreVertical, Flag, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Post {
  id: string;
  title: string;
  content?: string;
  image?: string;
  imageMetadata?: {
    width: number;
    height: number;
    placeholder?: string;
    responsive?: Record<string, {
      width: number;
      height: number;
      filename: string;
    }>;
  };
  subject?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
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

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  isLiked?: boolean;
  isSaved?: boolean;
  onLike?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  showCategory?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  isLiked = false,
  isSaved = false,
  onLike,
  onSave,
  onComment,
  onDelete,
  showCategory = false,
}) => {
  const router = useRouter();
  const locale = useLocale();
  const [showComments, setShowComments] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const tr = useTranslations('roles');
  const t = useTranslations('posts');
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleLike = async () => {
    if (!onLike || isLikeLoading) return;
    
    setIsLikeLoading(true);
    try {
      await onLike(post.id);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleSave = async () => {
    if (!onSave || isSaveLoading) return;
    
    setIsSaveLoading(true);
    try {
      await onSave(post.id);
    } finally {
      setIsSaveLoading(false);
    }
  };

  const handleComment = () => {
    setShowComments(true);
    if (onComment) {
      onComment(post.id);
    }
  };

  const handleDelete = async () => {
    if (!currentUserId || post.author.id !== currentUserId) {
      toast({
        title: t('error'),
        description: t('onlyOwnPosts'),
        variant: "destructive",
      });
      return;
    }

    setIsDeleteLoading(true);
    try {
      // Get Firebase token for authentication
      const token = user ? await user.getIdToken() : null;
      
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete post');
      }

      toast({
        title: t('success'),
        description: t('deleteSuccess'),
      });

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: t('error'),
        description: t('deleteError'),
        variant: "destructive",
      });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCardClick = () => {
    router.push(`/${locale}/posts/${post.id}`);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setShowImageLightbox(true);
  };

  return (
    <>
      <Card 
        className="w-full cursor-pointer overflow-hidden" 
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3 overflow-hidden">
          <div className="flex items-start gap-3 w-full min-w-0">
            <Avatar className="flex-shrink-0">
              <AvatarImage src={post.author.avatar} alt={post.author.name} />
              <AvatarFallback>
                {getInitials(post.author.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1 overflow-hidden">
              <div className="flex items-center justify-between gap-2 w-full min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                  <h3 className="font-semibold truncate">{post.author.name}</h3>
                  {post.author.role && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {tr(post.author.role as any)}
                    </Badge>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {currentUserId === post.author.id && (
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('deletePost')}
                        </DropdownMenuItem>
                      )}
                      <ReportDialog
                        targetId={post.id}
                        targetType="POST"
                        postId={post.id}
                      >
                        <DropdownMenuItem className="text-red-600">
                          <Flag className="h-4 w-4 mr-2" />
                          {t('report')}
                        </DropdownMenuItem>
                      </ReportDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap overflow-hidden">
                {post.author.school && (
                  <Badge variant="secondary" size="truncate" className="text-xs" title={post.author.school}>
                    {post.author.school}
                  </Badge>
                )}
                {post.author.grade && (
                  <Badge variant="outline" size="truncate" className="text-xs" title={post.author.grade}>
                    {post.author.grade}
                  </Badge>
                )}
                {post.subject && (
                  <Badge variant="default" size="truncate" className="text-xs" title={post.subject}>
                    {post.subject}
                  </Badge>
                )}
                {showCategory && post.category && (
                  <Badge 
                    variant="secondary" 
                    size="truncate"
                    className="text-xs"
                    style={{ 
                      backgroundColor: post.category.color + '20',
                      color: post.category.color 
                    }}
                    title={post.category.name}
                  >
                    {post.category.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Title */}
          <CardTitle className="text-lg leading-tight line-clamp-2">
            {post.title}
          </CardTitle>
          
          {/* Content */}
          {post.content && (
            <div className="text-sm text-muted-foreground leading-relaxed break-words break-all whitespace-pre-wrap">
              <ContentPreview content={post.content} />
            </div>
          )}
          
          {/* Image */}
          {post.image && (
            <div className="relative cursor-pointer group" onClick={handleImageClick}>
              <LazyOptimizedImage
                src={`/api/images/${post.image}`}
                alt={post.title}
                className="w-full max-h-96 rounded-lg transition-all duration-200 group-hover:brightness-95"
                imageMetadata={post.imageMetadata}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 rounded-lg">
                <div className="bg-white/90 rounded-full p-2 shadow-lg">
                  <Eye className="h-5 w-5 text-gray-700" />
                </div>
              </div>
            </div>
          )}
          
          {/* Interactive Buttons with Stats */}
          <div onClick={(e) => e.stopPropagation()}>
            <ContentInteraction
              likes={post._count.likes}
              comments={post._count.comments}
              isLiked={isLiked}
              isSaved={isSaved}
              onLike={handleLike}
              onComment={handleComment}
              onSave={handleSave}
            />
          </div>
        </CardContent>
      </Card>

      {/* Comment Dialog */}
      <CommentDialog
        open={showComments}
        onOpenChange={setShowComments}
        postId={post.id}
        currentUserId={currentUserId}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isLoading={isDeleteLoading}
      />

      {/* Image Lightbox */}
      {post.image && (
        <SimpleImageLightbox
          isOpen={showImageLightbox}
          onClose={() => setShowImageLightbox(false)}
          src={`/api/images/${post.image}`}
          alt={post.title}
          title={post.title}
          imageMetadata={post.imageMetadata}
        />
      )}
    </>
  );
};