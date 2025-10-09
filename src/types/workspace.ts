/**
 * Workspace System Type Definitions
 * Extracted from useWorkspaceStore.ts for better modularity
 */

export interface WorkspaceCard {
  id: string;
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
        frequency: "daily" | "weekly" | "monthly";
        interval: number;
        endDate?: Date;
      };
    }>;
    view: "month" | "week" | "day";
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
        priority: "low" | "medium" | "high" | "urgent";
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

export interface WorkspaceData {
  cards: WorkspaceCard[];
  version: string;
  lastModified: number;
}

export interface WorkspaceStoreValue {
  cards: WorkspaceCard[];
  isLoading: boolean;
  isIndexedDBReady: boolean;
  addCard: (card: WorkspaceCard) => Promise<void>;
  updateCard: (
    cardId: string,
    updates: Partial<WorkspaceCard>,
  ) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  clearWorkspace: () => Promise<void>;
  bringToFront: (cardId: string) => Promise<void>;
  loadWorkspace: () => Promise<void>;
  exportWorkspace: () => string;
  importWorkspace: (jsonData: string) => Promise<boolean>;
  getStats: () => any;
  saveRichNoteVersion: (
    cardId: string,
    content: string,
    author?: string,
  ) => Promise<void>;
  startPomodoro: (cardId: string) => Promise<void>;
  pausePomodoro: (cardId: string) => Promise<void>;
  resetPomodoro: (cardId: string) => Promise<void>;
  addTask: (
    cardId: string,
    columnId: string,
    task: {
      title: string;
      description?: string;
      priority?: "low" | "medium" | "high" | "urgent";
      dueDate?: Date;
    },
  ) => Promise<void>;
  moveTask: (
    cardId: string,
    taskId: string,
    fromColumnId: string,
    toColumnId: string,
  ) => Promise<void>;
  getAllFlashcards: (cardId?: string) => Promise<any[]>;
  saveFlashcard: (flashcard: any) => Promise<void>;
  deleteFlashcard: (flashcardId: string) => Promise<void>;
  getFlashcardStats: () => Promise<any | null>;
  saveFlashcardStats: (stats: any) => Promise<void>;
  saveStudySession: (session: any) => Promise<void>;
  getStudySessions: () => Promise<any[]>;
  // Connections API
  connections: any[];
  // Grouping/locking
  lockedGroups: Record<string, string[]>;
  lockedGroupOffsets: Record<
    string,
    Record<string, { dx: number; dy: number }>
  >;
  toggleLockGroup: (cardIds: string[]) => Promise<string>;
  unlinkGroup: (groupId: string) => Promise<void>;
  addConnection: (conn: any) => Promise<void>;
  removeConnection: (connectionId: string) => Promise<void>;
  clearConnectionsForCard: (cardId: string) => Promise<void>;
  removeConnectionsAt: (cardId: string, anchor: any) => Promise<void>;
  // Linking flow state
  linking: {
    isActive: boolean;
    sourceCardId?: string;
    sourceAnchor?: any;
    cursor?: { x: number; y: number };
  };
  startLinking: (sourceCardId: string, sourceAnchor: any) => void;
  updateLinkCursor: (pos: { x: number; y: number }) => void;
  cancelLinking: () => void;
  completeLinking: (
    targetCardId: string,
    targetAnchor: any,
  ) => Promise<boolean>;
}

export const CURRENT_VERSION = "2.0.0"; // IndexedDB version
