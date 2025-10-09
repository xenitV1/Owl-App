/**
 * Workspace Connections Management Hook
 * Extracted from useWorkspaceStore.ts for better modularity
 */

import { useState, useCallback } from "react";
import { Connection, AnchorSide } from "@/types/connection";
import { saveConnection, deleteConnection } from "@/utils/workspaceDatabase";

export function useWorkspaceConnections(
  isIndexedDBReady: boolean,
  playConnectionAddSound: () => void,
  playConnectionRemoveSound: () => void,
) {
  const [connections, setConnections] = useState<Connection[]>([]);

  const addConnection = useCallback(
    async (conn: Connection) => {
      playConnectionAddSound();
      setConnections((prev) => {
        const next = [...prev, conn];
        return next;
      });
      try {
        await saveConnection(isIndexedDBReady, conn);
      } catch (e) {
        console.error("Failed to save connection:", e);
      }
    },
    [isIndexedDBReady, playConnectionAddSound],
  );

  const removeConnection = useCallback(
    async (
      connectionId: string,
      lockedGroups: Record<string, string[]>,
      setLockedGroups: (
        updater: (prev: Record<string, string[]>) => Record<string, string[]>,
      ) => void,
      setLockedGroupOffsets: (
        updater: (
          prev: Record<string, Record<string, { dx: number; dy: number }>>,
        ) => Record<string, Record<string, { dx: number; dy: number }>>,
      ) => void,
    ) => {
      // Play remove sound
      playConnectionRemoveSound();

      // Find the connection being removed
      const removedConn = connections.find((c) => c.id === connectionId);

      setConnections((prev) => prev.filter((c) => c.id !== connectionId));

      // Auto-unlock if connection is removed
      if (removedConn) {
        const affectedCards = [
          removedConn.sourceCardId,
          removedConn.targetCardId,
        ];

        // Check if these cards are in a locked group
        Object.entries(lockedGroups).forEach(([groupId, cardIds]) => {
          const hasAffectedCard = affectedCards.some((id) =>
            cardIds.includes(id),
          );
          if (hasAffectedCard) {
            // Check if cards are still connected after removal
            const remainingConnections = connections.filter(
              (c) => c.id !== connectionId,
            );
            const stillConnected = affectedCards.every((cardId) => {
              return cardIds
                .filter((id) => id !== cardId)
                .some((otherId) => {
                  return remainingConnections.some(
                    (c) =>
                      (c.sourceCardId === cardId &&
                        c.targetCardId === otherId) ||
                      (c.targetCardId === cardId && c.sourceCardId === otherId),
                  );
                });
            });

            // If not connected anymore, unlock the group
            if (!stillConnected) {
              console.log(
                `[Workspace] Auto-unlocking group ${groupId} - connection removed`,
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
          }
        });
      }

      try {
        await deleteConnection(isIndexedDBReady, connectionId);
      } catch (e) {
        console.error("Failed to delete connection:", e);
      }
    },
    [isIndexedDBReady, connections, playConnectionRemoveSound],
  );

  const removeConnectionsAt = useCallback(
    async (
      cardId: string,
      anchor: AnchorSide,
      lockedGroups: Record<string, string[]>,
      setLockedGroups: (
        updater: (prev: Record<string, string[]>) => Record<string, string[]>,
      ) => void,
      setLockedGroupOffsets: (
        updater: (
          prev: Record<string, Record<string, { dx: number; dy: number }>>,
        ) => Record<string, Record<string, { dx: number; dy: number }>>,
      ) => void,
    ) => {
      // Find connections to be removed
      const connectionsToRemove = connections.filter(
        (c) =>
          (c.sourceCardId === cardId && c.sourceAnchor === anchor) ||
          (c.targetCardId === cardId && c.targetAnchor === anchor),
      );

      // Play remove sound if connections exist
      if (connectionsToRemove.length > 0) {
        playConnectionRemoveSound();
      }

      // Update state
      setConnections((prev) =>
        prev.filter(
          (c) =>
            !(
              (c.sourceCardId === cardId && c.sourceAnchor === anchor) ||
              (c.targetCardId === cardId && c.targetAnchor === anchor)
            ),
        ),
      );

      // Auto-unlock affected groups
      if (connectionsToRemove.length > 0) {
        const affectedCardIds = new Set<string>();
        connectionsToRemove.forEach((conn) => {
          affectedCardIds.add(conn.sourceCardId);
          affectedCardIds.add(conn.targetCardId);
        });

        // Check and unlock affected groups
        Object.entries(lockedGroups).forEach(([groupId, cardIds]) => {
          const hasAffectedCard = Array.from(affectedCardIds).some((id) =>
            cardIds.includes(id),
          );
          if (hasAffectedCard) {
            // Check if cards are still connected after removal
            const remainingConnections = connections.filter(
              (c) => !connectionsToRemove.includes(c),
            );

            // Use BFS to check connectivity
            const isGroupStillConnected = () => {
              if (cardIds.length <= 1) return true;

              const visited = new Set<string>();
              const queue = [cardIds[0]];

              while (queue.length > 0) {
                const current = queue.shift()!;
                if (visited.has(current)) continue;
                visited.add(current);

                // Find neighbors in the group that are still connected
                const neighbors = remainingConnections
                  .filter(
                    (c) =>
                      (c.sourceCardId === current &&
                        cardIds.includes(c.targetCardId)) ||
                      (c.targetCardId === current &&
                        cardIds.includes(c.sourceCardId)),
                  )
                  .map((c) =>
                    c.sourceCardId === current
                      ? c.targetCardId
                      : c.sourceCardId,
                  )
                  .filter((id) => !visited.has(id));

                queue.push(...neighbors);
              }

              return visited.size === cardIds.length;
            };

            // If not fully connected anymore, unlock the group
            if (!isGroupStillConnected()) {
              console.log(
                `[Workspace] Auto-unlocking group ${groupId} - connection(s) removed at anchor`,
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
          }
        });
      }

      // Persist
      try {
        // Note: This would need access to workspaceDB.getAll, but we'll handle this in the main provider
        // since we're trying to keep this hook focused on state management
      } catch (e) {
        console.error("Failed to remove connections at anchor:", e);
      }
    },
    [connections, playConnectionRemoveSound],
  );

  const clearConnectionsForCard = useCallback(
    async (cardId: string) => {
      // Find all connections to be removed for this card
      const connectionsToRemove = connections.filter(
        (c) => c.sourceCardId === cardId || c.targetCardId === cardId,
      );

      setConnections((prev) =>
        prev.filter(
          (c) => c.sourceCardId !== cardId && c.targetCardId !== cardId,
        ),
      );

      // Note: Auto-unlock logic would be handled in the main provider
      // since it needs access to lockedGroups state

      try {
        // Note: This would need access to workspaceDB operations
        // but we'll handle this in the main provider for now
      } catch (e) {
        console.error("Failed to clear connections for card:", e);
      }
    },
    [connections],
  );

  // Set connections (for loading from database)
  const setConnectionsData = useCallback((newConnections: Connection[]) => {
    setConnections(newConnections);
  }, []);

  return {
    connections,
    setConnections: setConnectionsData,
    addConnection,
    removeConnection,
    removeConnectionsAt,
    clearConnectionsForCard,
  };
}
