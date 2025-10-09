"use client";

import { createContext, useContext, createElement } from "react";
import { useState, useCallback, useEffect } from "react";
import { workspaceDB } from "@/lib/indexedDB";

// Types
import {
  WorkspaceCard,
  WorkspaceStoreValue,
  CURRENT_VERSION,
} from "@/types/workspace";
import { Connection, AnchorSide, LinkingState } from "@/types/connection";

// Utils
import { useWorkspaceAudio } from "@/utils/workspaceAudio";
import {
  initializeWorkspaceDB,
  loadWorkspaceData,
} from "@/utils/workspaceDatabase";
import {
  exportWorkspaceData,
  importWorkspaceData,
  getWorkspaceStats,
} from "@/utils/workspaceExport";

// Feature Hooks
import { useWorkspaceCards } from "./useWorkspaceCards";
import { useWorkspaceConnections } from "./useWorkspaceConnections";
import { useWorkspaceFlashcards } from "./useWorkspaceFlashcards";
import { useWorkspacePomodoro } from "./useWorkspacePomodoro";
import { useWorkspaceTasks } from "./useWorkspaceTasks";
import { useWorkspaceRichNotes } from "./useWorkspaceRichNotes";

export const WorkspaceStoreContext = createContext<WorkspaceStoreValue | null>(
  null,
);

export function WorkspaceStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Core state
  const [isLoading, setIsLoading] = useState(true);
  const [isIndexedDBReady, setIsIndexedDBReady] = useState(false);

  // Linking state
  const [linking, setLinking] = useState<LinkingState>({ isActive: false });

  // Group locking state
  const [lockedGroups, setLockedGroups] = useState<Record<string, string[]>>(
    {},
  );
  const [lockedGroupOffsets, setLockedGroupOffsets] = useState<
    Record<string, Record<string, { dx: number; dy: number }>>
  >({});

  // Audio management
  const { playConnectionAddSound, playConnectionRemoveSound } =
    useWorkspaceAudio();

  // Feature hooks
  const cardsHook = useWorkspaceCards(isIndexedDBReady);
  const connectionsHook = useWorkspaceConnections(
    isIndexedDBReady,
    playConnectionAddSound,
    playConnectionRemoveSound,
  );
  const flashcardsHook = useWorkspaceFlashcards(isIndexedDBReady);
  const pomodoroHook = useWorkspacePomodoro(
    cardsHook.cards,
    cardsHook.updateCard,
  );
  const tasksHook = useWorkspaceTasks(cardsHook.cards, cardsHook.updateCard);
  const richNotesHook = useWorkspaceRichNotes(
    cardsHook.cards,
    cardsHook.updateCard,
  );

  // Initialize IndexedDB
  const initializeDB = useCallback(async () => {
    try {
      const success = await initializeWorkspaceDB();
      setIsIndexedDBReady(success);
    } catch (error) {
      console.error("IndexedDB initialization error:", error);
      setIsIndexedDBReady(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load workspace from IndexedDB
  const loadWorkspace = useCallback(async () => {
    try {
      const { cards, connections } = await loadWorkspaceData(isIndexedDBReady);
      cardsHook.setCards(cards);
      connectionsHook.setConnections(connections);
    } catch (error) {
      console.error("Failed to load workspace:", error);
      cardsHook.setCards([]);
      connectionsHook.setConnections([]);
    }
  }, [isIndexedDBReady, cardsHook, connectionsHook]);

  // Export workspace data
  const exportWorkspace = useCallback(() => {
    return exportWorkspaceData(cardsHook.cards);
  }, [cardsHook.cards]);

  // Import workspace data
  const importWorkspace = useCallback(
    async (jsonData: string) => {
      try {
        const { success, cards } = await importWorkspaceData(
          jsonData,
          isIndexedDBReady,
        );
        if (success) {
          cardsHook.setCards(cards);
        }
        return success;
      } catch (error) {
        console.error("Failed to import workspace:", error);
        return false;
      }
    },
    [isIndexedDBReady, cardsHook],
  );

  // Get workspace statistics
  const getStats = useCallback(() => {
    return getWorkspaceStats(cardsHook.cards);
  }, [cardsHook.cards]);

  // Linking flow
  const startLinking = useCallback(
    (sourceCardId: string, sourceAnchor: AnchorSide) => {
      setLinking({ isActive: true, sourceCardId, sourceAnchor });
    },
    [],
  );

  const updateLinkCursor = useCallback((pos: { x: number; y: number }) => {
    setLinking((prev) => (prev.isActive ? { ...prev, cursor: pos } : prev));
  }, []);

  const cancelLinking = useCallback(() => {
    setLinking({ isActive: false });
  }, []);

  const completeLinking = useCallback(
    async (targetCardId: string, targetAnchor: AnchorSide) => {
      if (!linking.isActive || !linking.sourceCardId || !linking.sourceAnchor)
        return false;
      if (
        linking.sourceCardId === targetCardId &&
        linking.sourceAnchor === targetAnchor
      ) {
        setLinking({ isActive: false });
        return false;
      }
      const newConn: Connection = {
        id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sourceCardId: linking.sourceCardId,
        sourceAnchor: linking.sourceAnchor,
        targetCardId,
        targetAnchor,
        createdAt: Date.now(),
      };
      await connectionsHook.addConnection(newConn);
      setLinking({ isActive: false });
      return true;
    },
    [linking, connectionsHook],
  );

  // Enhanced connection removal with group unlocking
  const removeConnection = useCallback(
    async (connectionId: string) => {
      await connectionsHook.removeConnection(
        connectionId,
        lockedGroups,
        setLockedGroups,
        setLockedGroupOffsets,
      );
    },
    [connectionsHook, lockedGroups],
  );

  const removeConnectionsAt = useCallback(
    async (cardId: string, anchor: AnchorSide) => {
      await connectionsHook.removeConnectionsAt(
        cardId,
        anchor,
        lockedGroups,
        setLockedGroups,
        setLockedGroupOffsets,
      );
    },
    [connectionsHook, lockedGroups],
  );

  const clearConnectionsForCard = useCallback(
    async (cardId: string) => {
      // Clear connections from state
      connectionsHook.setConnections(
        connectionsHook.connections.filter(
          (c) => c.sourceCardId !== cardId && c.targetCardId !== cardId,
        ),
      );

      // Auto-unlock any groups containing this card
      Object.entries(lockedGroups).forEach(([groupId, cardIds]) => {
        if (cardIds.includes(cardId)) {
          console.log(
            `[Workspace] Auto-unlocking group ${groupId} - card removed from workspace`,
          );
          setLockedGroups((prev) => {
            const copy = { ...prev };
            delete copy[groupId];
            return copy;
          });
          setLockedGroupOffsets((prev) => {
            const copy = { ...prev };
            delete copy[groupId];
            return copy;
          });
        }
      });

      // Persist deletion
      try {
        if (isIndexedDBReady) {
          const all = await workspaceDB.getAll<Connection>("connections");
          const toDelete = (all || []).filter(
            (c) => c.sourceCardId === cardId || c.targetCardId === cardId,
          );
          for (const c of toDelete) {
            await workspaceDB.delete("connections", c.id);
          }
        }
      } catch (e) {
        console.error("Failed to clear connections for card:", e);
      }
    },
    [connectionsHook, lockedGroups, isIndexedDBReady],
  );

  // Enhanced card update with group locking support
  const updateCard = useCallback(
    async (cardId: string, updates: Partial<WorkspaceCard>) => {
      await cardsHook.updateCard(
        cardId,
        updates,
        lockedGroups,
        lockedGroupOffsets,
      );
    },
    [cardsHook, lockedGroups, lockedGroupOffsets],
  );

  // Enhanced card deletion with connection cleanup
  const deleteCard = useCallback(
    async (cardId: string) => {
      await cardsHook.deleteCard(cardId);
      await clearConnectionsForCard(cardId);
    },
    [cardsHook, clearConnectionsForCard],
  );

  // Initialize DB and load workspace on mount
  useEffect(() => {
    const initializeOnly = async () => {
      await initializeDB();
    };
    initializeOnly();
  }, [initializeDB]);

  useEffect(() => {
    if (isIndexedDBReady && cardsHook.cards.length === 0) {
      loadWorkspace();
    }
  }, [isIndexedDBReady, cardsHook.cards.length, loadWorkspace]);

  const value: WorkspaceStoreValue = {
    cards: cardsHook.cards,
    isLoading,
    isIndexedDBReady,
    addCard: cardsHook.addCard,
    updateCard,
    deleteCard,
    clearWorkspace: cardsHook.clearWorkspace,
    bringToFront: cardsHook.bringToFront,
    loadWorkspace,
    exportWorkspace,
    importWorkspace,
    getStats,
    saveRichNoteVersion: richNotesHook.saveRichNoteVersion,
    startPomodoro: pomodoroHook.startPomodoro,
    pausePomodoro: pomodoroHook.pausePomodoro,
    resetPomodoro: pomodoroHook.resetPomodoro,
    addTask: tasksHook.addTask,
    moveTask: tasksHook.moveTask,
    getAllFlashcards: flashcardsHook.getAllFlashcards,
    saveFlashcard: flashcardsHook.saveFlashcard,
    deleteFlashcard: flashcardsHook.deleteFlashcard,
    getFlashcardStats: flashcardsHook.getFlashcardStats,
    saveFlashcardStats: flashcardsHook.saveFlashcardStats,
    saveStudySession: flashcardsHook.saveStudySession,
    getStudySessions: flashcardsHook.getStudySessions,
    // connections
    connections: connectionsHook.connections,
    lockedGroups,
    lockedGroupOffsets,
    toggleLockGroup: async (cardIds: string[]) => {
      const existing = Object.entries(lockedGroups).find(
        ([, ids]) =>
          ids.length === cardIds.length &&
          ids.every((id) => cardIds.includes(id)),
      );
      if (existing) {
        const [gid] = existing;
        setLockedGroups((prev) => {
          const copy = { ...prev };
          delete copy[gid];
          return copy;
        });
        setLockedGroupOffsets((prev) => {
          const copy = { ...prev };
          delete copy[gid];
          return copy;
        });
        return gid;
      }
      const gid = `group-${Date.now()}`;

      // Calculate offsets for all cards relative to first card
      const firstCardId = cardIds[0];
      const firstCard = cardsHook.cards.find((c) => c.id === firstCardId);
      if (firstCard) {
        const offsets: Record<string, { dx: number; dy: number }> = {};
        cardIds.forEach((cardId) => {
          const card = cardsHook.cards.find((c) => c.id === cardId);
          if (card) {
            offsets[cardId] = {
              dx: card.position.x - firstCard.position.x,
              dy: card.position.y - firstCard.position.y,
            };
          }
        });

        setLockedGroupOffsets((prev) => ({ ...prev, [gid]: offsets }));
      }

      setLockedGroups((prev) => ({ ...prev, [gid]: [...new Set(cardIds)] }));
      return gid;
    },
    unlinkGroup: async (groupId: string) => {
      setLockedGroups((prev) => {
        const copy = { ...prev };
        delete copy[groupId];
        return copy;
      });
      setLockedGroupOffsets((prev) => {
        const copy = { ...prev };
        delete copy[groupId];
        return copy;
      });
    },
    addConnection: connectionsHook.addConnection,
    removeConnection,
    clearConnectionsForCard,
    removeConnectionsAt,
    // linking
    linking,
    startLinking,
    updateLinkCursor,
    cancelLinking,
    completeLinking,
  };

  return createElement(WorkspaceStoreContext.Provider, { value }, children);
}

export function useWorkspaceStore(): WorkspaceStoreValue {
  const ctx = useContext(WorkspaceStoreContext);
  if (!ctx) {
    throw new Error(
      "useWorkspaceStore must be used within a WorkspaceStoreProvider",
    );
  }
  return ctx;
}
