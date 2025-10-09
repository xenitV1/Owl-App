"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Minimize2, Move, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceCardHeaderProps {
  title: string;
  isFullscreen: boolean;
  isLocked: boolean;
  onToggleFullscreen: () => void;
  onLock: () => void;
  onDelete: () => void;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
}

export function WorkspaceCardHeader({
  title,
  isFullscreen,
  isLocked,
  onToggleFullscreen,
  onLock,
  onDelete,
  onDragStart,
}: WorkspaceCardHeaderProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted/30 border-b">
      <div
        className="drag-handle flex items-center gap-2 flex-1 min-w-0 cursor-move select-none"
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
      >
        <Move className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium truncate">{title}</span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFullscreen();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="h-6 w-6 p-0"
        >
          {isFullscreen ? (
            <Minimize2 className="w-3 h-3" />
          ) : (
            <Maximize2 className="w-3 h-3" />
          )}
        </Button>

        {/* Lock with connections: lock all connected cards together */}
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onLock();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="h-6 w-6 p-0"
          title={`${isLocked ? "🔓 Unlock" : "🔒 Lock"} - Green glow for lock, Orange glow for unlock`}
        >
          <Lock
            className={cn(
              "w-3 h-3 transition-colors",
              isLocked && "text-green-600 dark:text-green-400",
            )}
          />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="h-6 w-6 p-0 text-destructive hover:bg-destructive/20"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
