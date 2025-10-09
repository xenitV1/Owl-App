/**
 * Flashcard System - Main Orchestrator Component
 * Refactored to use modular hooks and components
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogTrigger } from "@/components/ui/dialog";
import { Plus, Play, FileText, Upload } from "lucide-react";

// Types
import { FlashcardSystemProps, Flashcard } from "@/types/flashcard";

// Custom Hooks
import { useFlashcards } from "@/hooks/useFlashcards";
import { useFlashcardMedia } from "@/hooks/useFlashcardMedia";
import { useStudySession } from "@/hooks/useStudySession";

// Components
import { FlashcardStatsDisplay } from "@/components/flashcards/FlashcardStats";
import { FlashcardList } from "@/components/flashcards/FlashcardList";
import {
  FlashcardStudyMode,
  SessionSummary,
} from "@/components/flashcards/FlashcardStudyMode";
import { FlashcardDialogs } from "@/components/flashcards/FlashcardDialogs";

export default function FlashcardSystem({ cardId }: FlashcardSystemProps) {
  const t = useTranslations("flashcards");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  // Custom hooks
  const {
    flashcards,
    stats,
    isLoading,
    createCard,
    updateCard,
    deleteCard,
    exportCards,
    importCards,
    updateStats,
    setFlashcards,
  } = useFlashcards(cardId);

  const createMedia = useFlashcardMedia();
  const editMedia = useFlashcardMedia();

  const {
    studyMode,
    currentCard,
    currentIndex,
    isFlipped,
    session,
    startSession,
    handleResponse,
    flipCard,
    nextCard,
    prevCard,
    canGoPrev,
    canGoNext,
    studyCards,
  } = useStudySession();

  // Event handlers
  const handleCreateCard = async () => {
    await createCard(createMedia.formState, cardId);
    createMedia.resetForm();
    setIsCreateDialogOpen(false);
  };

  const handleEditCard = (card: Flashcard) => {
    setEditingCard(card);
    editMedia.setForm({
      front: card.front,
      back: card.back,
      type: card.type,
      category: card.category,
      tags: card.tags.join(", "),
      mediaFile: null,
      mediaPreview: card.mediaUrl || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCard = async () => {
    if (!editingCard) return;
    await updateCard(editingCard, editMedia.formState);
    editMedia.resetForm();
    setEditingCard(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteCard = async (cardId: string) => {
    await deleteCard(cardId);
  };

  const handleStartStudy = () => {
    startSession(flashcards);
  };

  const handleCardResponse = async (quality: number) => {
    await handleResponse(
      quality,
      async (updatedCard) => {
        // Update flashcard in list
        const updatedCards = studyCards.map((c) =>
          c.id === updatedCard.id ? updatedCard : c,
        );
        setFlashcards(updatedCards);
        await updateStats(updatedCards);
      },
      (finalSession) => {
        // Update overall stats after session
        updateStats(flashcards);
      },
    );
  };

  const handleImportCards = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importCards(
      file,
      (count) => alert(t("importSuccess").replace("{count}", count.toString())),
      () => alert(t("importError")),
    );

    // Reset file input
    event.target.value = "";
  };

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) createMedia.resetForm();
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingCard(null);
      editMedia.resetForm();
    }
  };

  if (isLoading) {
    return <div className="w-full h-full p-6">Loading...</div>;
  }

  return (
    <div className="w-full h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t("createCard")}
          </Button>

          {flashcards.length > 0 && (
            <>
              <Button onClick={handleStartStudy} variant="secondary">
                <Play className="w-4 h-4 mr-2" />
                {t("startStudy")}
              </Button>

              <Button onClick={exportCards} variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                {t("exportCards")}
              </Button>

              <div className="relative">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImportCards}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="import-file"
                />
                <Button variant="outline" asChild>
                  <label htmlFor="import-file" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {t("importCards")}
                  </label>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Statistics */}
      <FlashcardStatsDisplay stats={stats} />

      {/* Study Mode */}
      {studyMode && currentCard && (
        <FlashcardStudyMode
          currentCard={currentCard}
          currentIndex={currentIndex}
          totalCards={studyCards.length}
          isFlipped={isFlipped}
          onFlip={flipCard}
          onResponse={handleCardResponse}
          onPrev={prevCard}
          onNext={nextCard}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
        />
      )}

      {/* Session Summary */}
      {!studyMode && session && <SessionSummary session={session} />}

      {/* Flashcard List */}
      {!studyMode && (
        <FlashcardList
          flashcards={flashcards}
          onEdit={handleEditCard}
          onDelete={handleDeleteCard}
          onCreate={() => setIsCreateDialogOpen(true)}
        />
      )}

      {/* Dialogs */}
      <FlashcardDialogs
        isCreateOpen={isCreateDialogOpen}
        onCreateOpenChange={handleCreateDialogChange}
        createForm={createMedia.formState}
        onCreateFormChange={createMedia.setFormField}
        onCreateSubmit={handleCreateCard}
        onCreateMediaSelect={(e) =>
          createMedia.handleFileSelect(e, (msg) => alert(t(msg)))
        }
        onCreateMediaRemove={createMedia.removeFile}
        isEditOpen={isEditDialogOpen}
        onEditOpenChange={handleEditDialogChange}
        editForm={editMedia.formState}
        onEditFormChange={editMedia.setFormField}
        onEditSubmit={handleUpdateCard}
        onEditMediaSelect={(e) =>
          editMedia.handleFileSelect(e, (msg) => alert(t(msg)))
        }
        onEditMediaRemove={editMedia.removeFile}
      />
    </div>
  );
}
