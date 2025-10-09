"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LazyOptimizedImage } from "@/components/ui/optimized-image";
import { ContentPreview } from "./ContentPreview";
import { useTranslations } from "next-intl";

interface EchoPostCardProps {
  post: {
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
    author: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  echoComment?: string | null;
  onQuotedPostClick: () => void;
}

export const EchoPostCard: React.FC<EchoPostCardProps> = ({
  post,
  echoComment,
  onQuotedPostClick,
}) => {
  const t = useTranslations("posts");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-3">
      {/* Quote comment as primary content */}
      {echoComment && (
        <div className="text-sm leading-relaxed text-foreground">
          {echoComment}
        </div>
      )}

      {/* Quoted original content (compact) */}
      <div
        className="p-3 rounded-md border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onQuotedPostClick();
        }}
        title={t("showMore")}
        role="button"
        aria-label="Open original post"
      >
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={post.author.avatar} alt={post.author.name} />
            <AvatarFallback className="text-[10px]">
              {getInitials(post.author.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium truncate">
            {post.author.name}
          </span>
        </div>
        {post.title && (
          <div className="text-sm font-medium mb-1 line-clamp-1">
            {post.title}
          </div>
        )}
        {post.content && (
          <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
            <ContentPreview content={post.content} />
          </div>
        )}
        {post.image && post.image.trim() !== "" && (
          <div className="relative">
            <LazyOptimizedImage
              src={`/api/images/${post.image}`}
              alt={post.title}
              className="w-full max-h-40 object-cover rounded-md"
              imageMetadata={post.imageMetadata}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
