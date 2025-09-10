'use client';

import { useState, useCallback, useEffect } from 'react';
import { workspaceDB, migrateFromLocalStorage, isIndexedDBSupported } from '@/lib/indexedDB';

interface WorkspaceCard {
  id: string;
  type: 'platformContent' | 'note' | 'richNote' | 'calendar' | 'pomodoro' | 'taskBoard' | 'flashcards';
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

interface WorkspaceData {
  cards: WorkspaceCard[];
  version: string;
  lastModified: number;
}

const CURRENT_VERSION = '2.0.0'; // IndexedDB version

export function useWorkspaceStore() {
  const [cards, setCards] = useState<WorkspaceCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIndexedDBReady, setIsIndexedDBReady] = useState(false);

  // Initialize IndexedDB and migrate if needed
  const initializeDB = useCallback(async () => {
    try {
      if (!isIndexedDBSupported()) {
        console.warn('⚠️ IndexedDB desteklenmiyor, localStorage kullanılıyor');
        setIsIndexedDBReady(false);
        setIsLoading(false);
        return;
      }

      await workspaceDB.init();
      
      // Try to migrate from localStorage
      await migrateFromLocalStorage();
      
      setIsIndexedDBReady(true);
    } catch (error) {
      console.error('❌ IndexedDB başlatma hatası:', error);
      setIsIndexedDBReady(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load workspace from IndexedDB
  const loadWorkspace = useCallback(async () => {
    try {
      if (!isIndexedDBReady) {
        // Fallback to localStorage if IndexedDB not ready
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('owl-workspace');
          if (stored) {
            const data: WorkspaceData = JSON.parse(stored);
            setCards(data.cards || []);
          }
        }
        return;
      }

      const cardsData = await workspaceDB.getAll<WorkspaceCard>('cards');
      setCards(cardsData || []);
    } catch (error) {
      console.error('❌ Veriler yüklenemedi:', error);
      setCards([]);
    }
  }, [isIndexedDBReady]);

  // Save workspace to IndexedDB
  const saveWorkspace = useCallback(async (newCards: WorkspaceCard[]) => {
    try {
      if (!isIndexedDBReady) {
        // Fallback to localStorage if IndexedDB not ready
        if (typeof window !== 'undefined') {
          const data: WorkspaceData = {
            cards: newCards,
            version: CURRENT_VERSION,
            lastModified: Date.now(),
          };
          localStorage.setItem('owl-workspace', JSON.stringify(data));
        }
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

  // Add a new card
  const addCard = useCallback(async (card: WorkspaceCard) => {
    setCards(prev => {
      const newCards = [...prev, card];
      saveWorkspace(newCards);
      return newCards;
    });
    console.log('➕ Yeni kart eklendi:', card.title);
  }, [saveWorkspace]);

  // Update an existing card
  const updateCard = useCallback(async (cardId: string, updates: Partial<WorkspaceCard>) => {
    setCards(prev => {
      const newCards = prev.map(card => 
        card.id === cardId ? { ...card, ...updates } : card
      );
      saveWorkspace(newCards);
      return newCards;
    });
  }, [saveWorkspace]);

  // Delete a card
  const deleteCard = useCallback(async (cardId: string) => {
    const cardToDelete = cards.find(card => card.id === cardId);
    
    // Remove from state
    setCards(prev => {
      const newCards = prev.filter(card => card.id !== cardId);
      return newCards;
    });

    // Delete from IndexedDB
    try {
      if (isIndexedDBReady) {
        await workspaceDB.delete('cards', cardId);
        console.log('🗑️ Kart silindi:', cardToDelete?.title);
      } else if (typeof window !== 'undefined') {
        // Fallback to localStorage
        const stored = localStorage.getItem('owl-workspace');
        if (stored) {
          const data: WorkspaceData = JSON.parse(stored);
          const updatedCards = data.cards.filter(card => card.id !== cardId);
          const updatedData = {
            ...data,
            cards: updatedCards,
            lastModified: Date.now()
          };
          localStorage.setItem('owl-workspace', JSON.stringify(updatedData));
          console.log('🗑️ Kart silindi:', cardToDelete?.title);
        }
      }
    } catch (error) {
      console.error('❌ Kart silme hatası:', error);
    }
  }, [isIndexedDBReady, cards]);

  // Clear all cards
  const clearWorkspace = useCallback(async () => {
    setCards([]);
    try {
      if (isIndexedDBReady) {
        await workspaceDB.clear('cards');
        await workspaceDB.clear('workspace');
      } else if (typeof window !== 'undefined') {
        localStorage.removeItem('owl-workspace');
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
      saveWorkspace(newCards);
      return newCards;
    });
  }, [saveWorkspace]);

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
        note: cards.filter(c => c.type === 'note').length,
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
    await updateCard(cardId, {
      richContent: {
        markdown: content,
        html: '', // Will be converted by the component
        versionHistory: [
          ...(cards.find(c => c.id === cardId)?.richContent?.versionHistory || []),
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

  // Initialize DB and load workspace on mount
  useEffect(() => {
    const initAndLoad = async () => {
      await initializeDB();
      await loadWorkspace();
    };
    initAndLoad();
  }, [initializeDB, loadWorkspace]);

  return {
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
    // Rich Note functions
    saveRichNoteVersion,
    // Pomodoro functions
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    // Task Board functions
    addTask,
    moveTask,
  };
}
