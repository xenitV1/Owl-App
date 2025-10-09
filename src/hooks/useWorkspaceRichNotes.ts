/**
 * Workspace Rich Notes Management Hook
 * Extracted from useWorkspaceStore.ts for better modularity
 */

import { useCallback } from "react";
import { WorkspaceCard } from "@/types/workspace";

export function useWorkspaceRichNotes(
  cards: WorkspaceCard[],
  updateCard: (
    cardId: string,
    updates: Partial<WorkspaceCard>,
  ) => Promise<void>,
) {
  const saveRichNoteVersion = useCallback(
    async (cardId: string, content: string, author?: string) => {
      const currentCard = cards.find((c) => c.id === cardId);
      await updateCard(cardId, {
        content: content, // Save the JSON content
        richContent: {
          markdown: content,
          html: "", // Will be converted by the component
          versionHistory: [
            ...(currentCard?.richContent?.versionHistory || []),
            {
              timestamp: Date.now(),
              content,
              author,
            },
          ].slice(-10), // Keep last 10 versions
          lastSaved: Date.now(),
        },
      });
    },
    [cards, updateCard],
  );

  return {
    saveRichNoteVersion,
  };
}
