/**
 * Workspace Cards Management Hook
 * Extracted from useWorkspaceStore.ts for better modularity
 */

import { useState, useCallback, useRef } from "react";
import { WorkspaceCard } from "@/types/workspace";
import {
  saveWorkspaceData,
  deleteCard,
  clearWorkspaceData,
} from "@/utils/workspaceDatabase";
// Note: clearConnectionsForCard will be handled in the main provider
// to avoid circular dependency issues

export function useWorkspaceCards(isIndexedDBReady: boolean) {
  const [cards, setCards] = useState<WorkspaceCard[]>([]);
  const debouncedSaveRef = useRef<number | null>(null);
  const lastDraggedCardRef = useRef<string | null>(null);

  // Debounced save to avoid writing intermediate states
  const scheduleSaveWorkspace = useCallback(
    (newCards: WorkspaceCard[], delayMs: number = 1000) => {
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
      }
      debouncedSaveRef.current = window.setTimeout(() => {
        debouncedSaveRef.current = null;
        saveWorkspaceData(isIndexedDBReady, newCards);
      }, delayMs);
    },
    [isIndexedDBReady],
  );

  // Add a new card
  const addCard = useCallback(
    async (card: WorkspaceCard) => {
      setCards((prev) => {
        const newCards = [...prev, card];
        // Add is meaningful: persist immediately
        saveWorkspaceData(isIndexedDBReady, newCards);
        return newCards;
      });
    },
    [isIndexedDBReady],
  );

  // Update an existing card
  const updateCard = useCallback(
    async (
      cardId: string,
      updates: Partial<WorkspaceCard>,
      lockedGroups?: Record<string, string[]>,
      lockedGroupOffsets?: Record<
        string,
        Record<string, { dx: number; dy: number }>
      >,
    ) => {
      setCards((prev) => {
        const newCards = prev.map((card) =>
          card.id === cardId ? { ...card, ...updates } : card,
        );

        // If card is in a locked group and position changed, move siblings with rigid body physics
        const moved = newCards.find((c) => c.id === cardId);
        const prevCard = prev.find((c) => c.id === cardId);

        if (
          moved &&
          prevCard &&
          lockedGroups &&
          lockedGroupOffsets &&
          (moved.position.x !== prevCard.position.x ||
            moved.position.y !== prevCard.position.y)
        ) {
          const groupId = Object.keys(lockedGroups).find((gid) =>
            lockedGroups[gid].includes(cardId),
          );

          // Only update if this card initiated the drag (prevent cascade updates)
          if (
            groupId &&
            lockedGroupOffsets[groupId] &&
            lastDraggedCardRef.current !== cardId
          ) {
            lastDraggedCardRef.current = cardId;

            const baseCardOffset = lockedGroupOffsets[groupId][cardId];
            if (baseCardOffset) {
              // Calculate the new base position (first card's position)
              const baseX = moved.position.x - baseCardOffset.dx;
              const baseY = moved.position.y - baseCardOffset.dy;

              // Update all cards in group instantly to maintain offsets
              const groupCardIds = lockedGroups[groupId].filter(
                (id) => id !== cardId,
              );
              newCards.forEach((card, index) => {
                if (groupCardIds.includes(card.id)) {
                  const offset = lockedGroupOffsets[groupId][card.id];
                  if (offset) {
                    newCards[index] = {
                      ...card,
                      position: {
                        x: baseX + offset.dx,
                        y: baseY + offset.dy,
                      },
                    };
                  }
                }
              });
            }

            // Reset after a short delay
            setTimeout(() => {
              lastDraggedCardRef.current = null;
            }, 100);
          }
        }

        // Debounce frequent updates (dragging, resizing, typing)
        scheduleSaveWorkspace(newCards, 1000);
        return newCards;
      });
    },
    [scheduleSaveWorkspace],
  );

  // Delete a card
  const deleteCardById = useCallback(
    async (cardId: string) => {
      // Remove from state and persist immediately to avoid resurrection via debounced save
      setCards((prev) => {
        const newCards = prev.filter((card) => card.id !== cardId);
        // Cancel any pending debounced save that may re-write old state
        if (debouncedSaveRef.current) {
          clearTimeout(debouncedSaveRef.current);
          debouncedSaveRef.current = null;
        }
        // Persist the new state right away
        saveWorkspaceData(isIndexedDBReady, newCards);
        return newCards;
      });

      // Delete from IndexedDB store for cards
      try {
        await deleteCard(isIndexedDBReady, cardId);
        // Note: Connection cleanup will be handled in the main provider
      } catch (error) {
        console.error("Failed to delete card:", error);
      }
    },
    [isIndexedDBReady],
  );

  // Clear all cards
  const clearWorkspace = useCallback(async () => {
    setCards([]);
    try {
      await clearWorkspaceData(isIndexedDBReady);
    } catch (error) {
      console.error("Failed to clear workspace:", error);
    }
  }, [isIndexedDBReady]);

  // Move card to front (increase z-index)
  const bringToFront = useCallback(
    async (cardId: string) => {
      setCards((prev) => {
        const maxZ = Math.max(...prev.map((c) => c.zIndex), 0);
        const newCards = prev.map((card) =>
          card.id === cardId ? { ...card, zIndex: maxZ + 1 } : card,
        );
        scheduleSaveWorkspace(newCards, 500);
        return newCards;
      });
    },
    [scheduleSaveWorkspace],
  );

  // Set cards (for loading from database)
  const setCardsData = useCallback((newCards: WorkspaceCard[]) => {
    setCards(newCards);
  }, []);

  return {
    cards,
    setCards: setCardsData,
    addCard,
    updateCard,
    deleteCard: deleteCardById,
    clearWorkspace,
    bringToFront,
    scheduleSaveWorkspace,
    debouncedSaveRef,
  };
}
