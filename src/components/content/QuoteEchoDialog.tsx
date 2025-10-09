"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

interface Post {
  id: string;
  title: string;
  content?: string;
  author: {
    name: string;
    avatar?: string;
    role?: string;
  };
}

interface QuoteEchoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
  onSubmit: (comment: string) => Promise<void>;
}

export const QuoteEchoDialog: React.FC<QuoteEchoDialogProps> = ({
  open,
  onOpenChange,
  post,
  onSubmit,
}) => {
  const t = useTranslations("echo");
  const tr = useTranslations("roles");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxLength = 280;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(comment.trim());
      setComment("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting quote echo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setComment("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t("quoteEcho")}</DialogTitle>
          <DialogDescription>{t("addYourThoughts")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Comment Input */}
          <div className="space-y-2">
            <Textarea
              placeholder={t("addYourThoughts")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={maxLength}
              rows={4}
              className="resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                {t("characterLimit", {
                  current: comment.length,
                  max: maxLength,
                })}
              </span>
              <span
                className={
                  comment.length >= maxLength
                    ? "text-destructive font-semibold"
                    : ""
                }
              >
                {maxLength - comment.length}
              </span>
            </div>
          </div>

          {/* Post Preview */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <Avatar className="flex-shrink-0">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {post.author.name}
                  </span>
                  {post.author.role && (
                    <Badge variant="secondary" className="text-xs">
                      {tr(post.author.role as any)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium line-clamp-2">{post.title}</p>
                {post.content && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.content}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || comment.trim().length === 0}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("echoWith")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
