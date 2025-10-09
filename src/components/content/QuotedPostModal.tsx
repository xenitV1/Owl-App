"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LazyOptimizedImage } from "@/components/ui/optimized-image";
import { ContentPreview } from "./ContentPreview";
import { useTranslations } from "next-intl";
import { getLocalizedSubjectLabel, getLocalizedGradeLabel } from "@/lib/utils";
import { Clock, ExternalLink } from "lucide-react";

interface QuotedPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  };
}

export const QuotedPostModal: React.FC<QuotedPostModalProps> = ({
  open,
  onOpenChange,
  post,
}) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("posts");
  const tc = useTranslations("common");
  const tr = useTranslations("roles");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60),
      );
      return diffInMinutes <= 1 ? "Just now" : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }
  };

  const handleViewFullPost = () => {
    onOpenChange(false);
    // Post detail modal'ını açmak için parent component'e callback gönder
    // Bu modal'da post detail modal'ı yok, bu yüzden geçici olarak kaldırıldı
    console.log("View full post clicked:", post.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{post.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Author info */}
          <div className="flex items-start gap-3">
            <Avatar
              className="flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/20"
              onClick={() => {
                onOpenChange(false);
                router.push(`/${locale}/profile/${post.author.id}`);
              }}
            >
              <AvatarImage src={post.author.avatar} alt={post.author.name} />
              <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="font-semibold cursor-pointer hover:underline"
                  onClick={() => {
                    onOpenChange(false);
                    router.push(`/${locale}/profile/${post.author.id}`);
                  }}
                >
                  {post.author.name}
                </h3>
                {post.author.role && (
                  <Badge variant="secondary" className="text-xs">
                    {tr(post.author.role as any)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {post.author.school && (
                  <Badge variant="secondary" className="text-xs">
                    {post.author.school}
                  </Badge>
                )}
                {post.author.grade && (
                  <Badge variant="outline" className="text-xs">
                    {getLocalizedGradeLabel(post.author.grade, locale)}
                  </Badge>
                )}
                {post.subject && (
                  <Badge variant="default" className="text-xs">
                    {getLocalizedSubjectLabel(post.subject, locale)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          {post.content && (
            <div className="text-sm leading-relaxed text-foreground">
              <ContentPreview content={post.content} />
            </div>
          )}

          {/* Image */}
          {post.image && post.image.trim() !== "" && (
            <div className="relative">
              <LazyOptimizedImage
                src={`/api/images/${post.image}`}
                alt={post.title}
                className="w-full max-h-[400px] rounded-lg object-contain"
                imageMetadata={post.imageMetadata}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {tc("close", { defaultMessage: "Close" })}
            </Button>
            <Button size="sm" onClick={handleViewFullPost}>
              <ExternalLink className="h-4 w-4 mr-2" />
              {t("viewPost")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
