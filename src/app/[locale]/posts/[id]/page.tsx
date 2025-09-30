'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ContentInteraction } from '@/components/content/ContentInteraction';
import { CommentDialog } from '@/components/content/CommentDialog';
import { LazyOptimizedImage } from '@/components/ui/optimized-image';
import { MostReadNotes } from '@/components/content/MostReadNotes';
import { DiscoverNotes } from '@/components/content/DiscoverNotes';
import { TrendingSubjects } from '@/components/content/TrendingSubjects';
import { Heart, MessageCircle, Bookmark, Clock, ArrowLeft, Flag, MoreVertical, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReportDialog } from '@/components/moderation/ReportDialog';
import { SimpleImageLightbox } from '@/components/ui/image-lightbox';
import { Skeleton } from '@/components/ui/skeleton';

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
  _count: {
    likes: number;
    comments: number;
    pools: number;
  };
}

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations();
  const tr = useTranslations('roles');
  
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saveCount, setSaveCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${id}`);
      if (response.ok) {
        const postData = await response.json();
        setPost(postData);
        setLikeCount(postData._count.likes);
        setSaveCount(postData._count.pools);
        
        // Track the post view
        try {
          await fetch(`/api/posts/${id}/view`, { method: 'POST' });
        } catch (viewError) {
          console.warn('Failed to track post view:', viewError);
        }
      } else {
        console.error('Failed to fetch post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/likes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: id }),
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/pools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: id }),
      });

      if (response.ok) {
        setIsSaved(!isSaved);
        setSaveCount(prev => isSaved ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleComment = () => {
    setShowComments(true);
  };

  const handleImageClick = () => {
    setShowImageLightbox(true);
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-32 mb-4" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Most Read Notes */}
          <div className="lg:col-span-3">
            <Skeleton className="h-96 w-full" />
          </div>
          
          {/* Center Content */}
          <div className="lg:col-span-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
          
          {/* Right Sidebar - Discover Notes */}
          <div className="lg:col-span-3">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Most Read Notes (Blue Box) */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <MostReadNotes />
        </div>
        
        {/* Center Content - Post */}
        <div className="lg:col-span-6 order-1 lg:order-2">
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.author.avatar} alt={post.author.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(post.author.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{post.author.name}</h3>
                      {post.author.role && (
                        <Badge variant="secondary" className="text-xs">
                          {tr(post.author.role as any)}
                        </Badge>
                      )}
                      {post.author.school && (
                        <Badge variant="secondary" className="text-xs">
                          {post.author.school}
                        </Badge>
                      )}
                      {post.author.grade && (
                        <Badge variant="outline" className="text-xs">
                          {post.author.grade}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {post.subject && (
                    <Badge variant="default" className="text-xs">
                      {post.subject}
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <ReportDialog
                        targetId={post.id}
                        targetType="POST"
                        postId={post.id}
                      >
                        <DropdownMenuItem className="text-red-600">
                          <Flag className="h-4 w-4 mr-2" />
                          Report Post
                        </DropdownMenuItem>
                      </ReportDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <CardTitle className="text-2xl leading-tight">
                {post.title}
              </CardTitle>
              
              {post.content && (
                <div className="text-base text-muted-foreground leading-relaxed break-words break-all whitespace-pre-wrap">
                  {post.content}
                </div>
              )}
              
              {post.image && (
                <div className="relative cursor-pointer group" onClick={handleImageClick}>
                  <LazyOptimizedImage
                    src={`/api/images/${post.image}`}
                    alt={post.title}
                    className="w-full max-h-[600px] rounded-lg transition-all duration-200 group-hover:brightness-95"
                    imageMetadata={post.imageMetadata}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 rounded-lg">
                    <div className="bg-white/90 rounded-full p-3 shadow-lg">
                      <Eye className="h-6 w-6 text-gray-700" />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span>{likeCount} likes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{post._count.comments} comments</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bookmark className="h-4 w-4" />
                    <span>{saveCount} saves</span>
                  </div>
                </div>
              </div>
              
              <ContentInteraction
                likes={likeCount}
                comments={post._count.comments}
                pools={post._count.pools}
                isLiked={isLiked}
                isSaved={isSaved}
                onLike={handleLike}
                onComment={handleComment}
                onSave={handleSave}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Right Sidebar - Discover Notes (Red Box) */}
        <div className="lg:col-span-3 order-3">
          <DiscoverNotes />
        </div>
      </div>

      {/* Bottom Section - Trending Subjects (Green Box) */}
      <div className="mt-8">
        <TrendingSubjects />
      </div>

      <CommentDialog
        open={showComments}
        onOpenChange={setShowComments}
        postId={post.id}
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
    </div>
  );
}
