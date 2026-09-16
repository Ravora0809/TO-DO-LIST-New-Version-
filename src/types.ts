export type Priority = 'high' | 'medium' | 'low';

export type StandardCategory = 'Work' | 'Personal' | 'Study' | 'Health' | 'Finance';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ReminderConfig {
  type: 'at_time' | '5m' | '10m' | '30m' | 'custom';
  minutesBefore?: number;
  notified?: boolean;
}

export interface RecurringConfig {
  type: 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';
  interval?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  priority: Priority;
  category: string;
  date?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm (e.g. "09:00")
  endTime?: string; // HH:mm (e.g. "10:30")
  subtasks: Subtask[];
  reminder?: ReminderConfig;
  recurring?: RecurringConfig;
  order: number;
}

export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple';

export interface StickyNote {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  pinned: boolean;
  archived: boolean;
  attachedTaskId?: string;
  attachedDate?: string; // YYYY-MM-DD
  position: { x: number; y: number };
  size?: { width: number; height: number };
  createdAt: string;
  updatedAt: string;
}

export type ViewType =
  | 'dashboard'
  | 'tasks'
  | 'calendar'
  | 'planner'
  | 'notes'
  | 'productivity'
  | 'settings';

export type CalendarViewMode = 'month' | 'week' | 'day';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserSettings {
  theme: ThemeMode;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  defaultPriority: Priority;
  defaultCategory: string;
  startHour: number; // For time planner (e.g. 7)
  endHour: number;   // For time planner (e.g. 22)
  name: string;
  voiceAssistantEnabled: boolean;
  voiceMuted: boolean;
  autoGreetOnOpen: boolean;
}

export interface VoiceAssistantAction {
  type:
    | 'add_task'
    | 'open_view'
    | 'complete_task'
    | 'move_task'
    | 'delete_task'
    | 'delete_note'
    | 'query_tasks'
    | 'query_next'
    | 'query_overdue'
    | 'query_time_and_tasks'
    | 'query_time'
    | 'query_holidays'
    | 'add_note'
    | 'unknown';
  payload?: any;
  spokenResponse: string;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
}


export interface TaskFilterOptions {
  status: 'all' | 'today' | 'upcoming' | 'completed' | 'overdue';
  priority: 'all' | Priority;
  category: string; // 'all' or specific
  scheduled: 'all' | 'scheduled' | 'unscheduled';
  searchQuery: string;
}
