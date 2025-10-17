"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, RotateCcw, ZoomIn, ZoomOut, Grid, Hand } from "lucide-react";
import { AddCardDialog } from "@/components/work-environment/AddCardDialog";
import { InfiniteCanvas } from "@/components/work-environment/InfiniteCanvas";
import { VirtualizedCardRenderer } from "@/components/work-environment/VirtualizedCardRenderer";
import { PerformanceMonitor } from "@/components/work-environment/PerformanceMonitor";
import { MiniMap } from "@/components/work-environment/MiniMap";
import { useWorkspaceStore } from "@/hooks/useWorkspaceStore";
import { WorkspaceStoreProvider } from "@/hooks/useWorkspaceStore";
import { ConnectionsOverlay } from "@/components/work-environment/ConnectionsOverlay";

function WorkEnvironmentContent() {
  const t = useTranslations("workEnvironment");
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [gridSnap, setGridSnap] = useState(true);
  const [isHoveringCard, setIsHoveringCard] = useState(false);

  const {
    cards,
    addCard,
    updateCard,
    deleteCard,
    loadWorkspace,
    isIndexedDBReady,
    isLoading,
    connections,
    linking,
    updateLinkCursor,
    cancelLinking,
  } = useWorkspaceStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const addSoundRef = useRef<HTMLAudioElement | null>(null);
  const deleteSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize workspace audio
  useEffect(() => {
    addSoundRef.current = new Audio("/api/sounds/card-add.mp3");
    addSoundRef.current.volume = 0.5;
    addSoundRef.current.preload = "auto";

    deleteSoundRef.current = new Audio("/api/sounds/card-delete.mp3");
    deleteSoundRef.current.volume = 0.5;
    deleteSoundRef.current.preload = "auto";

    // Preload both sounds
    addSoundRef.current.load();
    deleteSoundRef.current.load();
  }, []);

  // Play card add sound
  const playAddSound = useCallback(() => {
    if (addSoundRef.current) {
      addSoundRef.current.currentTime = 0;
      addSoundRef.current.play().catch((err) => {
        console.warn("[Workspace] Failed to play add sound:", err);
      });
    }
  }, []);

  // Play card delete sound
  const playDeleteSound = useCallback(() => {
    if (deleteSoundRef.current) {
      deleteSoundRef.current.currentTime = 0;
      deleteSoundRef.current.play().catch((err) => {
        console.warn("[Workspace] Failed to play delete sound:", err);
      });
    }
  }, []);

  // Wrapper for addCard with sound
  const addCardWithSound = useCallback(
    async (card: any) => {
      playAddSound();
      await addCard(card);
    },
    [addCard, playAddSound],
  );

  // Wrapper for deleteCard with sound
  const deleteCardWithSound = useCallback(
    async (cardId: string) => {
      playDeleteSound();
      await deleteCard(cardId);
    },
    [deleteCard, playDeleteSound],
  );

  // Handle pending AI content addition from PostCard
  useEffect(() => {
    const checkPendingAdd = async () => {
      const pending = localStorage.getItem("pendingWorkspaceAdd");
      if (pending && isIndexedDBReady) {
        try {
          const data = JSON.parse(pending);
          const content = JSON.parse(data.content);

          const cardId = `card-${Date.now()}`;

          // Add card based on content type
          if (
            data.contentType === "flashcards" ||
            data.contentType === "questions"
          ) {
            // Get flashcards array - content is already the array!
            const flashcardsArray =
              data.contentType === "flashcards"
                ? Array.isArray(content)
                  ? content
                  : content.flashcards || []
                : (Array.isArray(content)
                    ? content
                    : content.questions || []
                  ).map((q: any) => ({
                    front: q.question,
                    back: `${q.correctAnswer}\n\n${q.explanation}`,
                    difficulty: q.difficulty || 3,
                    tags: [q.type, q.bloomLevel].filter(Boolean),
                    category: data.title,
                  }));

            // Add flashcard container
            await addCardWithSound({
              id: cardId,
              type: "flashcards",
              title: data.title,
              content: "",
              position: { x: 100, y: 100 },
              size: { width: 400, height: 500 },
              zIndex: Date.now(),
            });

            // Import flashcards to IndexedDB
            // Trigger import event after card is created
            setTimeout(() => {
              const importData = {
                cardId,
                flashcards: flashcardsArray,
              };
              window.dispatchEvent(
                new CustomEvent("workspace:importFlashcards", {
                  detail: importData,
                }),
              );
            }, 500);
          } else if (data.contentType === "notes") {
            // Extract markdown content - remove code fences if present
            let markdownContent =
              typeof content === "string" ? content : content.content || "";

            // Remove markdown code fences if AI added them
            if (markdownContent.startsWith("```markdown\n")) {
              markdownContent = markdownContent
                .replace(/^```markdown\n/, "")
                .replace(/\n```$/, "");
            } else if (markdownContent.startsWith("```\n")) {
              markdownContent = markdownContent
                .replace(/^```\n/, "")
                .replace(/\n```$/, "");
            }

            await addCardWithSound({
              id: cardId,
              type: "richNote",
              title: data.title,
              content: markdownContent,
              position: { x: 100, y: 100 },
              size: { width: 600, height: 600 },
              zIndex: Date.now(),
              richContent: {
                markdown: markdownContent, // Plain markdown text
                html: "",
                versionHistory: [],
                lastSaved: Date.now(),
              },
            });
          }

          // Clear pending add
          localStorage.removeItem("pendingWorkspaceAdd");
        } catch (error) {
          console.error("Failed to add pending workspace content:", error);
          localStorage.removeItem("pendingWorkspaceAdd");
        }
      }
    };

    // Check after a short delay to ensure IndexedDB is ready
    const timeout = setTimeout(checkPendingAdd, 1000);
    return () => clearTimeout(timeout);
  }, [isIndexedDBReady, addCardWithSound]);

  // Track cursor globally while linking for smooth temporary line following the mouse
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      addCardWithSound({
        ...detail,
        zIndex: cards.length + 1,
      });
    };
    window.addEventListener("workspace:addCard", handler as any);
    return () =>
      window.removeEventListener("workspace:addCard", handler as any);
  }, [addCardWithSound, cards.length]);

  useEffect(() => {
    if (!linking.isActive) return;
    const handleMove = (e: MouseEvent) => {
      const container = document.querySelector(
        "[data-workspace-container]",
      ) as HTMLDivElement | null;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - pan.x) / zoom;
      const worldY = (e.clientY - rect.top - pan.y) / zoom;
      updateLinkCursor({ x: worldX, y: worldY });
    };
    document.addEventListener("mousemove", handleMove);
    return () => document.removeEventListener("mousemove", handleMove);
  }, [linking.isActive, pan.x, pan.y, zoom]);

  // Note: Workspace loading is handled by useWorkspaceStore hook automatically

  // Auto-center on cards when workspace loads
  useEffect(() => {
    if (cards.length > 0 && !isLoading) {
      // Calculate bounding box of all cards
      let minX = Infinity,
        minY = Infinity;
      let maxX = -Infinity,
        maxY = -Infinity;

      cards.forEach((card) => {
        minX = Math.min(minX, card.position.x);
        minY = Math.min(minY, card.position.y);
        maxX = Math.max(maxX, card.position.x + card.size.width);
        maxY = Math.max(maxY, card.position.y + card.size.height);
      });

      // Calculate center of all cards
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Calculate required zoom to fit all cards (with 20% padding)
      const width = maxX - minX;
      const height = maxY - minY;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const scaleX = viewportWidth / (width * 1.2);
      const scaleY = viewportHeight / (height * 1.2);
      const optimalZoom = Math.min(scaleX, scaleY, 1); // Max zoom 1x for readability

      // Set zoom and pan to center on cards
      setZoom(optimalZoom);
      setPan({
        x: viewportWidth / 2 - centerX * optimalZoom,
        y: viewportHeight / 2 - centerY * optimalZoom,
      });

      console.log(
        `[Workspace] Auto-centered on ${cards.length} cards at zoom ${(optimalZoom * 100).toFixed(0)}%`,
      );
    }
  }, [cards.length, isLoading]); // Only run when cards are loaded

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Check if the target is inside a rich note editor or any input/textarea
      const target = e.target as HTMLElement;
      const isInEditor =
        target.closest('[data-workspace-card="true"]') &&
        (target.closest(".ProseMirror") ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.contentEditable === "true");

      if (e.key === "Escape") {
        setSelectedCardId(null);
      }
      if (e.key === "Delete" && selectedCardId && !isInEditor) {
        deleteCardWithSound(selectedCardId);
        setSelectedCardId(null);
      }
      if (e.key === " " && !isInEditor) {
        e.preventDefault();
        setPanMode(true);
      }
    },
    [selectedCardId, deleteCardWithSound],
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    // Check if the target is inside a rich note editor or any input/textarea
    const target = e.target as HTMLElement;
    const isInEditor =
      target.closest('[data-workspace-card="true"]') &&
      (target.closest(".ProseMirror") ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true");

    if (e.key === " " && !isInEditor) {
      setPanMode(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleAddCard = useCallback(
    (cardData: {
      type:
        | "platformContent"
        | "richNote"
        | "calendar"
        | "pomodoro"
        | "taskBoard"
        | "flashcards"
        | "rssFeed"
        | "owlSearch"
        | "spotify";
      title: string;
      url?: string;
      content?: string;
      richContent?: any;
      calendarData?: any;
      pomodoroData?: any;
      taskBoardData?: any;
      flashcardData?: any;
    }) => {
      const newCard = {
        id: `card-${Date.now()}`,
        ...cardData,
        position: {
          x: (window.innerWidth / 2 - pan.x) / zoom - 200,
          y: (window.innerHeight / 2 - pan.y) / zoom - 150,
        },
        size: { width: 400, height: 300 },
        zIndex: cards.length + 1,
      };

      playAddSound();
      addCard(newCard);
      setIsAddCardOpen(false);
    },
    [addCard, cards.length, pan, zoom, playAddSound],
  );

  // Show loading state while IndexedDB initializes
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">
            Çalışma ortamı yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 relative">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("subtitle")}
              {isIndexedDBReady && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  IndexedDB
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddCardOpen(true)}
            className="bg-background/80 backdrop-blur-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("addCard")}
          </Button>
        </div>
      </div>

      {/* Canvas Controls */}
      <div className="absolute bottom-4 left-[244px] z-50">
        <Card className="p-2 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Button
              variant={panMode ? "default" : "outline"}
              size="sm"
              onClick={() => setPanMode(!panMode)}
              title={t("panMode")}
            >
              <Hand className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGridSnap(!gridSnap)}
              title={t("gridSnap")}
              className={gridSnap ? "bg-primary/10" : ""}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              title={t("zoomOut")}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              title={t("zoomIn")}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              title={t("resetZoom")}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Privacy Notice */}
      {cards.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <Card className="p-6 max-w-md text-center bg-background/90 backdrop-blur-sm border-dashed">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{t("noCards")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("createFirstCard")}
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg text-sm">
                <h4 className="font-medium mb-2">{t("privacy.title")}</h4>
                <p className="text-muted-foreground">
                  {t("privacy.description")}
                </p>
              </div>

              <Button onClick={() => setIsAddCardOpen(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                {t("addCard")}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Infinite Canvas */}
      <InfiniteCanvas
        ref={canvasRef}
        zoom={zoom}
        pan={pan}
        panMode={panMode && !isHoveringCard}
        gridSnap={gridSnap}
        onPanChange={setPan}
        onZoomChange={setZoom}
        className="w-full h-full"
      >
        {/* Render Cards with Virtualization */}
        <div
          className="absolute inset-0"
          onMouseDown={(e) => {
            if (!linking.isActive) return;
            const target = e.target as HTMLElement;
            const isAnchor = !!target.closest('[data-anchor="true"]');
            if (!isAnchor) {
              cancelLinking();
            }
          }}
        >
          <VirtualizedCardRenderer
            cards={cards}
            zoom={zoom}
            pan={pan}
            selectedCardId={selectedCardId}
            onSelect={setSelectedCardId}
            onUpdate={updateCard}
            onDelete={deleteCardWithSound}
            gridSnap={gridSnap}
            onCardHover={setIsHoveringCard}
          />
        </div>
        {/* Overlay lines rendered within transformed space */}
        <ConnectionsOverlay
          cards={cards}
          connections={connections}
          linking={linking}
          pan={pan}
          zoom={zoom}
        />
      </InfiniteCanvas>

      {/* Add Card Dialog */}
      <AddCardDialog
        open={isAddCardOpen}
        onOpenChange={setIsAddCardOpen}
        onAddCard={handleAddCard}
      />

      {/* Mini Map */}
      <MiniMap cards={cards} pan={pan} zoom={zoom} onNavigate={setPan} />

      {/* Performance Monitor */}
      <PerformanceMonitor cardCount={cards.length} />
    </div>
  );
}

export default function WorkEnvironmentPage() {
  return (
    <WorkspaceStoreProvider>
      <WorkEnvironmentContent />
    </WorkspaceStoreProvider>
  );
}
