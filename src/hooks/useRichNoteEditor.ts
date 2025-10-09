/**
 * Rich Note Editor Hook
 * Core editor logic, content management, and auto-save functionality
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import type { BlockNoteEditor } from "@blocknote/core";
import { parseMarkdownToBlocks } from "@/utils/markdownParser";
import {
  processContentForSaving,
  detectAndConvertImageUrls,
} from "@/utils/editorHelpers";
import { useWorkspaceStore } from "@/hooks/useWorkspaceStore";

interface UseRichNoteEditorProps {
  cardId: string;
  initialContent?: string;
}

const MIN_SAVE_INTERVAL_MS = 30000; // 30s
const DEBOUNCE_MS = 5000; // 5s idle debounce

export const useRichNoteEditor = ({
  cardId,
  initialContent = "",
}: UseRichNoteEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [rightContent, setRightContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastSavedContent, setLastSavedContent] = useState<string>("");
  const [lastSavedRightContent, setLastSavedRightContent] =
    useState<string>("");
  const [lastSaveAtMs, setLastSaveAtMs] = useState<number>(0);
  const [splitView, setSplitView] = useState<boolean>(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { saveRichNoteVersion, cards } = useWorkspaceStore();
  const card = cards.find((c) => c.id === cardId);
  const richContent = card?.richContent;

  // Initialize BlockNote editors
  const editor = useCreateBlockNote({
    initialContent: undefined,
    _tiptapOptions: {
      enableInputRules: true,
      enablePasteRules: true,
    },
  });

  const editorRight = useCreateBlockNote({
    initialContent: undefined,
    _tiptapOptions: {
      enableInputRules: true,
      enablePasteRules: true,
    },
  });

  // Load existing content when card data is available
  useEffect(() => {
    if (
      richContent?.markdown &&
      Array.isArray(editor.document) &&
      editor.document.length === 1 &&
      editor.document[0].type === "paragraph" &&
      Array.isArray(editor.document[0].content) &&
      editor.document[0].content.length === 0
    ) {
      try {
        // Try to parse as new split view structure first
        let contentData;
        try {
          contentData = JSON.parse(richContent.markdown);

          // Check if it's the new split view structure
          if (contentData.leftContent !== undefined) {
            // Restore split view state
            setSplitView(contentData.splitView || false);

            // Load left content
            const leftBlocks = JSON.parse(contentData.leftContent);
            editor.replaceBlocks(editor.document, leftBlocks);
            setContent(contentData.leftContent);

            // Load right content if it exists
            if (contentData.rightContent && contentData.rightContent !== "[]") {
              const rightBlocks = JSON.parse(contentData.rightContent);
              editorRight.replaceBlocks(editorRight.document, rightBlocks);
              setRightContent(contentData.rightContent);
            }
          } else {
            // Fallback to old single editor structure
            editor.replaceBlocks(editor.document, contentData);
            setContent(richContent.markdown);
          }
        } catch (parseError) {
          // If parsing fails, treat as plain markdown text from AI
          try {
            const parsedContent = JSON.parse(richContent.markdown);
            editor.replaceBlocks(editor.document, parsedContent);
            setContent(richContent.markdown);
          } catch {
            // Not JSON, treat as plain markdown - use markdown parser utility
            const markdownText = richContent.markdown;
            const blocks = parseMarkdownToBlocks(markdownText);

            if (blocks.length > 0) {
              editor.replaceBlocks(editor.document, blocks as any);
              setContent(JSON.stringify(blocks));
            }
          }
        }
      } catch (error) {
        console.error("Error parsing rich content:", error);
      }
    }
  }, [richContent?.markdown, editor, editorRight]);

  // Reflect external updates (e.g., notes appended from Web Content)
  useEffect(() => {
    try {
      if (!richContent?.markdown) return;
      // If store content differs from local state, refresh editor content
      if (richContent.markdown !== content) {
        let contentData: any;
        try {
          contentData = JSON.parse(richContent.markdown);
          if (
            contentData &&
            typeof contentData === "object" &&
            contentData.leftContent !== undefined
          ) {
            const leftBlocks = JSON.parse(contentData.leftContent || "[]");
            editor.replaceBlocks(editor.document, leftBlocks);
            setContent(contentData.leftContent);
            if (contentData.rightContent && contentData.rightContent !== "[]") {
              const rightBlocks = JSON.parse(contentData.rightContent);
              editorRight.replaceBlocks(editorRight.document, rightBlocks);
              setRightContent(contentData.rightContent);
            }
          } else {
            // Simple array structure
            editor.replaceBlocks(
              editor.document,
              Array.isArray(contentData) ? contentData : [],
            );
            setContent(richContent.markdown);
          }
        } catch (_e) {
          // Ignore parse errors
        }
      }
    } catch (_err) {
      // swallow
    }
  }, [richContent?.markdown]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    const now = Date.now();
    const hasLeftContent = content && content.trim() && content !== "[]";
    const hasRightContent =
      rightContent && rightContent.trim() && rightContent !== "[]";
    const hasContent = hasLeftContent || hasRightContent;
    const leftChanged = content !== lastSavedContent;
    const rightChanged = rightContent !== lastSavedRightContent;
    const changed = leftChanged || rightChanged;
    const dueByInterval = now - lastSaveAtMs >= MIN_SAVE_INTERVAL_MS;

    if (hasContent && changed && dueByInterval) {
      setIsSaving(true);
      try {
        const processedContent = await processContentForSaving(
          content,
          rightContent,
          splitView,
        );
        await saveRichNoteVersion(cardId, processedContent);
        setLastSaved(new Date());
        setLastSavedContent(content);
        setLastSavedRightContent(rightContent);
        setLastSaveAtMs(now);
      } catch (error) {
        console.error("Rich note save error:", error);
      } finally {
        setTimeout(() => setIsSaving(false), 1000);
      }
    }
  }, [
    content,
    rightContent,
    cardId,
    saveRichNoteVersion,
    lastSavedContent,
    lastSavedRightContent,
    lastSaveAtMs,
    splitView,
  ]);

  // Auto-save on content change (debounced)
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, DEBOUNCE_MS);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, rightContent, autoSave]);

  // Handle keyboard events specifically for the editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the event is coming from our editor
      const target = e.target as HTMLElement;
      const isInOurEditor =
        target.closest('[data-workspace-card="true"]') &&
        target.closest(".ProseMirror");

      if (isInOurEditor) {
        // Stop propagation for space key to prevent pan mode activation
        if (e.key === " ") {
          e.stopPropagation();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  // Handle content changes from BlockNote
  const handleContentChange = useCallback(() => {
    const blocks = editor.document;
    const jsonContent = JSON.stringify(blocks);
    setContent(jsonContent);

    // Detect and convert image URLs
    detectAndConvertImageUrls(blocks, editor.replaceBlocks, editor.document);
  }, [editor]);

  const handleContentChangeRight = useCallback(() => {
    const blocks = editorRight.document;
    const jsonContent = JSON.stringify(blocks);
    setRightContent(jsonContent);

    // Detect and convert image URLs in right editor
    detectAndConvertImageUrls(
      blocks,
      editorRight.replaceBlocks,
      editorRight.document,
    );
  }, [editorRight]);

  // Function to merge right panel content into left panel
  const mergeRightContentIntoLeft = useCallback(() => {
    if (rightContent && rightContent.trim() && rightContent !== "[]") {
      try {
        const rightBlocks = JSON.parse(rightContent);

        // Add a separator block if left content exists
        const leftBlocks = editor.document;
        const hasLeftContent =
          leftBlocks.length > 1 ||
          (leftBlocks.length === 1 &&
            leftBlocks[0].content &&
            Array.isArray(leftBlocks[0].content) &&
            leftBlocks[0].content.length > 0);

        if (hasLeftContent) {
          // Insert separator paragraph first
          editor.insertBlocks(
            [
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "---", styles: { bold: true } },
                ],
                id: `separator-${Date.now()}`,
              },
            ],
            leftBlocks[leftBlocks.length - 1],
            "after",
          );

          // Then insert right content after the separator
          editor.insertBlocks(
            rightBlocks,
            leftBlocks[leftBlocks.length - 1],
            "after",
          );
        } else {
          // If left is empty, replace with right content
          editor.replaceBlocks(editor.document, rightBlocks);
        }

        // Update the content state
        const mergedContent = JSON.stringify(editor.document);
        setContent(mergedContent);

        // Clear right content and editor
        setRightContent("");
        editorRight.replaceBlocks(editorRight.document, [
          {
            type: "paragraph",
            content: [],
            id: "initial-paragraph",
          },
        ]);
      } catch (error) {
        console.error("Error merging right content into left:", error);
      }
    }
  }, [rightContent, editor, editorRight]);

  return {
    editor,
    editorRight,
    content,
    rightContent,
    splitView,
    setSplitView,
    isSaving,
    lastSaved,
    showVersionHistory,
    setShowVersionHistory,
    handleContentChange,
    handleContentChangeRight,
    mergeRightContentIntoLeft,
    autoSave,
    richContent,
  };
};
