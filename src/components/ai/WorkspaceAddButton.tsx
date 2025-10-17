"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkspaceAddButtonProps {
  post: {
    id: string;
    title: string;
    aiContentType?: string | null;
    aiGeneratedContent?: string | null;
  };
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function WorkspaceAddButton({
  post,
  variant = "secondary",
  size = "default",
}: WorkspaceAddButtonProps) {
  const t = useTranslations();
  const tWorkspace = useTranslations("workspaceAddButton");
  const locale = useLocale();
  const { toast } = useToast();
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToWorkspace = async () => {
    if (!post.aiContentType || !post.aiGeneratedContent) {
      toast({
        title: t("common.error"),
        description: tWorkspace("noAIContent"),
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    try {
      // Store AI content in localStorage for workspace to pick up
      const workspaceData = {
        postId: post.id,
        title: post.title,
        contentType: post.aiContentType,
        content: post.aiGeneratedContent,
        timestamp: Date.now(),
      };

      localStorage.setItem(
        "pendingWorkspaceAdd",
        JSON.stringify(workspaceData),
      );

      // Open workspace in new tab (or focus existing workspace tab)
      const workspaceUrl = `/${locale}/work-environment`;
      const workspaceWindow = window.open(workspaceUrl, "owl-workspace");

      // Focus the window if it was already open
      if (workspaceWindow) {
        workspaceWindow.focus();
      }

      toast({
        title: t("common.success"),
        description: t("ai.redirectingToWorkspace"),
      });
    } catch (error) {
      console.error("Error adding to workspace:", error);
      toast({
        title: t("common.error"),
        description: tWorkspace("failedToAddContent"),
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Only show if AI content exists
  if (!post.aiContentType || !post.aiGeneratedContent) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToWorkspace}
      disabled={isAdding}
    >
      {isAdding ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {t("loading.loading")}
        </>
      ) : (
        <>
          <Plus className="h-4 w-4 mr-2" />
          {t("ai.addToWorkspace")}
        </>
      )}
    </Button>
  );
}
