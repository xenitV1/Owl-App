'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginButton } from '@/components/auth/LoginButton';
import { Heart, MessageCircle, Droplets, Eye } from 'lucide-react';

interface ContentInteractionProps {
  likes: number;
  comments: number;
  pools: number;
  isLiked?: boolean;
  isSaved?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
}

export const ContentInteraction: React.FC<ContentInteractionProps> = ({
  likes,
  comments,
  pools,
  isLiked = false,
  isSaved = false,
  onLike,
  onComment,
  onSave,
}) => {
  const { isGuest } = useAuth();
  const likeSoundRef = React.useRef<HTMLAudioElement | null>(null);
  const commentSoundRef = React.useRef<HTMLAudioElement | null>(null);
  const poolSoundRef = React.useRef<HTMLAudioElement | null>(null);

  // Initialize interaction sounds
  React.useEffect(() => {
    likeSoundRef.current = new Audio('/sounds/like-button.mp3');
    likeSoundRef.current.volume = 0.4;
    likeSoundRef.current.preload = 'auto';
    
    commentSoundRef.current = new Audio('/sounds/comment-button.mp3');
    commentSoundRef.current.volume = 0.4;
    commentSoundRef.current.preload = 'auto';
    
    poolSoundRef.current = new Audio('/sounds/pool-vote.mp3');
    poolSoundRef.current.volume = 0.5;
    poolSoundRef.current.preload = 'auto';
    
    // Preload all
    likeSoundRef.current.load();
    commentSoundRef.current.load();
    poolSoundRef.current.load();
  }, []);

  const playLikeSound = () => {
    if (likeSoundRef.current) {
      likeSoundRef.current.currentTime = 0;
      likeSoundRef.current.play().catch(() => {});
    }
  };

  const playCommentSound = () => {
    if (commentSoundRef.current) {
      commentSoundRef.current.currentTime = 0;
      commentSoundRef.current.play().catch(() => {});
    }
  };

  const playPoolSound = () => {
    if (poolSoundRef.current) {
      poolSoundRef.current.currentTime = 0;
      poolSoundRef.current.play().catch(() => {});
    }
  };

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
              <div className="relative w-4 h-4 opacity-70">
                <Image
                  src="/owl-like-icon.png"
                  alt="Likes"
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </div>
              <span>{likes} likes</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{comments} comments</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="h-4 w-4" />
              <span>{pools} Pool</span>
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
        onClick={() => {
          playLikeSound();
          onLike?.();
        }}
        className="flex items-center gap-1 px-2 py-1 h-auto group"
      >
        <div className={`relative w-4 h-4 transition-all duration-200 ${isLiked ? 'scale-110' : 'scale-100 opacity-70 group-hover:opacity-100'}`}>
          <Image
            src="/owl-like-icon.png"
            alt="Like"
            width={16}
            height={16}
            className={`object-contain ${isLiked ? 'brightness-110' : 'brightness-90'}`}
          />
        </div>
        <span className="text-xs">{likes}</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          playCommentSound();
          onComment?.();
        }}
        className="flex items-center gap-1 px-2 py-1 h-auto"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="text-xs">{comments}</span>
      </Button>
      
      <Button
        variant={isSaved ? "default" : "ghost"}
        size="sm"
        onClick={() => {
          playPoolSound();
          onSave?.();
        }}
        className="flex items-center gap-1 px-2 py-1 h-auto"
      >
        <Droplets className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
        <span className="text-xs">{pools}</span>
      </Button>
    </div>
  );
};