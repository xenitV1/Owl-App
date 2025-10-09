"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PostCard } from "./PostCard";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface Post {
  id: string;
  title: string;
  content?: string;
  image?: string;
  imageMetadata?: {
    width: number;
    height: number;
    placeholder?: string;
    responsive?: Record<
      string,
      {
        width: number;
        height: number;
        filename: string;
      }
    >;
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
    echoes?: number;
  };
  echoedBy?: {
    id: string;
    name: string;
    avatar?: string;
  };
  echoComment?: string | null;
  echoCreatedAt?: string;
  aiGenerated?: boolean;
  aiContentType?: string | null;
  aiGeneratedContent?: string | null;
  aiSourceDocument?: string | null;
  aiAgeGroup?: string | null;
}

interface PostDetailModalProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
  isLiked?: boolean;
  isSaved?: boolean;
  isEchoed?: boolean;
  onLike?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onCommentAdded?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onEcho?: (postId: string, comment?: string, remove?: boolean) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  open,
  onOpenChange,
  currentUserId,
  isLiked,
  isSaved,
  isEchoed,
  onLike,
  onSave,
  onComment,
  onCommentAdded,
  onDelete,
  onEcho,
}) => {
  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>{post.title}</DialogTitle>
          </VisuallyHidden>
        </DialogHeader>
        <PostCard
          post={post}
          currentUserId={currentUserId}
          isLiked={isLiked}
          isSaved={isSaved}
          isEchoed={isEchoed}
          onLike={onLike}
          onSave={onSave}
          onComment={onComment}
          onCommentAdded={onCommentAdded}
          onDelete={onDelete}
          onEcho={onEcho}
          showCategory
        />
      </DialogContent>
    </Dialog>
  );
};
