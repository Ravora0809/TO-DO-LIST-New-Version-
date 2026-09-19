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
  timeSpentSeconds?: number;
  estimatedMinutes?: number;
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
  | 'targets'
  | 'rules'
  | 'calendar'
  | 'planner'
  | 'notes'
  | 'whiteboard'
  | 'ideaplanner'
  | 'productivity'
  | 'settings';

// -------------------------------------------------------------
// Target & Goal Tracking Types
// -------------------------------------------------------------
export interface GoalStep {
  id: string;
  title: string;
  description?: string;
  targetDate?: string; // YYYY-MM-DD
  targetTime?: string; // HH:mm
  estimatedHours?: number;
  actualHoursSpent?: number;
  completed: boolean;
  completedAt?: string;
  order: number;
  notes?: string;
}

export interface GoalStickyNote {
  id: string;
  content: string;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';
  createdAt: string;
  pinned?: boolean;
}

export interface TargetGoal {
  id: string;
  title: string;
  tagline?: string;
  category: string; // 'Career' | 'Health' | 'Finance' | 'Learning' | 'Personal' | 'Project'
  priority: Priority;
  targetDate: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  steps: GoalStep[];
  stickyNotes: GoalStickyNote[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ActiveStopwatchState {
  taskId: string;
  taskTitle: string;
  taskCategory: string;
  mode: 'countdown' | 'stopwatch';
  targetSeconds: number; // e.g. 1500 for 25m
  elapsedSeconds: number;
  isRunning: boolean;
  warningTriggered?: boolean;
  completedTriggered?: boolean;
  startedAt: string;
  extendedTimes?: number;
  startTimestamp?: number; // Wall-clock timestamp in ms when current running segment started
  accumulatedSeconds?: number; // Base seconds elapsed accumulated prior to current running segment
}

export type RuleCategory = 'Focus & Time' | 'Execution & Quality' | 'Habits & Mindset' | 'Environment';

export interface WorkRule {
  id: string;
  title: string;
  description: string;
  category: RuleCategory;
  strictness: 'mandatory' | 'recommended' | 'best-practice';
  icon?: string;
  isCustom?: boolean;
  isActive: boolean;
  createdAt: string;
}

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
  readOutLoudReminders?: boolean;
  spokenReminderVoiceSpeed?: number;
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

// -------------------------------------------------------------
// Whiteboard Types
// -------------------------------------------------------------
export type WhiteboardElementType =
  | 'rectangle'
  | 'rounded-rect'
  | 'circle'
  | 'triangle'
  | 'polygon'
  | 'star'
  | 'diamond'
  | 'cylinder'
  | 'cloud'
  | 'sticky'
  | 'text'
  | 'arrow'
  | 'line'
  | 'draw'
  | 'marker'
  | 'image'
  | 'comment'
  | 'connector'
  | 'frame'
  | 'icon';

export interface Point {
  x: number;
  y: number;
}

export interface WhiteboardElement {
  id: string;
  type: WhiteboardElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // degrees 0-360
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number; // 0 to 1
  cornerRadius?: number;
  text?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  arrowStart?: 'none' | 'arrow' | 'dot';
  arrowEnd?: 'none' | 'arrow' | 'dot' | 'triangle';
  iconName?: string;
  iconCategory?: string;
  points?: Point[];
  imageSrc?: string;
  commentAuthor?: string;
  commentTime?: string;
  commentResolved?: boolean;
  locked?: boolean;
  hidden?: boolean;
  name?: string;
  groupId?: string;
  colorPreset?: string;
  zIndex: number;
}

export type WhiteboardTool =
  | 'select'
  | 'hand'
  | 'rectangle'
  | 'rounded-rect'
  | 'circle'
  | 'triangle'
  | 'polygon'
  | 'star'
  | 'diamond'
  | 'cylinder'
  | 'cloud'
  | 'arrow'
  | 'line'
  | 'draw'
  | 'marker'
  | 'text'
  | 'sticky'
  | 'image'
  | 'comment'
  | 'connector'
  | 'frame'
  | 'laser'
  | 'icon'
  | 'eraser';

export interface WhiteboardBoard {
  id: string;
  name: string;
  description?: string;
  elements: WhiteboardElement[];
  gridMode: 'dots' | 'lines' | 'none';
  snapToGrid?: boolean;
  gridSize?: number;
  showMinimap?: boolean;
  bgColor: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Idea Planner & Project Lifecycle Types (SRS to Prototype & Beyond)
// -------------------------------------------------------------
export type ProjectStageId =
  | 'srs'
  | 'architecture'
  | 'wireframe'
  | 'prototype'
  | 'development'
  | 'testing'
  | 'deployment';

export type StageStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface MilestoneItem {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
  dueDate?: string;
}

export interface ProjectStage {
  id: ProjectStageId;
  name: string;
  shortName: string;
  stepNumber: number;
  description: string;
  status: StageStatus;
  items: MilestoneItem[];
  notes: string;
  keyDeliverables?: string[];
}

export interface ProjectIdea {
  id: string;
  title: string;
  tagline: string;
  category: string;
  priority: Priority;
  targetDate?: string;
  problemStatement: string;
  targetAudience: string;
  currentStage: ProjectStageId;
  stages: ProjectStage[];
  whiteboardId?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Bug Fixing & Issue Notes Types
// -------------------------------------------------------------
export type BugSeverity = 'critical' | 'high' | 'medium' | 'low';
export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface ProjectBug {
  id: string;
  projectId: string; // Associated ProjectIdea id
  title: string;
  description: string;
  stageFound: ProjectStageId;
  severity: BugSeverity;
  status: BugStatus;
  stepsToReproduce?: string;
  rootCause?: string;
  fixNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

