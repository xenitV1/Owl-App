"use client";

import React from "react";
import { WebContentViewer } from "../WebContentViewer";

export function WebContent({
  content,
  cardId,
}: {
  content: string;
  cardId: string;
}) {
  try {
    const webData = JSON.parse(content);
    const { webUrl, webTitle, connectedTo } = webData;
    return (
      <WebContentViewer
        url={webUrl}
        title={webTitle}
        cardId={cardId}
        connectedTo={connectedTo}
      />
    );
  } catch (error) {
    console.error("Error parsing web data:", error);
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500">Error loading web content</p>
        </div>
      </div>
    );
  }
}
