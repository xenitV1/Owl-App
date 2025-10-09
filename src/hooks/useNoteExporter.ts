/**
 * Note Exporter Hook
 * Manages export functionality for notes (PDF, Markdown)
 */

import { useState } from "react";
import TurndownService from "turndown";
import type { BlockNoteEditor } from "@blocknote/core";

export const useNoteExporter = (cardId: string) => {
  const [showExport, setShowExport] = useState(false);

  /**
   * Exports editor content as PDF (currently exports as text file)
   */
  const exportToPDF = async (editor: BlockNoteEditor) => {
    try {
      const blocks = editor.document;
      const text = blocks
        .map((block) => {
          if (block.type === "paragraph" && Array.isArray(block.content)) {
            return (
              block.content
                .map((item) => {
                  if (typeof item === "string") return item;
                  if (item && typeof item === "object" && "text" in item) {
                    return (item as any).text || "";
                  }
                  return "";
                })
                .join("") + "\n"
            );
          }
          return "";
        })
        .join("");

      // Simple text file generation - in production, use react-pdf
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `note-${cardId}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export Error:", error);
    }
  };

  /**
   * Exports editor content as Markdown file
   */
  const exportToMarkdown = (editor: BlockNoteEditor) => {
    try {
      const blocks = editor.document;
      const turndownService = new TurndownService();
      const html = blocks
        .map((block) => {
          if (block.type === "paragraph" && Array.isArray(block.content)) {
            return `<p>${block.content
              .map((item) => {
                if (typeof item === "string") return item;
                if (item && typeof item === "object" && "text" in item) {
                  return (item as any).text || "";
                }
                return "";
              })
              .join("")}</p>`;
          }
          return "";
        })
        .join("");

      const markdown = turndownService.turndown(html);
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `note-${cardId}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export Error:", error);
    }
  };

  return {
    showExport,
    setShowExport,
    exportToPDF,
    exportToMarkdown,
  };
};
