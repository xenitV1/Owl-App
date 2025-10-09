"use client";

import { useState, useRef, useCallback, useEffect, memo } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RichNoteEditor } from "./RichNoteEditor";
import { PomodoroTimer } from "./PomodoroTimer";
import { TaskBoard } from "./TaskBoard";
import { CalendarView } from "./CalendarView";
import FlashcardSystem from "./FlashcardSystem";
import { PlatformContentCard } from "./PlatformContentCard";
import { useDragDrop } from "@/hooks/useDragDrop";
import { RssFeedCard } from "./RssFeedCard";
import { OwlSearchCard } from "./OwlSearchCard";
import { SpotifyCard } from "./SpotifyCard";
import { useWorkspaceStore } from "@/hooks/useWorkspaceStore";
import { useWorkspaceCardLock } from "@/hooks/useWorkspaceCardLock";
import { WorkspaceCardHeader } from "./WorkspaceCardHeader";
import { WorkspaceCardAnchors } from "./WorkspaceCardAnchors";
import type {
  WorkspaceCardType,
  WorkspaceCardProps,
} from "@/types/workspace-card.types";

export const WorkspaceCard = memo(function WorkspaceCard({
  card,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  gridSnap,
  onHover,
  pan,
  zoom,
}: WorkspaceCardProps) {
  const t = useTranslations("workEnvironment");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const {
    startLinking,
    completeLinking,
    linking,
    connections,
    removeConnectionsAt,
    toggleLockGroup,
    lockedGroups,
    lockedGroupOffsets,
  } = useWorkspaceStore();
  const { playSyncedLockFeedback } = useWorkspaceCardLock();
  const [groupDragDelta, setGroupDragDelta] = useState({ x: 0, y: 0 });

  // Handle real-time drag for locked groups
  const handleDragMove = useCallback(
    (delta: { x: number; y: number }) => {
      // Check if this card is in a locked group
      const groupId = Object.keys(lockedGroups).find((gid) =>
        lockedGroups[gid].includes(card.id),
      );
      if (groupId) {
        // Get all cards in the group
        const groupCardIds = lockedGroups[groupId];

        // Dispatch custom event with delta for all group cards
        window.dispatchEvent(
          new CustomEvent("workspace:dragUpdate", {
            detail: {
              cardId: card.id,
              delta,
              groupId,
              groupCardIds, // All cards in the group
            },
          }),
        );
      }
    },
    [card.id, lockedGroups],
  );

  // Use optimized drag & drop hook
  const { isDragging, style, handleDragStart } = useDragDrop({
    id: card.id,
    position: card.position,
    onUpdate,
    onDragMove: handleDragMove,
    gridSnap,
    gridSize: 20,
    disabled: isFullscreen,
    pan,
    zoom,
  });

  // Reset group drag delta when not dragging and update final positions
  useEffect(() => {
    if (!isDragging) {
      // Clear visual delta
      setGroupDragDelta({ x: 0, y: 0 });

      // Notify connections that drag ended
      window.dispatchEvent(new CustomEvent("workspace:dragEnd"));
    }
  }, [isDragging]);

  // Listen for drag updates from other cards in the same group
  useEffect(() => {
    const handleDragUpdate = (e: CustomEvent) => {
      const { cardId, delta, groupId } = e.detail;

      // If another card in my group is being dragged, apply the same delta
      if (
        cardId !== card.id &&
        groupId &&
        lockedGroups[groupId]?.includes(card.id)
      ) {
        setGroupDragDelta(delta);
      }
    };

    const handleDragEnd = () => {
      // Clear group drag delta when any drag ends
      setGroupDragDelta({ x: 0, y: 0 });
    };

    window.addEventListener(
      "workspace:dragUpdate",
      handleDragUpdate as EventListener,
    );
    window.addEventListener("workspace:dragEnd", handleDragEnd);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchend", handleDragEnd);

    return () => {
      window.removeEventListener(
        "workspace:dragUpdate",
        handleDragUpdate as EventListener,
      );
      window.removeEventListener("workspace:dragEnd", handleDragEnd);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [card.id, lockedGroups]);

  // Clear group drag delta when card position changes (after drag is committed)
  const prevPositionRef = useRef(card.position);
  useEffect(() => {
    // Check if position actually changed
    if (
      prevPositionRef.current.x !== card.position.x ||
      prevPositionRef.current.y !== card.position.y
    ) {
      prevPositionRef.current = card.position;
      // Position has been updated by store, clear the visual delta
      setGroupDragDelta({ x: 0, y: 0 });
    }
  }, [card.position]);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      // Only select if clicking on the card itself, not on buttons or content
      if (e.target === e.currentTarget) {
        onSelect();
      }
    },
    [onSelect],
  );

  const handleMouseEnter = useCallback(() => {
    onHover?.(true);
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover?.(false);
  }, [onHover]);

  const handleResize = useCallback(
    (direction: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      onSelect();

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = card.size.width;
      const startHeight = card.size.height;
      const startPosX = card.position.x;
      const startPosY = card.position.y;

      const snapToGrid = (value: number) => {
        if (!gridSnap) return value;
        const gridSize = 20;
        return Math.round(value / gridSize) * gridSize;
      };

      const handleResizeMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startPosX;
        let newY = startPosY;

        if (direction.includes("right")) {
          newWidth = Math.max(200, startWidth + deltaX);
        }
        if (direction.includes("left")) {
          newWidth = Math.max(200, startWidth - deltaX);
          newX = startPosX + (startWidth - newWidth);
        }
        if (direction.includes("bottom")) {
          newHeight = Math.max(150, startHeight + deltaY);
        }
        if (direction.includes("top")) {
          newHeight = Math.max(150, startHeight - deltaY);
          newY = startPosY + (startHeight - newHeight);
        }

        onUpdate({
          size: {
            width: snapToGrid(newWidth),
            height: snapToGrid(newHeight),
          },
          position: {
            x: snapToGrid(newX),
            y: snapToGrid(newY),
          },
        });
      };

      const handleResizeEnd = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
      };

      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
    },
    [card.size, card.position, onUpdate, onSelect, gridSnap],
  );

  const renderCardContent = useCallback(() => {
    switch (card.type) {
      case "platformContent":
        return (
          <PlatformContentCard
            cardId={card.id}
            cardData={card}
            config={card.platformContentConfig}
          />
        );

      case "richNote":
        return (
          <RichNoteEditor
            cardId={card.id}
            initialContent={card.richContent?.markdown || ""}
          />
        );

      case "calendar":
        return <CalendarView cardId={card.id} />;

      case "pomodoro":
        return <PomodoroTimer cardId={card.id} />;

      case "taskBoard":
        return <TaskBoard cardId={card.id} />;

      case "flashcards":
        return <FlashcardSystem cardId={card.id} />;

      case "rssFeed":
        return (
          <RssFeedCard cardId={card.id} cardData={card} onUpdate={onUpdate} />
        );

      case "owlSearch":
        return (
          <OwlSearchCard cardId={card.id} initialQuery={card.content || ""} />
        );

      case "spotify":
        return <SpotifyCard cardId={card.id} cardData={card} />;

      default:
        return null;
    }
  }, [
    card.type,
    card.id,
    card.content,
    card.richContent?.markdown,
    card.platformContentConfig,
  ]);

  return (
    <Card
      ref={cardRef}
      data-workspace-card="true"
      data-card-id={card.id}
      data-dragging={isDragging ? "true" : undefined}
      className={cn(
        "absolute bg-background border-2 transition-all duration-200 overflow-hidden",
        isSelected ? "border-primary shadow-lg" : "border-border",
        isDragging ? "cursor-grabbing shadow-2xl scale-105" : "cursor-auto",
        isFullscreen && "fixed inset-4 z-50",
        isResizing && "cursor-resize",
        "hover:shadow-md hover:border-primary/50",
      )}
      style={{
        left: isFullscreen ? undefined : card.position.x,
        top: isFullscreen ? undefined : card.position.y,
        width: isFullscreen ? undefined : card.size.width,
        height: isFullscreen ? undefined : card.size.height,
        zIndex: isFullscreen ? 9999 : card.zIndex,
        ...style,
        // Apply group drag delta ONLY if this card is NOT being dragged (other cards in group)
        transform:
          !isDragging && (groupDragDelta.x !== 0 || groupDragDelta.y !== 0)
            ? `translate3d(${groupDragDelta.x}px, ${groupDragDelta.y}px, 0)`
            : style.transform,
      }}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Card Header */}
      <WorkspaceCardHeader
        title={card.title}
        isFullscreen={isFullscreen}
        isLocked={Object.values(lockedGroups).some((ids) =>
          ids.includes(card.id),
        )}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onLock={() => {
          // Find ALL connected cards using graph traversal (BFS)
          const getAllConnectedCards = (startCardId: string): string[] => {
            const visited = new Set<string>();
            const queue = [startCardId];

            while (queue.length > 0) {
              const currentId = queue.shift()!;
              if (visited.has(currentId)) continue;

              visited.add(currentId);

              // Find all neighbors
              const neighbors = connections
                .filter(
                  (c) =>
                    c.sourceCardId === currentId ||
                    c.targetCardId === currentId,
                )
                .map((c) =>
                  c.sourceCardId === currentId
                    ? c.targetCardId
                    : c.sourceCardId,
                )
                .filter((id) => !visited.has(id));

              queue.push(...neighbors);
            }

            return Array.from(visited);
          };

          const connectedCards = getAllConnectedCards(card.id);

          if (connectedCards.length > 1) {
            // Determine current state (locked or not)
            const isLocked = Object.values(lockedGroups).some(
              (ids) =>
                ids.length === connectedCards.length &&
                connectedCards.every((id) => ids.includes(id)),
            );

            // Toggle lock state for all connected cards
            toggleLockGroup(connectedCards);

            // Synchronized audio-visual feedback
            const el = cardRef.current;
            if (el) {
              playSyncedLockFeedback(isLocked, el);
            }

            console.log(
              `[Workspace] ${isLocked ? "Unlocked" : "Locked"} ${connectedCards.length} connected cards`,
            );
          } else {
            console.log("[Workspace] No connections to lock");
          }
        }}
        onDelete={onDelete}
        onDragStart={handleDragStart}
      />

      {/* Anchors */}
      <WorkspaceCardAnchors
        cardId={card.id}
        connections={connections as any}
        linking={linking as any}
        onStartLinking={startLinking}
        onCompleteLinking={completeLinking}
        onRemoveConnections={removeConnectionsAt}
      />

      {/* Card Body */}
      <div className="w-full h-full">{renderCardContent()}</div>

      {/* Resize Handles */}
      {isSelected && !isFullscreen && (
        <>
          {/* Corner handles */}
          <div
            className="absolute -top-1 -left-1 w-3 h-3 bg-primary border border-background cursor-nw-resize hover:bg-primary/80 transition-colors"
            onMouseDown={(e) => handleResize("top-left", e)}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-primary border border-background cursor-ne-resize hover:bg-primary/80 transition-colors"
            onMouseDown={(e) => handleResize("top-right", e)}
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary border border-background cursor-sw-resize hover:bg-primary/80 transition-colors"
            onMouseDown={(e) => handleResize("bottom-left", e)}
          />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border border-background cursor-se-resize hover:bg-primary/80 transition-colors"
            onMouseDown={(e) => handleResize("bottom-right", e)}
          />

          {/* Edge handles removed per request */}
        </>
      )}
    </Card>
  );
});
