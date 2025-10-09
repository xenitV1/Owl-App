/**
 * Connection System Type Definitions
 * Extracted from useWorkspaceStore.ts for better modularity
 */

// Connection types for linking cards
export type AnchorSide = "top" | "right" | "bottom" | "left";

export interface Connection {
  id: string;
  sourceCardId: string;
  sourceAnchor: AnchorSide;
  targetCardId: string;
  targetAnchor: AnchorSide;
  createdAt: number;
}

export interface LinkingState {
  isActive: boolean;
  sourceCardId?: string;
  sourceAnchor?: AnchorSide;
  cursor?: { x: number; y: number };
}
