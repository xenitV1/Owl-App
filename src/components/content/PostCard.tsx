"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContentInteraction } from "./ContentInteraction";
import { CommentDialog } from "./CommentDialog";
import { ReportDialog } from "@/components/moderation/ReportDialog";
import { ContentPreview } from "./ContentPreview";
import { LazyOptimizedImage } from "@/components/ui/optimized-image";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { SimpleImageLightbox } from "@/components/ui/image-lightbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBlockCheck } from "@/hooks/useBlockCheck";
import { Clock, Eye, MoreVertical, Flag, Trash2, Sparkles } from "lucide-react";
import { getLocalizedSubjectLabel, getLocalizedGradeLabel } from "@/lib/utils";
import { WorkspaceAddButton } from "@/components/ai/WorkspaceAddButton";
import { AIFlashcardViewer } from "@/components/ai/AIFlashcardViewer";
import { AIQuestionViewer } from "@/components/ai/AIQuestionViewer";
import { AINotesViewer } from "@/components/ai/AINotesViewer";
import { EchoIcon } from "@/components/icons/EchoIcon";
import { EchoPostCard } from "./EchoPostCard";
import { QuotedPostModal } from "./QuotedPostModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  aiDetectedSubject?: string | null;
  subjectChangedByAI?: boolean;
  subjectVerifiedByAI?: boolean;
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
  // AI-generated content fields
  aiGenerated?: boolean;
  aiContentType?: string | null;
  aiGeneratedContent?: string | null;
  aiSourceDocument?: string | null;
  aiAgeGroup?: string | null;
}

interface PostCardProps {
  post: Post;
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
  showCategory?: boolean;
  onClick?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  isLiked = false,
  isSaved = false,
  isEchoed = false,
  onLike,
  onSave,
  onComment,
  onCommentAdded,
  onDelete,
  onEcho,
  showCategory = false,
  onClick,
}) => {
  const router = useRouter();
  const locale = useLocale();
  const [showComments, setShowComments] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [showQuotedPostModal, setShowQuotedPostModal] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const tr = useTranslations("roles");
  const t = useTranslations("posts");
  const te = useTranslations("echo");
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isEchoLoading, setIsEchoLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isBlocked, isLoading: blockLoading } = useBlockCheck(post.author.id);
  const isEcho = Boolean(post.echoedBy);
  const isQuoteEcho = Boolean(post.echoComment);
  const isSimpleEcho = isEcho && !isQuoteEcho;
  const displayUser = isSimpleEcho ? post.author : post.echoedBy || post.author;

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

  const handleQuickEcho = async () => {
    if (!onEcho || isEchoLoading) return;

    setIsEchoLoading(true);
    try {
      // If already echoed, remove echo. Otherwise, create echo
      if (isEchoed) {
        await onEcho(post.id, undefined, true); // true = remove
        toast({
          title: te("echoRemoved"),
          description: "Echo removed successfully",
        });
      } else {
        await onEcho(post.id);
        toast({
          title: te("echoSuccess"),
          description: te("quickEcho"),
        });
      }
    } catch (error) {
      console.error("Error toggling echo:", error);
      toast({
        title: t("error"),
        description: "Failed to toggle echo",
        variant: "destructive",
      });
    } finally {
      setIsEchoLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUserId || post.author.id !== currentUserId) {
      toast({
        title: t("error"),
        description: t("onlyOwnPosts"),
        variant: "destructive",
      });
      return;
    }

    setIsDeleteLoading(true);
    try {
      // Use NextAuth session (cookie-based, no token needed)
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete post");
      }

      toast({
        title: t("success"),
        description: t("deleteSuccess"),
      });

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: t("error"),
        description: t("deleteError"),
        variant: "destructive",
      });
    } finally {
      setIsDeleteLoading(false);
    }
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCardClick = () => {
    // Post detail modal'ını aç - parent component'e callback gönder
    if (onClick) {
      onClick();
    } else {
      console.log("Post clicked:", post.id);
    }
  };

  const handleUserProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    router.push(`/${locale}/profile/${post.author.id}`);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setShowImageLightbox(true);
  };

  // Don't render anything for blocked users
  if (isBlocked && !blockLoading) {
    return null;
  }

  return (
    <>
      <Card
        className={`w-full overflow-hidden ${isQuoteEcho ? "border-muted-foreground/20" : ""} ${onClick ? "cursor-pointer" : ""}`}
        onClick={onClick}
      >
        {/* Echo Banner for simple echoes */}
        {isSimpleEcho && post.echoedBy && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <EchoIcon className="h-4 w-4" />
              <Avatar className="h-5 w-5">
                <AvatarImage
                  src={post.echoedBy.avatar}
                  alt={post.echoedBy.name}
                />
                <AvatarFallback className="text-[10px]">
                  {getInitials(post.echoedBy.name)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">
                {post.echoedBy.name}
              </span>
              <span>{te("echoed").toLowerCase()}</span>
            </div>
          </div>
        )}

        {/* Wrapper for simple echo to create box effect */}
        <div
          className={
            isSimpleEcho ? "mx-4 mb-4 p-3 rounded-lg border bg-muted/30" : ""
          }
        >
          <CardHeader
            className={`${isQuoteEcho ? "pb-2" : "pb-3"} overflow-hidden ${isSimpleEcho ? "p-0 pb-2" : ""}`}
          >
            <div className="flex items-start gap-3 w-full min-w-0">
              <Avatar
                className={`flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/20 hover:scale-105 transition-all duration-200 ${isSimpleEcho ? "h-6 w-6" : ""}`}
                onClick={handleUserProfileClick}
              >
                <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
                <AvatarFallback className={isSimpleEcho ? "text-[10px]" : ""}>
                  {getInitials(displayUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1 overflow-hidden">
                <div className="flex items-center justify-between gap-2 w-full min-w-0">
                  <div
                    className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden cursor-pointer hover:bg-accent/50 rounded-md px-2 py-1 -mx-2 -my-1 transition-all duration-200"
                    onClick={handleUserProfileClick}
                  >
                    {isSimpleEcho && (
                      <span className="text-xs text-muted-foreground">
                        {t("originalPost")}
                      </span>
                    )}
                    <h3
                      className={`font-semibold truncate ${isSimpleEcho ? "text-sm" : ""}`}
                    >
                      {displayUser.name}
                    </h3>
                    {post.author.role && !isQuoteEcho && (
                      <Badge
                        variant="secondary"
                        className="text-xs flex-shrink-0"
                      >
                        {tr(post.author.role as any)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
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
                            {t("deletePost")}
                          </DropdownMenuItem>
                        )}
                        <ReportDialog
                          targetId={post.id}
                          targetType="POST"
                          postId={post.id}
                        >
                          <DropdownMenuItem className="text-red-600">
                            <Flag className="h-4 w-4 mr-2" />
                            {t("report")}
                          </DropdownMenuItem>
                        </ReportDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatTimeAgo(
                      isQuoteEcho && post.echoCreatedAt
                        ? post.echoCreatedAt
                        : post.createdAt,
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap overflow-hidden">
                  {post.author.school && (
                    <Badge
                      variant="secondary"
                      size="truncate"
                      className="text-xs"
                      title={post.author.school}
                    >
                      {post.author.school}
                    </Badge>
                  )}
                  {post.author.grade && (
                    <Badge
                      variant="outline"
                      size="truncate"
                      className="text-xs"
                      title={getLocalizedGradeLabel(post.author.grade, locale)}
                    >
                      {getLocalizedGradeLabel(post.author.grade, locale)}
                    </Badge>
                  )}
                  {post.subject && (
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="default"
                        size="truncate"
                        className="text-xs"
                        title={getLocalizedSubjectLabel(post.subject, locale)}
                      >
                        {getLocalizedSubjectLabel(post.subject, locale)}
                      </Badge>
                      {post.subjectChangedByAI && (
                        <Badge
                          variant="outline"
                          size="truncate"
                          className="text-[10px] px-1 py-0 h-4"
                          title={t("categoryChangedByAI")}
                        >
                          <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                          {t("aiChanged")}
                        </Badge>
                      )}
                      {post.aiDetectedSubject && !post.subjectChangedByAI && (
                        <Badge
                          variant="outline"
                          size="truncate"
                          className="text-[10px] px-1 py-0 h-4"
                          title={t("categoryDetectedByAI")}
                        >
                          <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                          {t("aiDetected")}
                        </Badge>
                      )}
                    </div>
                  )}
                  {showCategory && post.category && (
                    <Badge
                      variant="secondary"
                      size="truncate"
                      className="text-xs"
                      style={{
                        backgroundColor: post.category.color + "20",
                        color: post.category.color,
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

          <CardContent
            className={`space-y-3 ${isQuoteEcho ? "pt-2" : ""} ${isSimpleEcho ? "p-0 pt-2" : ""}`}
          >
            {/* Title */}
            {!isQuoteEcho && (
              <CardTitle
                className={`${isQuoteEcho ? "text-base" : isSimpleEcho ? "text-sm" : "text-lg"} leading-tight line-clamp-2 cursor-pointer hover:text-primary transition-colors`}
                onClick={handleCardClick}
              >
                {post.title}
              </CardTitle>
            )}

            {/* AI-Generated Content or Regular Content */}
            {isQuoteEcho ? (
              <EchoPostCard
                post={post}
                echoComment={post.echoComment}
                onQuotedPostClick={() => setShowQuotedPostModal(true)}
              />
            ) : post.aiGenerated && post.aiGeneratedContent ? (
              <div onClick={(e) => e.stopPropagation()}>
                <div
                  className={`overflow-hidden transition-all duration-300 ${!isContentExpanded ? "max-h-48" : ""}`}
                >
                  {post.aiContentType === "flashcards" &&
                    (() => {
                      try {
                        const parsed = JSON.parse(post.aiGeneratedContent!);
                        const flashcards = Array.isArray(parsed)
                          ? parsed
                          : parsed.flashcards || [];
                        return <AIFlashcardViewer flashcards={flashcards} />;
                      } catch (error) {
                        console.error("Failed to parse flashcards:", error);
                        return (
                          <p className="text-sm text-red-500">
                            Error loading flashcards
                          </p>
                        );
                      }
                    })()}
                  {post.aiContentType === "questions" &&
                    (() => {
                      try {
                        const parsed = JSON.parse(post.aiGeneratedContent!);
                        const questions = Array.isArray(parsed)
                          ? parsed
                          : parsed.questions || [];
                        return <AIQuestionViewer questions={questions} />;
                      } catch (error) {
                        console.error("Failed to parse questions:", error);
                        return (
                          <p className="text-sm text-red-500">
                            Error loading questions
                          </p>
                        );
                      }
                    })()}
                  {post.aiContentType === "notes" &&
                    (() => {
                      try {
                        const parsed = JSON.parse(post.aiGeneratedContent!);
                        const content =
                          typeof parsed === "string"
                            ? parsed
                            : parsed.content || "";
                        return <AINotesViewer content={content} />;
                      } catch (error) {
                        console.error("Failed to parse notes:", error);
                        return (
                          <p className="text-sm text-red-500">
                            Error loading notes
                          </p>
                        );
                      }
                    })()}
                </div>
                <div className="flex justify-center mt-2">
                  <button
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsContentExpanded(!isContentExpanded);
                    }}
                  >
                    {isContentExpanded ? t("showLess") : t("showMore")}
                  </button>
                </div>
              </div>
            ) : post.content ? (
              <div>
                <div
                  className={`${isSimpleEcho ? "text-xs" : "text-sm"} text-muted-foreground leading-relaxed break-words break-all whitespace-pre-wrap cursor-pointer hover:text-foreground transition-colors overflow-hidden transition-all duration-300 ${!isContentExpanded ? (isQuoteEcho || isSimpleEcho ? "max-h-24 line-clamp-3" : "max-h-32") : ""}`}
                  onClick={handleCardClick}
                >
                  <ContentPreview content={post.content} />
                </div>
                {post.content.length > 200 && !isQuoteEcho && (
                  <div className="flex justify-center mt-2">
                    <button
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsContentExpanded(!isContentExpanded);
                      }}
                    >
                      {isContentExpanded ? t("showLess") : t("showMore")}
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {/* Image - hide in quote echo to avoid duplicate visual */}
            {!isQuoteEcho && post.image && post.image.trim() !== "" && (
              <div
                className="relative cursor-pointer group"
                onClick={handleImageClick}
              >
                <LazyOptimizedImage
                  src={`/api/images/${post.image}`}
                  alt={post.title}
                  className={`w-full ${isSimpleEcho ? "max-h-40" : isQuoteEcho ? "max-h-64" : "max-h-96"} rounded-lg transition-all duration-200 group-hover:brightness-95`}
                  imageMetadata={post.imageMetadata}
                  onError={(e) => {
                    console.warn("Failed to load image:", post.image);
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 rounded-lg">
                  <div className="bg-white/90 rounded-full p-2 shadow-lg">
                    <Eye className="h-5 w-5 text-gray-700" />
                  </div>
                </div>
              </div>
            )}

            {/* AI Generated Badge */}
            {post.aiGenerated && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Generated
                </Badge>
                {post.aiSourceDocument && (
                  <span className="text-xs text-muted-foreground">
                    {post.aiSourceDocument}
                  </span>
                )}
              </div>
            )}

            {/* Interactive Buttons with Stats (always separated from content) */}
            <div
              className="mt-3 pt-3 border-t border-muted/60"
              onClick={(e) => e.stopPropagation()}
            >
              <ContentInteraction
                likes={post._count.likes}
                comments={post._count.comments}
                pools={post._count.pools}
                echoes={post._count.echoes || 0}
                isLiked={isLiked}
                isSaved={isSaved}
                isEchoed={isEchoed}
                onLike={handleLike}
                onComment={handleComment}
                onSave={handleSave}
                onQuickEcho={handleQuickEcho}
              />
            </div>

            {/* Add to Workspace Button (for AI-generated content) */}
            {post.aiGenerated && (
              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                <WorkspaceAddButton post={post} variant="outline" size="sm" />
              </div>
            )}
          </CardContent>
        </div>
        {/* End of simple echo wrapper */}
      </Card>

      {/* Comment Dialog */}
      <CommentDialog
        open={showComments}
        onOpenChange={setShowComments}
        postId={post.id}
        currentUserId={currentUserId}
        onCommentAdded={() => onCommentAdded?.(post.id)}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isLoading={isDeleteLoading}
      />

      {/* Image Lightbox */}
      {post.image && post.image.trim() !== "" && (
        <SimpleImageLightbox
          isOpen={showImageLightbox}
          onClose={() => setShowImageLightbox(false)}
          src={`/api/images/${post.image}`}
          alt={post.title}
          title={post.title}
          imageMetadata={post.imageMetadata}
        />
      )}

      {/* Quoted Post Modal */}
      <QuotedPostModal
        open={showQuotedPostModal}
        onOpenChange={setShowQuotedPostModal}
        post={post}
      />
    </>
  );
};
