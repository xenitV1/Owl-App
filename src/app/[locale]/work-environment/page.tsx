'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, RotateCcw, ZoomIn, ZoomOut, Grid, Hand } from 'lucide-react';
import { AddCardDialog } from '@/components/work-environment/AddCardDialog';
import { InfiniteCanvas } from '@/components/work-environment/InfiniteCanvas';
import { VirtualizedCardRenderer } from '@/components/work-environment/VirtualizedCardRenderer';
import { PerformanceMonitor } from '@/components/work-environment/PerformanceMonitor';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';
import { WorkspaceStoreProvider } from '@/hooks/useWorkspaceStore';
import { ConnectionsOverlay } from '@/components/work-environment/ConnectionsOverlay';

function WorkEnvironmentContent() {
  const t = useTranslations('workEnvironment');
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [gridSnap, setGridSnap] = useState(true);
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  
  const { cards, addCard, updateCard, deleteCard, loadWorkspace, isIndexedDBReady, isLoading, connections, linking, updateLinkCursor, cancelLinking } = useWorkspaceStore();
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Track cursor globally while linking for smooth temporary line following the mouse
  useEffect(() => {
    if (!linking.isActive) return;
    const handleMove = (e: MouseEvent) => {
      const container = document.querySelector('[data-workspace-container]') as HTMLDivElement | null;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - pan.x) / zoom;
      const worldY = (e.clientY - rect.top - pan.y) / zoom;
      updateLinkCursor({ x: worldX, y: worldY });
    };
    document.addEventListener('mousemove', handleMove);
    return () => document.removeEventListener('mousemove', handleMove);
  }, [linking.isActive, pan.x, pan.y, zoom]);

  // Note: Workspace loading is handled by useWorkspaceStore hook automatically

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check if the target is inside a rich note editor or any input/textarea
    const target = e.target as HTMLElement;
    const isInEditor = target.closest('[data-workspace-card="true"]') && 
                      (target.closest('.ProseMirror') || 
                       target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' ||
                       target.contentEditable === 'true');
    
    if (e.key === 'Escape') {
      setSelectedCardId(null);
    }
    if (e.key === 'Delete' && selectedCardId && !isInEditor) {
      deleteCard(selectedCardId);
      setSelectedCardId(null);
    }
    if (e.key === ' ' && !isInEditor) {
      e.preventDefault();
      setPanMode(true);
    }
  }, [selectedCardId, deleteCard]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    // Check if the target is inside a rich note editor or any input/textarea
    const target = e.target as HTMLElement;
    const isInEditor = target.closest('[data-workspace-card="true"]') && 
                      (target.closest('.ProseMirror') || 
                       target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' ||
                       target.contentEditable === 'true');
    
    if (e.key === ' ' && !isInEditor) {
      setPanMode(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleAddCard = useCallback((cardData: {
    type: 'platformContent' | 'richNote' | 'calendar' | 'pomodoro' | 'taskBoard' | 'flashcards' | 'rssFeed';
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
        y: (window.innerHeight / 2 - pan.y) / zoom - 150
      },
      size: { width: 400, height: 300 },
      zIndex: cards.length + 1,
    };

    addCard(newCard);
    setIsAddCardOpen(false);
  }, [addCard, cards.length, pan, zoom]);

  // Show loading state while IndexedDB initializes
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Çalışma ortamı yükleniyor...</p>
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
              <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('subtitle')}
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
              {t('addCard')}
            </Button>
          </div>
        </div>

        {/* Canvas Controls */}
        <div className="absolute bottom-4 left-4 z-50">
          <Card className="p-2 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Button
                variant={panMode ? "default" : "outline"}
                size="sm"
                onClick={() => setPanMode(!panMode)}
                title={t('panMode')}
              >
                <Hand className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGridSnap(!gridSnap)}
                title={t('gridSnap')}
                className={gridSnap ? 'bg-primary/10' : ''}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                title={t('zoomOut')}
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
                title={t('zoomIn')}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetZoom}
                title={t('resetZoom')}
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
                  <h3 className="text-lg font-semibold">{t('noCards')}</h3>
                  <p className="text-sm text-muted-foreground">{t('createFirstCard')}</p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg text-sm">
                  <h4 className="font-medium mb-2">{t('privacy.title')}</h4>
                  <p className="text-muted-foreground">{t('privacy.description')}</p>
                </div>
                
                <Button onClick={() => setIsAddCardOpen(true)} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addCard')}
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
          {/* Overlay lines rendered within transformed space */}
          <ConnectionsOverlay cards={cards} connections={connections} linking={linking} pan={pan} zoom={zoom} />
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
              onDelete={deleteCard}
              gridSnap={gridSnap}
              onCardHover={setIsHoveringCard}
            />
          </div>
        </InfiniteCanvas>

        {/* Add Card Dialog */}
        <AddCardDialog
          open={isAddCardOpen}
          onOpenChange={setIsAddCardOpen}
          onAddCard={handleAddCard}
        />

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
