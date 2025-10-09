/**
 * Workspace Tasks Management Hook
 * Extracted from useWorkspaceStore.ts for better modularity
 */

import { useCallback } from "react";
import { WorkspaceCard } from "@/types/workspace";

export function useWorkspaceTasks(
  cards: WorkspaceCard[],
  updateCard: (
    cardId: string,
    updates: Partial<WorkspaceCard>,
  ) => Promise<void>,
) {
  const addTask = useCallback(
    async (
      cardId: string,
      columnId: string,
      task: {
        title: string;
        description?: string;
        priority?: "low" | "medium" | "high" | "urgent";
        dueDate?: Date;
      },
    ) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card?.taskBoardData) return;

      const newTask = {
        id: `task-${Date.now()}`,
        title: task.title,
        description: task.description || "",
        priority: task.priority || "medium",
        dueDate: task.dueDate,
        subtasks: [],
        labels: [],
        created: new Date(),
        updated: new Date(),
      };

      const updatedColumns = card.taskBoardData.columns.map((col) =>
        col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col,
      );

      await updateCard(cardId, {
        taskBoardData: {
          ...card.taskBoardData,
          columns: updatedColumns,
        },
      });
    },
    [cards, updateCard],
  );

  const moveTask = useCallback(
    async (
      cardId: string,
      taskId: string,
      fromColumnId: string,
      toColumnId: string,
    ) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card?.taskBoardData) return;

      const task = card.taskBoardData.columns
        .find((col) => col.id === fromColumnId)
        ?.tasks.find((t) => t.id === taskId);

      if (!task) return;

      const updatedColumns = card.taskBoardData.columns.map((col) => {
        if (col.id === fromColumnId) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
        }
        if (col.id === toColumnId) {
          return {
            ...col,
            tasks: [...col.tasks, { ...task, updated: new Date() }],
          };
        }
        return col;
      });

      await updateCard(cardId, {
        taskBoardData: {
          ...card.taskBoardData,
          columns: updatedColumns,
        },
      });
    },
    [cards, updateCard],
  );

  return {
    addTask,
    moveTask,
  };
}
