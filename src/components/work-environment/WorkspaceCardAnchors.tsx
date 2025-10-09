"use client";

import React from "react";

interface Connection {
  id: string;
  sourceCardId: string;
  targetCardId: string;
  sourceAnchor: "top" | "right" | "bottom" | "left";
  targetAnchor: "top" | "right" | "bottom" | "left";
}

interface LinkingState {
  isActive: boolean;
  sourceCardId?: string;
  sourceAnchor?: "top" | "right" | "bottom" | "left";
}

interface WorkspaceCardAnchorsProps {
  cardId: string;
  connections: Connection[];
  linking: LinkingState;
  onStartLinking: (
    cardId: string,
    anchor: "top" | "right" | "bottom" | "left",
  ) => void;
  onCompleteLinking: (
    cardId: string,
    anchor: "top" | "right" | "bottom" | "left",
  ) => Promise<boolean>;
  onRemoveConnections: (
    cardId: string,
    anchor: "top" | "right" | "bottom" | "left",
  ) => void;
}

export function WorkspaceCardAnchors({
  cardId,
  connections,
  linking,
  onStartLinking,
  onCompleteLinking,
  onRemoveConnections,
}: WorkspaceCardAnchorsProps) {
  const sides: Array<{
    side: "top" | "right" | "bottom" | "left";
    style: React.CSSProperties;
  }> = [
    {
      side: "top",
      style: { left: "50%", top: -15, transform: "translate(-50%, 0)" },
    },
    {
      side: "right",
      style: { right: 0, top: "50%", transform: "translate(50%, -50%)" },
    },
    {
      side: "bottom",
      style: { left: "50%", bottom: -15, transform: "translate(-50%, 0)" },
    },
    {
      side: "left",
      style: { left: 0, top: "50%", transform: "translate(-50%, -50%)" },
    },
  ];

  const hasConn = (anchor: "top" | "right" | "bottom" | "left") =>
    connections.some(
      (c) =>
        (c.sourceCardId === cardId && c.sourceAnchor === anchor) ||
        (c.targetCardId === cardId && c.targetAnchor === anchor),
    );

  const getArc = (side: "top" | "right" | "bottom" | "left") => {
    const r = 10; // radius
    switch (side) {
      case "top":
        return `M ${-r} 0 A ${r} ${r} 0 0 0 ${r} 0`;
      case "bottom":
        return `M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`;
      case "left":
        return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r}`;
      case "right":
        return `M 0 ${-r} A ${r} ${r} 0 0 0 0 ${r}`;
    }
  };

  return (
    <>
      {/* Neon filter once per card */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter
            id={`neon-${cardId}`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      {sides.map(({ side, style }) => {
        const active = hasConn(side);
        // Use retro theme colors when retro is active
        const root =
          typeof document !== "undefined" ? document.documentElement : null;
        const isRetro =
          !!root &&
          (root.classList.contains("retro-light") ||
            root.classList.contains("retro-dark"));
        const color = isRetro
          ? active
            ? "var(--retro-connector-active)"
            : "var(--retro-connector-idle)"
          : active
            ? "hsl(140 70% 45%)"
            : "hsl(270 90% 60%)";
        const arc = getArc(side);
        return (
          <div key={side} style={{ position: "absolute", zIndex: 5, ...style }}>
            <svg
              width={24}
              height={24}
              viewBox="-12 -12 24 24"
              data-anchor="true"
              className="pointer-events-auto"
              style={{ filter: `url(#neon-${cardId})` }}
              onClick={async (e) => {
                e.stopPropagation();
                if (linking.isActive) {
                  await onCompleteLinking(cardId, side);
                } else {
                  onStartLinking(cardId, side);
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onRemoveConnections(cardId, side);
              }}
              role="button"
              aria-label="Connect"
            >
              <path
                d={arc}
                stroke={color}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
        );
      })}
    </>
  );
}
