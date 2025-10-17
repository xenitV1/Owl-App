"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginButton } from "@/components/auth/LoginButton";
import { Heart, MessageCircle, Droplets, Eye } from "lucide-react";
import { EchoButton } from "./EchoButton";

interface ContentInteractionProps {
  likes: number;
  comments: number;
  pools: number;
  echoes?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isEchoed?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  onQuickEcho?: () => void;
}

export const ContentInteraction: React.FC<ContentInteractionProps> = ({
  likes: initialLikes,
  comments: initialComments,
  pools: initialPools,
  echoes: initialEchoes = 0,
  isLiked: initialIsLiked = false,
  isSaved: initialIsSaved = false,
  isEchoed: initialIsEchoed = false,
  onLike,
  onComment,
  onSave,
  onQuickEcho,
}) => {
  const { isGuest } = useAuth();
  const t = useTranslations("contentInteraction");
  const likeSoundRef = React.useRef<HTMLAudioElement | null>(null);
  const commentSoundRef = React.useRef<HTMLAudioElement | null>(null);
  const poolSoundRef = React.useRef<HTMLAudioElement | null>(null);

  // Local state for optimistic updates
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState(initialComments);
  const [pools, setPools] = useState(initialPools);
  const [echoes, setEchoes] = useState(initialEchoes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isEchoed, setIsEchoed] = useState(initialIsEchoed);
  const [isAnimatingLike, setIsAnimatingLike] = useState(false);
  const [isAnimatingSave, setIsAnimatingSave] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setLikes(initialLikes);
    setComments(initialComments);
    setPools(initialPools);
    setEchoes(initialEchoes);
    setIsLiked(initialIsLiked);
    setIsSaved(initialIsSaved);
    setIsEchoed(initialIsEchoed);
  }, [
    initialLikes,
    initialComments,
    initialPools,
    initialEchoes,
    initialIsLiked,
    initialIsSaved,
    initialIsEchoed,
  ]);

  // Initialize interaction sounds
  React.useEffect(() => {
    likeSoundRef.current = new Audio("/api/sounds/like-button.mp3");
    likeSoundRef.current.volume = 0.4;
    likeSoundRef.current.preload = "auto";

    commentSoundRef.current = new Audio("/api/sounds/comment-button.mp3");
    commentSoundRef.current.volume = 0.4;
    commentSoundRef.current.preload = "auto";

    poolSoundRef.current = new Audio("/api/sounds/pool-vote.mp3");
    poolSoundRef.current.volume = 0.5;
    poolSoundRef.current.preload = "auto";

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
            {t("guestView")}
          </CardTitle>
          <CardDescription>{t("signInToInteract")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-around text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="relative w-4 h-4 opacity-70">
                <Image
                  src="/owl-like-icon.png"
                  alt="Likes"
                  width={16}
                  height={16}
                />
              </div>
              <span>
                {likes} {t("likes")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>
                {comments} {t("comments")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="h-4 w-4" />
              <span>
                {pools} {t("pool")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>
                {echoes} {t("echoes")}
              </span>
            </div>
          </div>
          <div className="flex justify-center">
            <LoginButton />
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleLikeClick = () => {
    // Optimistic update
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
    setIsAnimatingLike(true);

    // Play sound
    playLikeSound();

    // Call parent handler
    onLike?.();

    // Remove animation after duration
    setTimeout(() => setIsAnimatingLike(false), 300);
  };

  const handleSaveClick = () => {
    // Optimistic update
    setIsSaved(!isSaved);
    setPools((prev) => (isSaved ? prev - 1 : prev + 1));
    setIsAnimatingSave(true);

    // Play sound
    playPoolSound();

    // Call parent handler
    onSave?.();

    // Remove animation after duration
    setTimeout(() => setIsAnimatingSave(false), 300);
  };

  const handleCommentClick = () => {
    playCommentSound();
    onComment?.();
    // Note: Comment count update is handled by onCommentAdded callback in parent
  };

  return (
    <div className="flex items-center justify-between">
      <Button
        variant={isLiked ? "default" : "ghost"}
        size="sm"
        onClick={handleLikeClick}
        className="flex items-center gap-1 px-2 py-1 h-auto group"
      >
        <div
          className={`relative w-4 h-4 transition-all duration-200 ${
            isAnimatingLike
              ? "scale-125 rotate-12"
              : isLiked
                ? "scale-110"
                : "scale-100 opacity-70 group-hover:opacity-100"
          }`}
        >
          <Image
            src="/owl-like-icon.png"
            alt="Like"
            width={16}
            height={16}
            className={`${isLiked ? "brightness-110" : "brightness-90"}`}
          />
        </div>
        <span
          className={`text-xs transition-all duration-200 ${
            isAnimatingLike ? "scale-110 font-bold" : ""
          }`}
        >
          {likes}
        </span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCommentClick}
        className="flex items-center gap-1 px-2 py-1 h-auto"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="text-xs">{comments}</span>
      </Button>

      {onQuickEcho && (
        <EchoButton
          echoCount={echoes}
          isEchoed={isEchoed}
          onQuickEcho={onQuickEcho}
          onRemoveEcho={onQuickEcho}
        />
      )}

      <Button
        variant={isSaved ? "default" : "ghost"}
        size="sm"
        onClick={handleSaveClick}
        className="flex items-center gap-1 px-2 py-1 h-auto"
      >
        <Droplets
          className={`h-4 w-4 transition-all duration-200 ${
            isAnimatingSave ? "scale-125 -rotate-12" : ""
          } ${isSaved ? "fill-current" : ""}`}
        />
        <span
          className={`text-xs transition-all duration-200 ${
            isAnimatingSave ? "scale-110 font-bold" : ""
          }`}
        >
          {pools}
        </span>
      </Button>
    </div>
  );
};
