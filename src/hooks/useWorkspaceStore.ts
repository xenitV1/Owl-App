'use client';

import { createContext, useContext, createElement } from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { workspaceDB, isIndexedDBSupported } from '@/lib/indexedDB';

// Connection types for linking cards
export type AnchorSide = 'top' | 'right' | 'bottom' | 'left';

export interface Connection {
  id: string;
  sourceCardId: string;
  sourceAnchor: AnchorSide;
  targetCardId: string;
  targetAnchor: AnchorSide;
  createdAt: number;
}

interface WorkspaceCard {
  id: string;
  type: 'platformContent' | 'richNote' | 'calendar' | 'pomodoro' | 'taskBoard' | 'flashcards' | 'rssFeed' | 'owlSearch' | 'spotify';
  title: string;
  content?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  // Rich Note specific fields
  richContent?: {
    markdown: string;
    html: string;
    versionHistory: Array<{
      timestamp: number;
      content: string;
      author?: string;
    }>;
    lastSaved: number;
  };
  // Calendar specific fields
  calendarData?: {
    events: Array<{
      id: string;
      title: string;
      start: Date;
      end: Date;
      description?: string;
      color: string;
      recurring?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        interval: number;
        endDate?: Date;
      };
    }>;
    view: 'month' | 'week' | 'day';
    currentDate: Date;
  };
  // Pomodoro specific fields
  pomodoroData?: {
    workDuration: number; // minutes
    breakDuration: number; // minutes
    longBreakDuration: number; // minutes
    sessionsUntilLongBreak: number;
    currentSession: number;
    isRunning: boolean;
    isBreak: boolean;
    timeLeft: number; // seconds
    cyclesCompleted: number;
    totalFocusTime: number; // minutes
    lastStartTime?: number;
    statistics: {
      totalSessions: number;
      totalFocusTime: number;
      averageSession: number;
      longestSession: number;
    };
  };
  // Flashcard specific fields
  flashcardData?: {
    totalCards: number;
    cardsDue: number;
    studyStreak: number;
    averageAccuracy: number;
    categories: string[];
    lastStudyDate?: Date;
  };
  // Task Board specific fields
  taskBoardData?: {
    columns: Array<{
      id: string;
      title: string;
      color: string;
      tasks: Array<{
        id: string;
        title: string;
        description?: string;
        priority: 'low' | 'medium' | 'high' | 'urgent';
        dueDate?: Date;
        assignees?: string[];
        subtasks: Array<{
          id: string;
          title: string;
          completed: boolean;
        }>;
        labels: string[];
        created: Date;
        updated: Date;
      }>;
    }>;
  };
}

// Flashcard interfaces
interface Flashcard {
  id: string;
  cardId?: string; // Workspace card ID that owns this flashcard
  front: string;
  back: string;
  type: 'text' | 'image' | 'audio' | 'video';
  mediaUrl?: string;
  difficulty: number; // 1-5 scale
  nextReview: Date;
  interval: number; // days
  easeFactor: number;
  repetitions: number;
  createdAt: Date;
  lastReviewed?: Date;
  tags: string[];
  category: string;
}

interface StudySession {
  id: string;
  startTime: Date;
  cardsStudied: number;
  correctAnswers: number;
  averageResponseTime: number;
  sessionDuration: number;
  sessionDate: Date;
}

interface FlashcardStats {
  id: string;
  totalCards: number;
  cardsDue: number;
  averageDifficulty: number;
  studyStreak: number;
  totalStudyTime: number;
  accuracy: number;
  lastUpdated: Date;
}

interface WorkspaceData {
  cards: WorkspaceCard[];
  version: string;
  lastModified: number;
}

const CURRENT_VERSION = '2.0.0'; // IndexedDB version

export interface WorkspaceStoreValue {
  cards: WorkspaceCard[];
  isLoading: boolean;
  isIndexedDBReady: boolean;
  addCard: (card: WorkspaceCard) => Promise<void>;
  updateCard: (cardId: string, updates: Partial<WorkspaceCard>) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  clearWorkspace: () => Promise<void>;
  bringToFront: (cardId: string) => Promise<void>;
  loadWorkspace: () => Promise<void>;
  exportWorkspace: () => string;
  importWorkspace: (jsonData: string) => Promise<boolean>;
  getStats: () => any;
  saveRichNoteVersion: (cardId: string, content: string, author?: string) => Promise<void>;
  startPomodoro: (cardId: string) => Promise<void>;
  pausePomodoro: (cardId: string) => Promise<void>;
  resetPomodoro: (cardId: string) => Promise<void>;
  addTask: (cardId: string, columnId: string, task: { title: string; description?: string; priority?: 'low' | 'medium' | 'high' | 'urgent'; dueDate?: Date; }) => Promise<void>;
  moveTask: (cardId: string, taskId: string, fromColumnId: string, toColumnId: string) => Promise<void>;
  getAllFlashcards: (cardId?: string) => Promise<any[]>;
  saveFlashcard: (flashcard: any) => Promise<void>;
  deleteFlashcard: (flashcardId: string) => Promise<void>;
  getFlashcardStats: () => Promise<any | null>;
  saveFlashcardStats: (stats: any) => Promise<void>;
  saveStudySession: (session: any) => Promise<void>;
  getStudySessions: () => Promise<any[]>;
  // Connections API
  connections: Connection[];
  addConnection: (conn: Connection) => Promise<void>;
  removeConnection: (connectionId: string) => Promise<void>;
  clearConnectionsForCard: (cardId: string) => Promise<void>;
  removeConnectionsAt: (cardId: string, anchor: AnchorSide) => Promise<void>;
  // Linking flow state
  linking: {
    isActive: boolean;
    sourceCardId?: string;
    sourceAnchor?: AnchorSide;
    cursor?: { x: number; y: number };
  };
  startLinking: (sourceCardId: string, sourceAnchor: AnchorSide) => void;
  updateLinkCursor: (pos: { x: number; y: number }) => void;
  cancelLinking: () => void;
  completeLinking: (targetCardId: string, targetAnchor: AnchorSide) => Promise<boolean>;
}

export const WorkspaceStoreContext = createContext<WorkspaceStoreValue | null>(null);

export function WorkspaceStoreProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards] = useState<WorkspaceCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIndexedDBReady, setIsIndexedDBReady] = useState(false);
  const debouncedSaveRef = useRef<number | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [linking, setLinking] = useState<{ isActive: boolean; sourceCardId?: string; sourceAnchor?: AnchorSide; cursor?: { x: number; y: number } }>({ isActive: false });

  // Initialize IndexedDB
  const initializeDB = useCallback(async () => {
    try {
      if (!isIndexedDBSupported()) {
        setIsIndexedDBReady(false);
        setIsLoading(false);
        return;
      }

      await workspaceDB.init();
      setIsIndexedDBReady(true);
    } catch (error) {
      console.error('IndexedDB initialization error:', error);
      setIsIndexedDBReady(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load workspace from IndexedDB
  const loadWorkspace = useCallback(async () => {
    try {
      if (!isIndexedDBReady) {
        setCards([]);
        setConnections([]);
        return;
      }

      const cardsData = await workspaceDB.getAll<WorkspaceCard>('cards');
      setCards(cardsData || []);

      const conns = await workspaceDB.getAll<Connection>('connections');
      setConnections(conns || []);
    } catch (error) {
      console.error('Failed to load workspace:', error);
      setCards([]);
      setConnections([]);
    }
  }, [isIndexedDBReady]);

  // Save workspace to IndexedDB
  const saveWorkspace = useCallback(async (newCards: WorkspaceCard[]) => {
    try {
      if (!isIndexedDBReady) {
        return;
      }

      // Save workspace metadata (silent)
      await workspaceDB.put('workspace', {
        id: 'main',
        version: CURRENT_VERSION,
        lastModified: Date.now(),
        cardCount: newCards.length
      }, true);

      // Save each card individually (silent)
      for (const card of newCards) {
        await workspaceDB.put('cards', card, true);
      }
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  }, [isIndexedDBReady]);

  // Debounced save to avoid writing intermediate states
  const scheduleSaveWorkspace = useCallback((newCards: WorkspaceCard[], delayMs: number = 1000) => {
    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
    }
    debouncedSaveRef.current = window.setTimeout(() => {
      debouncedSaveRef.current = null;
      saveWorkspace(newCards);
    }, delayMs);
  }, [saveWorkspace]);

  const addConnection = useCallback(async (conn: Connection) => {
    setConnections(prev => {
      const next = [...prev, conn];
      return next;
    });
    try {
      if (isIndexedDBReady) {
        await workspaceDB.put('connections', conn, true);
      }
    } catch (e) {
      console.error('Failed to save connection:', e);
    }
  }, [isIndexedDBReady]);

  const removeConnection = useCallback(async (connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
    try {
      if (isIndexedDBReady) {
        await workspaceDB.delete('connections', connectionId);
      }
    } catch (e) {
      console.error('Failed to delete connection:', e);
    }
  }, [isIndexedDBReady]);

  const removeConnectionsAt = useCallback(async (cardId: string, anchor: AnchorSide) => {
    // Update state
    setConnections(prev => prev.filter(c => !(
      (c.sourceCardId === cardId && c.sourceAnchor === anchor) ||
      (c.targetCardId === cardId && c.targetAnchor === anchor)
    )));
    // Persist
    try {
      if (isIndexedDBReady) {
        const all = await workspaceDB.getAll<Connection>('connections');
        const toDelete = (all || []).filter(c => (
          (c.sourceCardId === cardId && c.sourceAnchor === anchor) ||
          (c.targetCardId === cardId && c.targetAnchor === anchor)
        ));
        for (const c of toDelete) {
          await workspaceDB.delete('connections', c.id);
        }
      }
    } catch (e) {
      console.error('Failed to remove connections at anchor:', e);
    }
  }, [isIndexedDBReady]);

  const clearConnectionsForCard = useCallback(async (cardId: string) => {
    setConnections(prev => prev.filter(c => c.sourceCardId !== cardId && c.targetCardId !== cardId));
    try {
      if (isIndexedDBReady) {
        const all = await workspaceDB.getAll<Connection>('connections');
        const toDelete = (all || []).filter(c => c.sourceCardId === cardId || c.targetCardId === cardId);
        for (const c of toDelete) {
          await workspaceDB.delete('connections', c.id);
        }
      }
    } catch (e) {
      console.error('Failed to clear connections for card:', e);
    }
  }, [isIndexedDBReady]);

  // Add a new card
  const addCard = useCallback(async (card: WorkspaceCard) => {
    setCards(prev => {
      const newCards = [...prev, card];
      // Add is meaningful: persist immediately
      saveWorkspace(newCards);
      return newCards;
    });
  }, [saveWorkspace]);

  // Update an existing card
  const updateCard = useCallback(async (cardId: string, updates: Partial<WorkspaceCard>) => {
    setCards(prev => {
      const newCards = prev.map(card => 
        card.id === cardId ? { ...card, ...updates } : card
      );
      // Debounce frequent updates (dragging, resizing, typing)
      scheduleSaveWorkspace(newCards, 1000);
      return newCards;
    });
  }, [scheduleSaveWorkspace]);

  // Delete a card
  const deleteCard = useCallback(async (cardId: string) => {
    // Remove from state and persist immediately to avoid resurrection via debounced save
    setCards(prev => {
      const newCards = prev.filter(card => card.id !== cardId);
      // Cancel any pending debounced save that may re-write old state
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
        debouncedSaveRef.current = null;
      }
      // Persist the new state right away
      saveWorkspace(newCards);
      return newCards;
    });

    // Delete from IndexedDB store for cards
    try {
      if (isIndexedDBReady) {
        await workspaceDB.delete('cards', cardId);
      }
      // Also delete related connections
      await clearConnectionsForCard(cardId);
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  }, [isIndexedDBReady, saveWorkspace, clearConnectionsForCard]);

  // Clear all cards
  const clearWorkspace = useCallback(async () => {
    setCards([]);
    try {
      if (isIndexedDBReady) {
        await workspaceDB.clear('cards');
        await workspaceDB.clear('workspace');
      }
    } catch (error) {
      console.error('Failed to clear workspace:', error);
    }
  }, [isIndexedDBReady]);

  // Move card to front (increase z-index)
  const bringToFront = useCallback(async (cardId: string) => {
    setCards(prev => {
      const maxZ = Math.max(...prev.map(c => c.zIndex), 0);
      const newCards = prev.map(card => 
        card.id === cardId ? { ...card, zIndex: maxZ + 1 } : card
      );
      scheduleSaveWorkspace(newCards, 500);
      return newCards;
    });
  }, [scheduleSaveWorkspace]);

  // Export workspace data
  const exportWorkspace = useCallback(() => {
    const data: WorkspaceData = {
      cards,
      version: CURRENT_VERSION,
      lastModified: Date.now(),
    };
    return JSON.stringify(data, null, 2);
  }, [cards]);

  // Import workspace data
  const importWorkspace = useCallback(async (jsonData: string) => {
    try {
      const data: WorkspaceData = JSON.parse(jsonData);
      if (data.cards && Array.isArray(data.cards)) {
        setCards(data.cards);
        await saveWorkspace(data.cards);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import workspace:', error);
      return false;
    }
  }, [saveWorkspace]);

  // Get workspace statistics
  const getStats = useCallback(() => {
    const stats = {
      totalCards: cards.length,
      cardTypes: {
        platformContent: cards.filter(c => c.type === 'platformContent').length,
        richNote: cards.filter(c => c.type === 'richNote').length,
        calendar: cards.filter(c => c.type === 'calendar').length,
        pomodoro: cards.filter(c => c.type === 'pomodoro').length,
        taskBoard: cards.filter(c => c.type === 'taskBoard').length,
      },
      averageSize: cards.length > 0 ? {
        width: Math.round(cards.reduce((sum, c) => sum + c.size.width, 0) / cards.length),
        height: Math.round(cards.reduce((sum, c) => sum + c.size.height, 0) / cards.length),
      } : { width: 0, height: 0 },
      // Phase 1 specific stats
      totalRichNotes: cards.filter(c => c.type === 'richNote').length,
      totalCalendarEvents: cards
        .filter(c => c.type === 'calendar' && c.calendarData?.events)
        .reduce((sum, c) => sum + (c.calendarData?.events?.length || 0), 0),
      totalPomodoroSessions: cards
        .filter(c => c.type === 'pomodoro' && c.pomodoroData?.statistics)
        .reduce((sum, c) => sum + (c.pomodoroData?.statistics?.totalSessions || 0), 0),
      totalTasks: cards
        .filter(c => c.type === 'taskBoard' && c.taskBoardData?.columns)
        .reduce((sum, c) => sum + c.taskBoardData!.columns.reduce((colSum, col) => colSum + col.tasks.length, 0), 0),
    };
    return stats;
  }, [cards]);

  // Rich Note specific functions
  const saveRichNoteVersion = useCallback(async (cardId: string, content: string, author?: string) => {
    const currentCard = cards.find(c => c.id === cardId);
    await updateCard(cardId, {
      content: content, // Save the JSON content
      richContent: {
        markdown: content,
        html: '', // Will be converted by the component
        versionHistory: [
          ...(currentCard?.richContent?.versionHistory || []),
          {
            timestamp: Date.now(),
            content,
            author,
          }
        ].slice(-10), // Keep last 10 versions
        lastSaved: Date.now(),
      }
    });
  }, [cards, updateCard]);

  // Pomodoro specific functions
  const startPomodoro = useCallback(async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card?.pomodoroData) return;

    const workDuration = card.pomodoroData.workDuration * 60; // Convert to seconds
    await updateCard(cardId, {
      pomodoroData: {
        ...card.pomodoroData,
        isRunning: true,
        timeLeft: workDuration,
        lastStartTime: Date.now(),
      }
    });
  }, [cards, updateCard]);

  const pausePomodoro = useCallback(async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card?.pomodoroData) return;

    await updateCard(cardId, {
      pomodoroData: {
        ...card.pomodoroData,
        isRunning: false,
      }
    });
  }, [cards, updateCard]);

  const resetPomodoro = useCallback(async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card?.pomodoroData) return;

    const workDuration = card.pomodoroData.workDuration * 60;
    await updateCard(cardId, {
      pomodoroData: {
        ...card.pomodoroData,
        isRunning: false,
        isBreak: false,
        timeLeft: workDuration,
        currentSession: 1,
      }
    });
  }, [cards, updateCard]);

  // Task Board specific functions
  const addTask = useCallback(async (cardId: string, columnId: string, task: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date;
  }) => {
    const card = cards.find(c => c.id === cardId);
    if (!card?.taskBoardData) return;

    const newTask = {
      id: `task-${Date.now()}`,
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      dueDate: task.dueDate,
      subtasks: [],
      labels: [],
      created: new Date(),
      updated: new Date(),
    };

    const updatedColumns = card.taskBoardData.columns.map(col =>
      col.id === columnId
        ? { ...col, tasks: [...col.tasks, newTask] }
        : col
    );

    await updateCard(cardId, {
      taskBoardData: {
        ...card.taskBoardData,
        columns: updatedColumns,
      }
    });
  }, [cards, updateCard]);

  const moveTask = useCallback(async (cardId: string, taskId: string, fromColumnId: string, toColumnId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card?.taskBoardData) return;

    const task = card.taskBoardData.columns
      .find(col => col.id === fromColumnId)?.tasks
      .find(t => t.id === taskId);

    if (!task) return;

    const updatedColumns = card.taskBoardData.columns.map(col => {
      if (col.id === fromColumnId) {
        return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
      }
      if (col.id === toColumnId) {
        return { ...col, tasks: [...col.tasks, { ...task, updated: new Date() }] };
      }
      return col;
    });

    await updateCard(cardId, {
      taskBoardData: {
        ...card.taskBoardData,
        columns: updatedColumns,
      }
    });
  }, [cards, updateCard]);

  // Flashcard specific functions
  const getAllFlashcards = useCallback(async (cardId?: string): Promise<Flashcard[]> => {
    try {
      if (!isIndexedDBReady) {
        return [];
      }
      const flashcards = await workspaceDB.getAll<Flashcard>('flashcards');
      
      // Filter by cardId if provided
      const filteredFlashcards = cardId 
        ? flashcards.filter(card => card.cardId === cardId)
        : flashcards;
      
      return filteredFlashcards.map(card => ({
        ...card,
        nextReview: new Date(card.nextReview),
        createdAt: new Date(card.createdAt),
        lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined
      }));
    } catch (error) {
      console.error('Failed to load flashcards:', error);
      return [];
    }
  }, [isIndexedDBReady]);

  const saveFlashcard = useCallback(async (flashcard: Flashcard) => {
    try {
      if (!isIndexedDBReady) return;
      await workspaceDB.put('flashcards', flashcard, true);
    } catch (error) {
      console.error('Failed to save flashcard:', error);
    }
  }, [isIndexedDBReady]);

  const deleteFlashcard = useCallback(async (flashcardId: string) => {
    try {
      if (!isIndexedDBReady) return;
      await workspaceDB.delete('flashcards', flashcardId);
    } catch (error) {
      console.error('Failed to delete flashcard:', error);
    }
  }, [isIndexedDBReady]);

  const getFlashcardStats = useCallback(async (): Promise<FlashcardStats | null> => {
    try {
      if (!isIndexedDBReady) return null;
      const stats = await workspaceDB.get<FlashcardStats>('flashcardStats', 'main');
      return stats || null;
    } catch (error) {
      console.error('Failed to load flashcard stats:', error);
      return null;
    }
  }, [isIndexedDBReady]);

  const saveFlashcardStats = useCallback(async (stats: FlashcardStats) => {
    try {
      if (!isIndexedDBReady) return;
      await workspaceDB.put('flashcardStats', stats, true);
    } catch (error) {
      console.error('Failed to save flashcard stats:', error);
    }
  }, [isIndexedDBReady]);

  const saveStudySession = useCallback(async (session: StudySession) => {
    try {
      if (!isIndexedDBReady) return;
      await workspaceDB.put('studySessions', session, true);
    } catch (error) {
      console.error('Failed to save study session:', error);
    }
  }, [isIndexedDBReady]);

  const getStudySessions = useCallback(async (): Promise<StudySession[]> => {
    try {
      if (!isIndexedDBReady) return [];
      const sessions = await workspaceDB.getAll<StudySession>('studySessions');
      return sessions.map(session => ({
        ...session,
        startTime: new Date(session.startTime),
        sessionDate: new Date(session.sessionDate)
      }));
    } catch (error) {
      console.error('Failed to load study sessions:', error);
      return [];
    }
  }, [isIndexedDBReady]);

  // Linking flow
  const startLinking = useCallback((sourceCardId: string, sourceAnchor: AnchorSide) => {
    setLinking({ isActive: true, sourceCardId, sourceAnchor });
  }, []);

  const updateLinkCursor = useCallback((pos: { x: number; y: number }) => {
    setLinking(prev => prev.isActive ? { ...prev, cursor: pos } : prev);
  }, []);

  const cancelLinking = useCallback(() => {
    setLinking({ isActive: false });
  }, []);

  const completeLinking = useCallback(async (targetCardId: string, targetAnchor: AnchorSide) => {
    if (!linking.isActive || !linking.sourceCardId || !linking.sourceAnchor) return false;
    if (linking.sourceCardId === targetCardId && linking.sourceAnchor === targetAnchor) {
      setLinking({ isActive: false });
      return false;
    }
    const newConn: Connection = {
      id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceCardId: linking.sourceCardId,
      sourceAnchor: linking.sourceAnchor,
      targetCardId,
      targetAnchor,
      createdAt: Date.now(),
    };
    await addConnection(newConn);
    setLinking({ isActive: false });
    return true;
  }, [linking, addConnection]);

  // Initialize DB and load workspace on mount
  useEffect(() => {
    const initializeOnly = async () => {
      await initializeDB();
    };
    initializeOnly();
    return () => {
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isIndexedDBReady && cards.length === 0) {
      loadWorkspace();
    }
  }, [isIndexedDBReady]);

  const value: WorkspaceStoreValue = {
    cards,
    isLoading,
    isIndexedDBReady,
    addCard,
    updateCard,
    deleteCard,
    clearWorkspace,
    bringToFront,
    loadWorkspace,
    exportWorkspace,
    importWorkspace,
    getStats,
    saveRichNoteVersion,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    addTask,
    moveTask,
    getAllFlashcards,
    saveFlashcard,
    deleteFlashcard,
    getFlashcardStats,
    saveFlashcardStats,
    saveStudySession,
    getStudySessions,
    // connections
    connections,
    addConnection,
    removeConnection,
    clearConnectionsForCard,
    removeConnectionsAt,
    // linking
    linking,
    startLinking,
    updateLinkCursor,
    cancelLinking,
    completeLinking,
  };

  return (
    // replaced JSX with createElement to avoid JSX in .ts files
    createElement(WorkspaceStoreContext.Provider, { value }, children)
  );
}

export function useWorkspaceStore(): WorkspaceStoreValue {
  const ctx = useContext(WorkspaceStoreContext);
  if (!ctx) {
    throw new Error('useWorkspaceStore must be used within a WorkspaceStoreProvider');
  }
  return ctx;
}
