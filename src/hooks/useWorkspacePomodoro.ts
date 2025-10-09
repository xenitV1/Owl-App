/**
 * Workspace Pomodoro Management Hook
 * Extracted from useWorkspaceStore.ts for better modularity
 */

import { useCallback } from "react";
import { WorkspaceCard } from "@/types/workspace";

export function useWorkspacePomodoro(
  cards: WorkspaceCard[],
  updateCard: (
    cardId: string,
    updates: Partial<WorkspaceCard>,
  ) => Promise<void>,
) {
  const startPomodoro = useCallback(
    async (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card?.pomodoroData) return;

      const workDuration = card.pomodoroData.workDuration * 60; // Convert to seconds
      await updateCard(cardId, {
        pomodoroData: {
          ...card.pomodoroData,
          isRunning: true,
          timeLeft: workDuration,
          lastStartTime: Date.now(),
        },
      });
    },
    [cards, updateCard],
  );

  const pausePomodoro = useCallback(
    async (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card?.pomodoroData) return;

      await updateCard(cardId, {
        pomodoroData: {
          ...card.pomodoroData,
          isRunning: false,
        },
      });
    },
    [cards, updateCard],
  );

  const resetPomodoro = useCallback(
    async (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card?.pomodoroData) return;

      const workDuration = card.pomodoroData.workDuration * 60;
      await updateCard(cardId, {
        pomodoroData: {
          ...card.pomodoroData,
          isRunning: false,
          isBreak: false,
          timeLeft: workDuration,
          currentSession: 1,
        },
      });
    },
    [cards, updateCard],
  );

  return {
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
  };
}
