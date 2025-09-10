'use client';

import { useState, useCallback, useEffect } from 'react';

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

const STORAGE_KEY = 'owl-workspace';
const CURRENT_VERSION = '1.0.0';

export function useWorkspaceStore() {
  const [cards, setCards] = useState<WorkspaceCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load workspace from localStorage
  const loadWorkspace = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: WorkspaceData = JSON.parse(stored);
        setCards(data.cards || []);
      }
    } catch (error) {
      console.error('Failed to load workspace:', error);
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save workspace to localStorage
  const saveWorkspace = useCallback((newCards: WorkspaceCard[]) => {
    try {
      if (typeof window === 'undefined') return;
      
      const data: WorkspaceData = {
        cards: newCards,
        version: CURRENT_VERSION,
        lastModified: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  }, []);

  // Add a new card
  const addCard = useCallback((card: WorkspaceCard) => {
    setCards(prev => {
      const newCards = [...prev, card];
      saveWorkspace(newCards);
      return newCards;
    });
  }, [saveWorkspace]);

  // Update an existing card
  const updateCard = useCallback((cardId: string, updates: Partial<WorkspaceCard>) => {
    setCards(prev => {
      const newCards = prev.map(card => 
        card.id === cardId ? { ...card, ...updates } : card
      );
      saveWorkspace(newCards);
      return newCards;
    });
  }, [saveWorkspace]);

  // Delete a card
  const deleteCard = useCallback((cardId: string) => {
    setCards(prev => {
      const newCards = prev.filter(card => card.id !== cardId);
      saveWorkspace(newCards);
      return newCards;
    });
  }, [saveWorkspace]);

  // Clear all cards
  const clearWorkspace = useCallback(() => {
    setCards([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Move card to front (increase z-index)
  const bringToFront = useCallback((cardId: string) => {
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
  const importWorkspace = useCallback((jsonData: string) => {
    try {
      const data: WorkspaceData = JSON.parse(jsonData);
      if (data.cards && Array.isArray(data.cards)) {
        setCards(data.cards);
        saveWorkspace(data.cards);
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
  const saveRichNoteVersion = useCallback((cardId: string, content: string, author?: string) => {
    updateCard(cardId, {
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
  const startPomodoro = useCallback((cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card?.pomodoroData) return;

    const workDuration = card.pomodoroData.workDuration * 60; // Convert to seconds
    updateCard(cardId, {
      pomodoroData: {
        ...card.pomodoroData,
        isRunning: true,
        timeLeft: workDuration,
        lastStartTime: Date.now(),
      }
    });
  }, [cards, updateCard]);

  const pausePomodoro = useCallback((cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card?.pomodoroData) return;

    updateCard(cardId, {
      pomodoroData: {
        ...card.pomodoroData,
        isRunning: false,
      }
    });
  }, [cards, updateCard]);

  const resetPomodoro = useCallback((cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card?.pomodoroData) return;

    const workDuration = card.pomodoroData.workDuration * 60;
    updateCard(cardId, {
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
  const addTask = useCallback((cardId: string, columnId: string, task: {
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

    updateCard(cardId, {
      taskBoardData: {
        ...card.taskBoardData,
        columns: updatedColumns,
      }
    });
  }, [cards, updateCard]);

  const moveTask = useCallback((cardId: string, taskId: string, fromColumnId: string, toColumnId: string) => {
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

    updateCard(cardId, {
      taskBoardData: {
        ...card.taskBoardData,
        columns: updatedColumns,
      }
    });
  }, [cards, updateCard]);

  // Load workspace on mount
  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  return {
    cards,
    isLoading,
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
