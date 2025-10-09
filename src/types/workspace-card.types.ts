export interface WorkspaceCardType {
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
  // Flashcard specific fields
  flashcardData?: {
    totalCards: number;
    cardsDue: number;
    studyStreak: number;
    averageAccuracy: number;
    categories: string[];
    lastStudyDate?: Date;
  };
  // Platform Content specific fields
  platformContentConfig?: {
    contentType:
      | "posts"
      | "communities"
      | "users"
      | "trending"
      | "following"
      | "discover";
    filters?: {
      subject?: string;
      communityId?: string;
      userId?: string;
      search?: string;
    };
    refreshInterval?: number;
    autoRefresh?: boolean;
  };
}

export interface WorkspaceCardProps {
  card: WorkspaceCardType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<WorkspaceCardType>) => void;
  onDelete: () => void;
  gridSnap: boolean;
  onHover?: (isHovering: boolean) => void;
  pan?: { x: number; y: number };
  zoom?: number;
}

export type CardType =
  | "platformContent"
  | "richNote"
  | "calendar"
  | "pomodoro"
  | "taskBoard"
  | "flashcards"
  | "rssFeed"
  | "owlSearch"
  | "spotify";
