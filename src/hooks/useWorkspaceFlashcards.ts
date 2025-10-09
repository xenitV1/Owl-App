/**
 * Workspace Flashcards Management Hook
 * Extracted from useWorkspaceStore.ts for better modularity
 */

import { useCallback } from "react";
import { workspaceDB } from "@/lib/indexedDB";
import { Flashcard, StudySession, FlashcardStats } from "@/types/flashcard";

export function useWorkspaceFlashcards(isIndexedDBReady: boolean) {
  const getAllFlashcards = useCallback(
    async (cardId?: string): Promise<Flashcard[]> => {
      try {
        if (!isIndexedDBReady) {
          return [];
        }
        const flashcards = await workspaceDB.getAll<Flashcard>("flashcards");

        // Filter by cardId if provided
        const filteredFlashcards = cardId
          ? flashcards.filter((card) => card.cardId === cardId)
          : flashcards;

        return filteredFlashcards.map((card) => ({
          ...card,
          nextReview: new Date(card.nextReview),
          createdAt: new Date(card.createdAt),
          lastReviewed: card.lastReviewed
            ? new Date(card.lastReviewed)
            : undefined,
        }));
      } catch (error) {
        console.error("Failed to load flashcards:", error);
        return [];
      }
    },
    [isIndexedDBReady],
  );

  const saveFlashcard = useCallback(
    async (flashcard: Flashcard) => {
      try {
        if (!isIndexedDBReady) return;
        await workspaceDB.put("flashcards", flashcard, true);
      } catch (error) {
        console.error("Failed to save flashcard:", error);
      }
    },
    [isIndexedDBReady],
  );

  const deleteFlashcard = useCallback(
    async (flashcardId: string) => {
      try {
        if (!isIndexedDBReady) return;
        await workspaceDB.delete("flashcards", flashcardId);
      } catch (error) {
        console.error("Failed to delete flashcard:", error);
      }
    },
    [isIndexedDBReady],
  );

  const getFlashcardStats =
    useCallback(async (): Promise<FlashcardStats | null> => {
      try {
        if (!isIndexedDBReady) return null;
        const stats = await workspaceDB.get<FlashcardStats>(
          "flashcardStats",
          "main",
        );
        return stats || null;
      } catch (error) {
        console.error("Failed to load flashcard stats:", error);
        return null;
      }
    }, [isIndexedDBReady]);

  const saveFlashcardStats = useCallback(
    async (stats: FlashcardStats) => {
      try {
        if (!isIndexedDBReady) return;
        await workspaceDB.put("flashcardStats", stats, true);
      } catch (error) {
        console.error("Failed to save flashcard stats:", error);
      }
    },
    [isIndexedDBReady],
  );

  const saveStudySession = useCallback(
    async (session: StudySession) => {
      try {
        if (!isIndexedDBReady) return;
        await workspaceDB.put("studySessions", session, true);
      } catch (error) {
        console.error("Failed to save study session:", error);
      }
    },
    [isIndexedDBReady],
  );

  const getStudySessions = useCallback(async (): Promise<StudySession[]> => {
    try {
      if (!isIndexedDBReady) return [];
      const sessions = await workspaceDB.getAll<StudySession>("studySessions");
      return sessions.map((session) => ({
        ...session,
        startTime: new Date(session.startTime),
        sessionDate: new Date(session.sessionDate),
      }));
    } catch (error) {
      console.error("Failed to load study sessions:", error);
      return [];
    }
  }, [isIndexedDBReady]);

  return {
    getAllFlashcards,
    saveFlashcard,
    deleteFlashcard,
    getFlashcardStats,
    saveFlashcardStats,
    saveStudySession,
    getStudySessions,
  };
}
