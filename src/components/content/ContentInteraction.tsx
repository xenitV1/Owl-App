'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginButton } from '@/components/auth/LoginButton';
import { Heart, MessageCircle, Bookmark, Eye } from 'lucide-react';

interface ContentInteractionProps {
  likes: number;
  comments: number;
  isLiked?: boolean;
  isSaved?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
}

export const ContentInteraction: React.FC<ContentInteractionProps> = ({
  likes,
  comments,
  isLiked = false,
  isSaved = false,
  onLike,
  onComment,
  onSave,
}) => {
  const { isGuest } = useAuth();

  if (isGuest) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Guest View
          </CardTitle>
          <CardDescription>
            Sign in to like, comment, and save content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{likes} likes</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{comments} comments</span>
            </div>
            <div className="flex items-center gap-1">
              <Bookmark className="h-4 w-4" />
              <span>Saved</span>
            </div>
          </div>
          <div className="flex justify-center">
            <LoginButton />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <Button
        variant={isLiked ? "default" : "ghost"}
        size="sm"
        onClick={onLike}
        className="flex items-center gap-1 px-2 py-1 h-auto"
      >
        <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
        <span className="text-xs">{likes}</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onComment}
        className="flex items-center gap-1 px-2 py-1 h-auto"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="text-xs">{comments}</span>
      </Button>
      
      <Button
        variant={isSaved ? "default" : "ghost"}
        size="sm"
        onClick={onSave}
        className="flex items-center gap-1 px-2 py-1 h-auto"
      >
        <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
        <span className="text-xs">Save</span>
      </Button>
    </div>
  );
};