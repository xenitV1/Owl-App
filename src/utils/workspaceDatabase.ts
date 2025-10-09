/**
 * Workspace Database Management Utilities
 * Extracted from useWorkspaceStore.ts for better modularity
 */

import { workspaceDB, isIndexedDBSupported } from "@/lib/indexedDB";
import {
  WorkspaceCard,
  WorkspaceData,
  CURRENT_VERSION,
} from "@/types/workspace";
import { Connection } from "@/types/connection";

export async function initializeWorkspaceDB(): Promise<boolean> {
  try {
    if (!isIndexedDBSupported()) {
      return false;
    }
    await workspaceDB.init();
    return true;
  } catch (error) {
    console.error("IndexedDB initialization error:", error);
    return false;
  }
}

export async function loadWorkspaceData(isIndexedDBReady: boolean): Promise<{
  cards: WorkspaceCard[];
  connections: Connection[];
}> {
  try {
    if (!isIndexedDBReady) {
      return { cards: [], connections: [] };
    }

    const cardsData = await workspaceDB.getAll<WorkspaceCard>("cards");
    const conns = await workspaceDB.getAll<Connection>("connections");

    return {
      cards: cardsData || [],
      connections: conns || [],
    };
  } catch (error) {
    console.error("Failed to load workspace:", error);
    return { cards: [], connections: [] };
  }
}

export async function saveWorkspaceData(
  isIndexedDBReady: boolean,
  cards: WorkspaceCard[],
): Promise<void> {
  try {
    if (!isIndexedDBReady) {
      return;
    }

    // Save workspace metadata (silent)
    await workspaceDB.put(
      "workspace",
      {
        id: "main",
        version: CURRENT_VERSION,
        lastModified: Date.now(),
        cardCount: cards.length,
      },
      true,
    );

    // Save each card individually (silent)
    for (const card of cards) {
      await workspaceDB.put("cards", card, true);
    }
  } catch (error) {
    console.error("Failed to save workspace:", error);
  }
}

export async function saveConnection(
  isIndexedDBReady: boolean,
  connection: Connection,
): Promise<void> {
  try {
    if (!isIndexedDBReady) return;
    await workspaceDB.put("connections", connection, true);
  } catch (error) {
    console.error("Failed to save connection:", error);
  }
}

export async function deleteConnection(
  isIndexedDBReady: boolean,
  connectionId: string,
): Promise<void> {
  try {
    if (!isIndexedDBReady) return;
    await workspaceDB.delete("connections", connectionId);
  } catch (error) {
    console.error("Failed to delete connection:", error);
  }
}

export async function deleteCard(
  isIndexedDBReady: boolean,
  cardId: string,
): Promise<void> {
  try {
    if (!isIndexedDBReady) return;
    await workspaceDB.delete("cards", cardId);
  } catch (error) {
    console.error("Failed to delete card:", error);
  }
}

export async function clearWorkspaceData(
  isIndexedDBReady: boolean,
): Promise<void> {
  try {
    if (!isIndexedDBReady) return;
    await workspaceDB.clear("cards");
    await workspaceDB.clear("workspace");
  } catch (error) {
    console.error("Failed to clear workspace:", error);
  }
}
