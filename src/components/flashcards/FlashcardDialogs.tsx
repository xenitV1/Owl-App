/**
 * Flashcard Dialogs Component
 * Contains Create and Edit dialogs for flashcards with media upload
 */

"use client";

import { FlashcardFormState } from "@/types/flashcard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Image as ImageIcon, Volume2, Video, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface FlashcardDialogsProps {
  // Create dialog
  isCreateOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  createForm: FlashcardFormState;
  onCreateFormChange: <K extends keyof FlashcardFormState>(
    field: K,
    value: FlashcardFormState[K],
  ) => void;
  onCreateSubmit: () => void;
  onCreateMediaSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateMediaRemove: () => void;

  // Edit dialog
  isEditOpen: boolean;
  onEditOpenChange: (open: boolean) => void;
  editForm: FlashcardFormState;
  onEditFormChange: <K extends keyof FlashcardFormState>(
    field: K,
    value: FlashcardFormState[K],
  ) => void;
  onEditSubmit: () => void;
  onEditMediaSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditMediaRemove: () => void;
}

export function FlashcardDialogs({
  isCreateOpen,
  onCreateOpenChange,
  createForm,
  onCreateFormChange,
  onCreateSubmit,
  onCreateMediaSelect,
  onCreateMediaRemove,
  isEditOpen,
  onEditOpenChange,
  editForm,
  onEditFormChange,
  onEditSubmit,
  onEditMediaSelect,
  onEditMediaRemove,
}: FlashcardDialogsProps) {
  const t = useTranslations("flashcards");

  return (
    <>
      {/* Create Card Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={onCreateOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createNewCard")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={createForm.type}
              onValueChange={(value: any) => onCreateFormChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">{t("textCard")}</SelectItem>
                <SelectItem value="image">{t("imageCard")}</SelectItem>
                <SelectItem value="audio">{t("audioCard")}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder={t("frontPlaceholder")}
              value={createForm.front}
              onChange={(e) => onCreateFormChange("front", e.target.value)}
            />

            <Textarea
              placeholder={t("backPlaceholder")}
              value={createForm.back}
              onChange={(e) => onCreateFormChange("back", e.target.value)}
              rows={3}
            />

            <Input
              placeholder={t("categoryPlaceholder")}
              value={createForm.category}
              onChange={(e) => onCreateFormChange("category", e.target.value)}
            />

            <Input
              placeholder={t("tagsPlaceholder")}
              value={createForm.tags}
              onChange={(e) => onCreateFormChange("tags", e.target.value)}
            />

            {/* Media Upload Section */}
            <div className="space-y-2">
              <Label>{t("mediaUpload")}</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                {createForm.mediaFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {createForm.mediaFile.type.startsWith("image/") && (
                          <ImageIcon className="w-4 h-4" aria-hidden="true" />
                        )}
                        {createForm.mediaFile.type.startsWith("audio/") && (
                          <Volume2 className="w-4 h-4" />
                        )}
                        {createForm.mediaFile.type.startsWith("video/") && (
                          <Video className="w-4 h-4" />
                        )}
                        <span className="text-sm">
                          {createForm.mediaFile.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCreateMediaRemove}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {createForm.mediaPreview && (
                      <div className="mt-2">
                        <img
                          src={createForm.mediaPreview}
                          alt="Preview"
                          className="max-w-full max-h-32 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <div className="text-sm text-muted-foreground mb-2">
                      {t("uploadMedia")}
                    </div>
                    <Input
                      type="file"
                      accept="image/*,audio/*,video/*"
                      onChange={onCreateMediaSelect}
                      className="hidden"
                      id="create-media-upload"
                    />
                    <Label
                      htmlFor="create-media-upload"
                      className="cursor-pointer text-primary hover:underline"
                    >
                      {t("chooseFile")}
                    </Label>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("supportedFormats")}: JPG, PNG, GIF, MP3, WAV, MP4 (max
                      10MB)
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={onCreateSubmit} className="flex-1">
                {t("create")}
              </Button>
              <Button
                variant="outline"
                onClick={() => onCreateOpenChange(false)}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog open={isEditOpen} onOpenChange={onEditOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editCard")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={editForm.type}
              onValueChange={(value: any) => onEditFormChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">{t("textCard")}</SelectItem>
                <SelectItem value="image">{t("imageCard")}</SelectItem>
                <SelectItem value="audio">{t("audioCard")}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder={t("frontPlaceholder")}
              value={editForm.front}
              onChange={(e) => onEditFormChange("front", e.target.value)}
            />

            <Textarea
              placeholder={t("backPlaceholder")}
              value={editForm.back}
              onChange={(e) => onEditFormChange("back", e.target.value)}
              rows={3}
            />

            <Input
              placeholder={t("categoryPlaceholder")}
              value={editForm.category}
              onChange={(e) => onEditFormChange("category", e.target.value)}
            />

            <Input
              placeholder={t("tagsPlaceholder")}
              value={editForm.tags}
              onChange={(e) => onEditFormChange("tags", e.target.value)}
            />

            {/* Media Upload Section */}
            <div className="space-y-2">
              <Label>{t("mediaUpload")}</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                {editForm.mediaFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {editForm.mediaFile.type.startsWith("image/") && (
                          <ImageIcon className="w-4 h-4" aria-hidden="true" />
                        )}
                        {editForm.mediaFile.type.startsWith("audio/") && (
                          <Volume2 className="w-4 h-4" />
                        )}
                        {editForm.mediaFile.type.startsWith("video/") && (
                          <Video className="w-4 h-4" />
                        )}
                        <span className="text-sm">
                          {editForm.mediaFile.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEditMediaRemove}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {editForm.mediaPreview && (
                      <div className="mt-2">
                        <img
                          src={editForm.mediaPreview}
                          alt="Preview"
                          className="max-w-full max-h-32 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <div className="text-sm text-muted-foreground mb-2">
                      {t("uploadMedia")}
                    </div>
                    <Input
                      type="file"
                      accept="image/*,audio/*,video/*"
                      onChange={onEditMediaSelect}
                      className="hidden"
                      id="edit-media-upload"
                    />
                    <Label
                      htmlFor="edit-media-upload"
                      className="cursor-pointer text-primary hover:underline"
                    >
                      {t("chooseFile")}
                    </Label>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("supportedFormats")}: JPG, PNG, GIF, MP3, WAV, MP4 (max
                      10MB)
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={onEditSubmit} className="flex-1">
                {t("update")}
              </Button>
              <Button variant="outline" onClick={() => onEditOpenChange(false)}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
