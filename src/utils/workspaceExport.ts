/**
 * Workspace Export/Import Utilities
 * Extracted from useWorkspaceStore.ts for better modularity
 */

import {
  WorkspaceCard,
  WorkspaceData,
  CURRENT_VERSION,
} from "@/types/workspace";
import { saveWorkspaceData } from "./workspaceDatabase";

export function exportWorkspaceData(cards: WorkspaceCard[]): string {
  const data: WorkspaceData = {
    cards,
    version: CURRENT_VERSION,
    lastModified: Date.now(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importWorkspaceData(
  jsonData: string,
  isIndexedDBReady: boolean,
): Promise<{ success: boolean; cards: WorkspaceCard[] }> {
  try {
    const data: WorkspaceData = JSON.parse(jsonData);
    if (data.cards && Array.isArray(data.cards)) {
      await saveWorkspaceData(isIndexedDBReady, data.cards);
      return { success: true, cards: data.cards };
    }
    return { success: false, cards: [] };
  } catch (error) {
    console.error("Failed to import workspace:", error);
    return { success: false, cards: [] };
  }
}

export function getWorkspaceStats(cards: WorkspaceCard[]) {
  const stats = {
    totalCards: cards.length,
    cardTypes: {
      platformContent: cards.filter((c) => c.type === "platformContent").length,
      richNote: cards.filter((c) => c.type === "richNote").length,
      calendar: cards.filter((c) => c.type === "calendar").length,
      pomodoro: cards.filter((c) => c.type === "pomodoro").length,
      taskBoard: cards.filter((c) => c.type === "taskBoard").length,
    },
    averageSize:
      cards.length > 0
        ? {
            width: Math.round(
              cards.reduce((sum, c) => sum + c.size.width, 0) / cards.length,
            ),
            height: Math.round(
              cards.reduce((sum, c) => sum + c.size.height, 0) / cards.length,
            ),
          }
        : { width: 0, height: 0 },
    // Phase 1 specific stats
    totalRichNotes: cards.filter((c) => c.type === "richNote").length,
    totalCalendarEvents: cards
      .filter((c) => c.type === "calendar" && c.calendarData?.events)
      .reduce((sum, c) => sum + (c.calendarData?.events?.length || 0), 0),
    totalPomodoroSessions: cards
      .filter((c) => c.type === "pomodoro" && c.pomodoroData?.statistics)
      .reduce(
        (sum, c) => sum + (c.pomodoroData?.statistics?.totalSessions || 0),
        0,
      ),
    totalTasks: cards
      .filter((c) => c.type === "taskBoard" && c.taskBoardData?.columns)
      .reduce(
        (sum, c) =>
          sum +
          c.taskBoardData!.columns.reduce(
            (colSum, col) => colSum + col.tasks.length,
            0,
          ),
        0,
      ),
  };
  return stats;
}
