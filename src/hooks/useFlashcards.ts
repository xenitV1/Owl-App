/**
 * Custom Hook for Flashcard Management
 * Handles CRUD operations, statistics, import/export, and AI flashcard generation
 */

import { useState, useEffect, useCallback } from "react";
import {
  Flashcard,
  FlashcardStats,
  FlashcardFormState,
} from "@/types/flashcard";
import { useWorkspaceStore } from "@/hooks/useWorkspaceStore";

interface UseFlashcardsResult {
  flashcards: Flashcard[];
  stats: FlashcardStats;
  isLoading: boolean;
  createCard: (form: FlashcardFormState, cardId?: string) => Promise<void>;
  updateCard: (
    cardToUpdate: Flashcard,
    form: FlashcardFormState,
  ) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  exportCards: () => void;
  importCards: (
    file: File,
    onSuccess: (count: number) => void,
    onError: () => void,
  ) => Promise<void>;
  updateStats: (cards: Flashcard[]) => Promise<void>;
  setFlashcards: (cards: Flashcard[]) => void;
}

export function useFlashcards(workspaceCardId?: string): UseFlashcardsResult {
  const {
    getAllFlashcards,
    saveFlashcard,
    deleteFlashcard,
    getFlashcardStats,
    saveFlashcardStats,
    isIndexedDBReady,
  } = useWorkspaceStore();

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<FlashcardStats>({
    id: "main",
    totalCards: 0,
    cardsDue: 0,
    averageDifficulty: 0,
    studyStreak: 0,
    totalStudyTime: 0,
    accuracy: 0,
    lastUpdated: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load flashcards and stats from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      if (!isIndexedDBReady) return;

      try {
        setIsLoading(true);
        const cards = await getAllFlashcards(workspaceCardId);
        setFlashcards(cards);
        await updateStats(cards);

        const savedStats = await getFlashcardStats();
        if (savedStats) {
          setStats(savedStats);
        }
      } catch (error) {
        console.error("❌ Flashcard verileri yüklenemedi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isIndexedDBReady, workspaceCardId]);

  // Listen for AI-generated flashcard imports
  useEffect(() => {
    const handleImport = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.cardId !== workspaceCardId) return;

      try {
        const importedFlashcards = detail.flashcards || [];

        // Save each flashcard to IndexedDB
        for (const fc of importedFlashcards) {
          const flashcard: Flashcard = {
            id: `flashcard-${Date.now()}-${Math.random()}`,
            cardId: workspaceCardId,
            front: fc.front || "",
            back: fc.back || "",
            type: "text",
            difficulty: fc.difficulty || 3,
            nextReview: new Date(),
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0,
            createdAt: new Date(),
            tags: fc.tags || [],
            category: fc.category || "",
          };

          await saveFlashcard(flashcard);
        }

        // Reload flashcards
        const cards = await getAllFlashcards(workspaceCardId);
        setFlashcards(cards);
        await updateStats(cards);
      } catch (error) {
        console.error("❌ Failed to import AI flashcards:", error);
      }
    };

    window.addEventListener(
      "workspace:importFlashcards",
      handleImport as EventListener,
    );
    return () =>
      window.removeEventListener(
        "workspace:importFlashcards",
        handleImport as EventListener,
      );
  }, [workspaceCardId, saveFlashcard, getAllFlashcards]);

  // Update statistics
  const updateStats = useCallback(
    async (cards: Flashcard[]) => {
      const now = new Date();
      const cardsDue = cards.filter((card) => card.nextReview <= now).length;
      const averageDifficulty =
        cards.length > 0
          ? cards.reduce((sum, card) => sum + card.difficulty, 0) / cards.length
          : 0;

      const newStats: FlashcardStats = {
        id: "main",
        totalCards: cards.length,
        cardsDue,
        averageDifficulty,
        studyStreak: stats.studyStreak,
        totalStudyTime: stats.totalStudyTime,
        accuracy: stats.accuracy,
        lastUpdated: now,
      };

      setStats(newStats);

      if (isIndexedDBReady) {
        await saveFlashcardStats(newStats);
      }
    },
    [
      stats.studyStreak,
      stats.totalStudyTime,
      stats.accuracy,
      isIndexedDBReady,
      saveFlashcardStats,
    ],
  );

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  // Create new flashcard
  const createCard = useCallback(
    async (form: FlashcardFormState, cardId?: string) => {
      if (!form.front.trim() || !form.back.trim()) return;

      let mediaUrl = "";
      if (form.mediaFile) {
        mediaUrl = await fileToBase64(form.mediaFile);
      }

      const card: Flashcard = {
        id: Date.now().toString(),
        cardId: cardId || workspaceCardId,
        front: form.front,
        back: form.back,
        type: form.type,
        mediaUrl: mediaUrl || undefined,
        difficulty: 3,
        nextReview: new Date(),
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        createdAt: new Date(),
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        category: form.category,
      };

      const updatedCards = [...flashcards, card];
      setFlashcards(updatedCards);

      if (isIndexedDBReady) {
        await saveFlashcard(card);
      }

      await updateStats(updatedCards);
    },
    [flashcards, workspaceCardId, isIndexedDBReady, saveFlashcard, updateStats],
  );

  // Update existing flashcard
  const updateCard = useCallback(
    async (cardToUpdate: Flashcard, form: FlashcardFormState) => {
      if (!form.front.trim() || !form.back.trim()) return;

      let mediaUrl = cardToUpdate.mediaUrl || "";
      if (form.mediaFile) {
        mediaUrl = await fileToBase64(form.mediaFile);
      }

      const updatedCard: Flashcard = {
        ...cardToUpdate,
        front: form.front,
        back: form.back,
        type: form.type,
        mediaUrl: mediaUrl || undefined,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        category: form.category,
      };

      const updatedCards = flashcards.map((card) =>
        card.id === cardToUpdate.id ? updatedCard : card,
      );

      setFlashcards(updatedCards);

      if (isIndexedDBReady) {
        await saveFlashcard(updatedCard);
      }

      await updateStats(updatedCards);
    },
    [flashcards, isIndexedDBReady, saveFlashcard, updateStats],
  );

  // Delete flashcard
  const deleteCard = useCallback(
    async (cardId: string) => {
      const updatedCards = flashcards.filter((card) => card.id !== cardId);
      setFlashcards(updatedCards);

      if (isIndexedDBReady) {
        await deleteFlashcard(cardId);
      }

      await updateStats(updatedCards);
    },
    [flashcards, isIndexedDBReady, deleteFlashcard, updateStats],
  );

  // Export flashcards to JSON
  const exportCards = useCallback(() => {
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      flashcards: flashcards.map((card) => ({
        ...card,
        createdAt: card.createdAt.toISOString(),
        lastReviewed: card.lastReviewed?.toISOString(),
        nextReview: card.nextReview.toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flashcards-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [flashcards]);

  // Import flashcards from JSON
  const importCards = useCallback(
    async (
      file: File,
      onSuccess: (count: number) => void,
      onError: () => void,
    ) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string);

          if (!importData.flashcards || !Array.isArray(importData.flashcards)) {
            onError();
            return;
          }

          const importedCards: Flashcard[] = importData.flashcards.map(
            (card: any) => ({
              ...card,
              id: card.id || Date.now().toString() + Math.random(),
              createdAt: new Date(card.createdAt),
              lastReviewed: card.lastReviewed
                ? new Date(card.lastReviewed)
                : undefined,
              nextReview: new Date(card.nextReview),
            }),
          );

          // Merge with existing cards, avoiding duplicates
          const existingIds = new Set(flashcards.map((card) => card.id));
          const newCards = importedCards.filter(
            (card) => !existingIds.has(card.id),
          );

          if (newCards.length === 0) {
            onSuccess(0);
            return;
          }

          const updatedCards = [...flashcards, ...newCards];
          setFlashcards(updatedCards);

          // Save to workspace database
          if (isIndexedDBReady) {
            for (const card of newCards) {
              await saveFlashcard(card);
            }
          }

          await updateStats(updatedCards);
          onSuccess(newCards.length);
        } catch (error) {
          onError();
        }
      };

      reader.readAsText(file);
    },
    [flashcards, isIndexedDBReady, saveFlashcard, updateStats],
  );

  return {
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
  };
}
