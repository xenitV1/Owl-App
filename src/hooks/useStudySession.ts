/**
 * Custom Hook for Study Session Management
 * Handles study mode, card progression, and session statistics
 */

import { useState, useCallback } from "react";
import { Flashcard, StudySession, FlashcardStats } from "@/types/flashcard";
import { calculateNextReview } from "@/utils/spacedRepetition";
import { useWorkspaceStore } from "@/hooks/useWorkspaceStore";

interface UseStudySessionResult {
  studyMode: boolean;
  currentCard: Flashcard | null;
  currentIndex: number;
  isFlipped: boolean;
  session: StudySession | null;
  startSession: (cards: Flashcard[]) => void;
  endSession: () => void;
  handleResponse: (
    quality: number,
    onUpdate: (card: Flashcard) => Promise<void>,
    onStatsUpdate: (session: StudySession) => void,
  ) => Promise<void>;
  flipCard: () => void;
  nextCard: () => void;
  prevCard: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  studyCards: Flashcard[];
}

export function useStudySession(): UseStudySessionResult {
  const { saveStudySession, isIndexedDBReady } = useWorkspaceStore();

  const [studyMode, setStudyMode] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [session, setSession] = useState<StudySession | null>(null);

  const currentCard = studyCards[currentIndex] || null;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < studyCards.length - 1;

  // Start a new study session
  const startSession = useCallback((allCards: Flashcard[]) => {
    // Filter cards that are due for review
    const dueCards = allCards.filter((card) => card.nextReview <= new Date());
    if (dueCards.length === 0) return;

    // Sort by priority (overdue first, then by interval)
    const sortedCards = dueCards.sort((a, b) => {
      const aOverdue =
        (new Date().getTime() - a.nextReview.getTime()) / (24 * 60 * 60 * 1000);
      const bOverdue =
        (new Date().getTime() - b.nextReview.getTime()) / (24 * 60 * 60 * 1000);
      return bOverdue - aOverdue;
    });

    // Initialize study session
    const newSession: StudySession = {
      id: Date.now().toString(),
      startTime: new Date(),
      cardsStudied: 0,
      correctAnswers: 0,
      averageResponseTime: 0,
      sessionDuration: 0,
      sessionDate: new Date(),
    };

    setSession(newSession);
    setStudyCards(sortedCards);
    setCurrentIndex(0);
    setStudyMode(true);
    setIsFlipped(false);
  }, []);

  // End the current study session
  const endSession = useCallback(() => {
    setStudyMode(false);
    setStudyCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    // Keep session for displaying summary
  }, []);

  // Flip the current card
  const flipCard = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Go to next card
  const nextCard = useCallback(() => {
    if (canGoNext) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [canGoNext]);

  // Go to previous card
  const prevCard = useCallback(() => {
    if (canGoPrev) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [canGoPrev]);

  // Handle card response (quality rating)
  const handleResponse = useCallback(
    async (
      quality: number,
      onUpdate: (card: Flashcard) => Promise<void>,
      onStatsUpdate: (session: StudySession) => void,
    ) => {
      if (!currentCard || !session) return;

      // Calculate next review using SM-2 algorithm
      const updatedCard = calculateNextReview(currentCard, quality);
      await onUpdate(updatedCard);

      // Update session statistics
      const isCorrect = quality >= 3; // Good or Easy responses count as correct
      const updatedSession: StudySession = {
        ...session,
        cardsStudied: session.cardsStudied + 1,
        correctAnswers: session.correctAnswers + (isCorrect ? 1 : 0),
        sessionDuration:
          (new Date().getTime() - session.startTime.getTime()) / 1000,
      };
      setSession(updatedSession);

      // Move to next card or end session
      if (currentIndex < studyCards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        // End of session
        const finalSession: StudySession = {
          ...updatedSession,
          cardsStudied: updatedSession.cardsStudied,
          correctAnswers: updatedSession.correctAnswers,
        };

        // Save session to database
        if (isIndexedDBReady) {
          await saveStudySession(finalSession);
        }

        // Update overall stats
        onStatsUpdate(finalSession);

        // End session
        setStudyMode(false);
        setIsFlipped(false);
      }
    },
    [
      currentCard,
      currentIndex,
      studyCards,
      session,
      isIndexedDBReady,
      saveStudySession,
    ],
  );

  return {
    studyMode,
    currentCard,
    currentIndex,
    isFlipped,
    session,
    startSession,
    endSession,
    handleResponse,
    flipCard,
    nextCard,
    prevCard,
    canGoPrev,
    canGoNext,
    studyCards,
  };
}
