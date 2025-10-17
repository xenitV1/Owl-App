"use client";

import React, { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, X, Plus, Sparkles, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLoadingMessages } from "@/hooks/useLoadingMessages";
import { AIContentModal } from "@/components/ai/AIContentModal";
import type {
  GeneratedContent,
  Flashcard,
  Question,
  StudyNoteContent,
} from "@/types/ai";

// Feature flag: AI-only mode (set to true to disable normal posting)
const AI_ONLY_MODE = true;

// Helper function to encode Unicode strings to base64
const encodeToBase64 = (str: string): string => {
  try {
    // Try standard btoa first for Latin1 characters
    return btoa(str);
  } catch (e) {
    // If it fails, encode as UTF-8 bytes then base64
    const utf8Bytes = new TextEncoder().encode(str);
    const binaryString = Array.from(utf8Bytes, (byte) =>
      String.fromCharCode(byte),
    ).join("");
    return btoa(binaryString);
  }
};

interface PostCreationFormProps {
  onPostCreated?: () => void;
  onSubmit?: (postData: {
    title: string;
    content: string;
    subject: string;
    image: File | null;
  }) => Promise<void>;
  isSubmitting?: boolean;
  onCancel?: () => void;
  hideAI?: boolean; // Topluluk paylaşımları için AI seçeneğini gizle
}

export const PostCreationForm: React.FC<PostCreationFormProps> = ({
  onPostCreated,
  onSubmit,
  isSubmitting: externalIsSubmitting,
  onCancel,
  hideAI = false,
}) => {
  const t = useTranslations();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, dbUser } = useAuth();

  const { currentMessage } = useLoadingMessages({
    isLoading: externalIsSubmitting ?? isLoading,
    messageKeys: ["processing", "uploading", "saving", "finalizing"],
    interval: 800,
  });

  const SUBJECTS = [
    t("subjects.mathematics"),
    t("subjects.science"),
    t("subjects.english"),
    t("subjects.history"),
    t("subjects.geography"),
    t("subjects.physics"),
    t("subjects.chemistry"),
    t("subjects.biology"),
    t("subjects.computerScience"),
    t("subjects.literature"),
    t("subjects.art"),
    t("subjects.music"),
    t("subjects.physicalEducation"),
    t("subjects.foreignLanguage"),
    t("subjects.economics"),
    t("subjects.psychology"),
    t("subjects.sociology"),
    t("subjects.philosophy"),
    t("subjects.other"),
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (8MB max)
      if (file.size > 8 * 1024 * 1024) {
        toast({
          title: t("posts.fileSizeError"),
          description: t("posts.fileSizeError"),
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: t("posts.fileTypeError"),
          description: t("posts.fileTypeError"),
          variant: "destructive",
        });
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: t("posts.titleRequired"),
        description: t("posts.titleRequired"),
        variant: "destructive",
      });
      return;
    }

    // If external onSubmit handler is provided, use it
    if (onSubmit) {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        subject: subject.trim(),
        image,
      });
      return;
    }

    // Otherwise, use internal submission logic
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("subject", subject);

      if (image) {
        formData.append("image", image);
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
        headers: {
          // Dev fallback: let server identify Firebase user in non-production
          ...(user?.email
            ? { "x-user-email": encodeToBase64(user.email) }
            : {}),
          ...(dbUser?.name
            ? { "x-user-name": encodeToBase64(dbUser.name) }
            : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create post");
      }

      // Reset form
      setTitle("");
      setContent("");
      setSubject("");
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({
        title: t("posts.postCreatedSuccess"),
        description: t("posts.postCreatedSuccess"),
      });

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: t("posts.errorCreatingPost"),
        description:
          error instanceof Error ? error.message : t("posts.errorCreatingPost"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIGenerated = async (generatedContent: GeneratedContent) => {
    // Set title and subject from AI
    setTitle(generatedContent.title);

    if (generatedContent.metadata.subject) {
      setSubject(generatedContent.metadata.subject);
    }

    // Set content as description/summary only
    let description = "";
    if (generatedContent.type === "flashcards") {
      const flashcards = generatedContent.content as Flashcard[];
      description = `📚 ${flashcards.length} AI-Generated Flashcards`;
    } else if (generatedContent.type === "questions") {
      const questions = generatedContent.content as Question[];
      description = `❓ ${questions.length} AI-Generated Practice Questions`;
    } else if (generatedContent.type === "notes") {
      const note = generatedContent.content as StudyNoteContent;
      description = `📝 AI-Generated Study Notes: ${note.title}`;
    }

    setContent(description);

    // Auto-submit with AI content metadata
    try {
      const formData = new FormData();
      formData.append("title", generatedContent.title);
      formData.append("content", description);
      formData.append("subject", generatedContent.metadata.subject || "");

      // Add AI metadata
      formData.append("aiGenerated", "true");
      formData.append("aiContentType", generatedContent.type);
      formData.append(
        "aiGeneratedContent",
        JSON.stringify(generatedContent.content),
      );
      formData.append("aiAgeGroup", generatedContent.metadata.ageGroup);

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
        headers: {
          ...(user?.email
            ? { "x-user-email": encodeToBase64(user.email) }
            : {}),
          ...(dbUser?.name
            ? { "x-user-name": encodeToBase64(dbUser.name) }
            : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create post");
      }

      // Reset form
      setTitle("");
      setContent("");
      setSubject("");

      toast({
        title: t("posts.postCreatedSuccess"),
        description: t("ai.aiGenerated"),
      });

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error("Error creating AI post:", error);
      toast({
        title: t("posts.errorCreatingPost"),
        description:
          error instanceof Error ? error.message : t("posts.errorCreatingPost"),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <AIContentModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerated={handleAIGenerated}
      />

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {AI_ONLY_MODE ? t("ai.title") : t("posts.shareStudyMaterial")}
          </CardTitle>
          <CardDescription>
            {AI_ONLY_MODE
              ? t("ai.onlyAIModeDescription")
              : t("posts.shareStudyMaterialDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* AI-only mode notification */}
          {AI_ONLY_MODE && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {t("ai.onlyAIModeActive")}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {t("ai.onlyAIModeDescription")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Content Generation Button - Hidden for community posts */}
          {!hideAI && (
            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                className="w-full border-primary/50 hover:border-primary hover:bg-primary/5"
                onClick={() => setShowAIModal(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {t("ai.createWithAI")}
              </Button>
            </div>
          )}

          {/* Normal form - hidden in AI-only mode */}
          {!AI_ONLY_MODE && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title Input */}
              <div>
                <Input
                  placeholder={t("posts.enterTitlePlaceholder")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg"
                  maxLength={100}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {title.length}/{t("posts.titleLength")}
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("posts.selectSubjectPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((subj) => (
                      <SelectItem key={subj} value={subj}>
                        {subj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content Textarea */}
              <div>
                <Textarea
                  placeholder={t("posts.describeStudyMaterialPlaceholder")}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px]"
                  maxLength={2000}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {content.length}/{t("posts.contentLength")}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />

                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  >
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t("posts.clickToUploadImage")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("posts.imageFileTypes")}
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full h-auto max-h-96 object-contain rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {image && (
                        <span>
                          {image.name} ({image.size / 1024 / 1024} MB)
                          {image.size > 3 * 1024 * 1024 && (
                            <Badge variant="secondary" className="ml-2">
                              {t("posts.willBeCompressed")}
                            </Badge>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    {t("posts.cancel")}
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={
                    (externalIsSubmitting ?? isLoading) || !title.trim()
                  }
                >
                  {(externalIsSubmitting ?? isLoading)
                    ? currentMessage || t("posts.creating")
                    : t("posts.sharePost")}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
};
