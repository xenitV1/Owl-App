"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink } from "lucide-react";
import { useWebTypography } from "@/hooks/useWebTypography";
import { useWorkspaceStore } from "@/hooks/useWorkspaceStore";
import { addNoteToRichNote as addNoteToRichNoteUtil } from "@/lib/richNoteManager";
import { TextHighlighter } from "./TextHighlighter";
import { HighlightsPanel } from "./HighlightsPanel";
import { useLoadingMessages } from "@/hooks/useLoadingMessages";
import { useTranslations } from "next-intl";
import { AISummary } from "./AISummary";
import { WebContentHeader } from "./web-content/WebContentHeader";
import { WebContentRenderer } from "./web-content/WebContentRenderer";
import { WebContentMetadata } from "./web-content/WebContentMetadata";

// Web Content Viewer Component
interface WebContentViewerProps {
  url: string;
  title?: string;
  cardId: string;
  connectedTo?: any;
}

function WebContentViewer({
  url,
  title,
  cardId,
  connectedTo,
}: WebContentViewerProps) {
  const t = useTranslations();

  // Typography hook
  const {
    textSpacing,
    fontSize,
    selectedFont,
    wordSpacing,
    setTextSpacing,
    setFontSize,
    setSelectedFont,
    setWordSpacing,
    getTypographyStyles,
    FONT_OPTIONS,
  } = useWebTypography();

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showAISummary, setShowAISummary] = useState(true);
  const [highlights, setHighlights] = useState<any[]>([]);
  const textHighlighterRef = useRef<any>(null);
  const { addCard, cards, addConnection, connections, saveRichNoteVersion } =
    useWorkspaceStore() as any;

  const { currentMessage } = useLoadingMessages({
    isLoading: loading,
    messageKeys: [
      "connecting",
      "fetching",
      "analyzing",
      "preparing",
      "optimizing",
    ],
    interval: 1200,
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/web-content?url=${encodeURIComponent(url)}`,
        );
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        const data = await res.json();
        setContent(data);
      } catch (err: any) {
        console.error("Error fetching web content:", err);
        setError(err.message || "Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [url]);

  // Load highlights from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`highlights_${cardId}`);
      if (saved) {
        const parsed = JSON.parse(saved).map((h: any) => ({
          ...h,
          createdAt: new Date(h.createdAt),
        }));
        setHighlights(parsed);
      }
    } catch (error) {
      console.warn("Failed to load highlights:", error);
    }
  }, [cardId]);

  // Save highlights to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(`highlights_${cardId}`, JSON.stringify(highlights));
    } catch (error) {
      console.warn("Failed to save highlights:", error);
    }
  }, [highlights, cardId]);

  // Highlight management functions
  const handleHighlightSave = useCallback((highlight: any) => {
    setHighlights((prev) => [...prev, highlight]);
  }, []);

  const handleHighlightDelete = useCallback((highlightId: string) => {
    // Remove from state
    setHighlights((prev) => prev.filter((h) => h.id !== highlightId));

    // Remove from DOM
    textHighlighterRef.current?.removeHighlightFromDOM(highlightId);
  }, []);

  const handleAddNote = useCallback(
    async (highlightId?: string) => {
      if (highlightId) {
        // Find the highlight and create a rich note from it
        const highlight = highlights.find((h) => h.id === highlightId);
        if (!highlight) return;

        try {
          // Get current card position for positioning the rich note
          const currentCard = cards.find((c) => c.id === cardId);
          if (!currentCard) {
            console.error("Source card not found for rich note creation");
            return;
          }

          // Create rich note title from article title or highlight text
          const noteTitle =
            title || highlight.title || highlight.text.substring(0, 50) + "...";

          // Create rich note content with highlight text
          const richNoteContent = JSON.stringify([
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `"${highlight.text}"`,
                  styles: { italic: true },
                },
                { type: "text", text: " - " },
                { type: "text", text: noteTitle, styles: { bold: true } },
              ],
              id: `note-${Date.now()}`,
            },
            {
              type: "paragraph",
              content: [],
              id: `note-${Date.now()}-2`,
            },
          ]);

          // Create rich note card
          const richNoteCard = {
            id: `rich-note-${Date.now()}`,
            type: "richNote" as const,
            title: noteTitle,
            content: richNoteContent,
            position: {
              x: currentCard.position.x + currentCard.size.width + 50, // Position to the right
              y: currentCard.position.y,
            },
            size: { width: 600, height: 400 },
            zIndex: Math.max(...cards.map((c) => c.zIndex), 0) + 1,
            richContent: {
              markdown: richNoteContent,
              html: "",
              versionHistory: [
                {
                  timestamp: Date.now(),
                  content: richNoteContent,
                  author: "system",
                },
              ],
              lastSaved: Date.now(),
            },
          };

          // Append to existing per-source rich note or create one if absent
          await addNoteToRichNoteUtil({
            sourceCardId: cardId,
            noteText: highlight.text,
            noteTitle: noteTitle,
            cards: cards as any,
            connections: connections as any,
            addCard: addCard as any,
            addConnection: addConnection as any,
            saveRichNoteVersion: saveRichNoteVersion as any,
          });

          // Update the highlight to mark it as connected to rich note
          setHighlights((prev) =>
            prev.map((h) =>
              h.id === highlightId
                ? {
                    ...h,
                    isRichNote: true,
                    note: `Connected to Rich Note: ${noteTitle}`,
                    connectedTo: {
                      type: "richNote",
                      cardId: richNoteCard.id,
                      title: noteTitle,
                    },
                  }
                : h,
            ),
          );

          console.log("✅ Rich Note updated from highlight");
        } catch (error) {
          console.error("❌ Error creating rich note from highlight:", error);
        }
      } else {
        // Show a brief message to guide the user
        alert(
          "Please select text in the article to create a highlight and add a note.",
        );
      }
    },
    [highlights, title, cardId, addCard, cards],
  );

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="text-lg">🌐</span>
              {title || (loading ? currentMessage : t("common.loading"))}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              Web Content
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {currentMessage || t("loading.loadingContent")}
            </p>
          </div>
        </CardContent>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="text-lg">🌐</span>
              {title || "Web Page"}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              Web Content
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <ExternalLink className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Unable to load content
            </p>
            <p className="text-xs text-muted-foreground mb-4">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Browser
            </Button>
          </div>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle>
          <WebContentHeader
            title={title}
            content={content}
            url={url}
            fontSize={fontSize}
            setFontSize={setFontSize}
            textSpacing={textSpacing}
            setTextSpacing={setTextSpacing}
            wordSpacing={wordSpacing}
            setWordSpacing={setWordSpacing}
            selectedFont={selectedFont}
            setSelectedFont={setSelectedFont}
            FONT_OPTIONS={FONT_OPTIONS}
            showAISummary={showAISummary}
            setShowAISummary={setShowAISummary}
          />
        </CardTitle>
        {content?.author && (
          <div className="text-xs text-muted-foreground">
            By {content.author}
            {content?.publishedTime && (
              <span className="ml-2">
                • {new Date(content.publishedTime).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <div className="flex gap-6 h-full">
          {/* Main Content Area */}
          <div className="flex-1 overflow-auto space-y-6">
            {/* Featured Image */}
            {content?.image && (
              <div className="w-full">
                <img
                  src={content.image}
                  alt={content.title}
                  className="w-full h-auto max-h-64 object-cover rounded-lg shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Article Excerpt */}
            {showAISummary && (
              <AISummary
                text={content?.content || ""}
                sentenceCount={5}
                minChars={500}
              />
            )}

            {/* Main Content */}
            <div className="space-y-4">
              <TextHighlighter
                ref={textHighlighterRef}
                contentId={cardId}
                onHighlightSave={handleHighlightSave}
                onHighlightDelete={handleHighlightDelete}
                existingHighlights={highlights}
                className="space-y-4"
                articleTitle={title}
                connectedTo={connectedTo}
              >
                <WebContentRenderer
                  structuredContent={content?.structuredContent}
                  displayContent={content?.content || ""}
                  showFullContent={showFullContent}
                  setShowFullContent={setShowFullContent}
                  getTypographyStyles={getTypographyStyles}
                  fontSize={fontSize}
                  wordSpacing={wordSpacing}
                />
              </TextHighlighter>
            </div>

            {/* Article Meta Information */}
            <WebContentMetadata
              author={content?.author}
              publishedTime={content?.publishedTime}
              siteName={content?.siteName}
              url={url}
            />
          </div>

          {/* Highlights Panel */}
          <HighlightsPanel
            highlights={highlights}
            onRemoveHighlight={handleHighlightDelete}
            onAddNote={handleAddNote}
          />
        </div>
      </CardContent>
    </div>
  );
}

export { WebContentViewer };
export type { WebContentViewerProps };
