import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Plus,
  StickyNote as StickyNoteIcon,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Mic,
  Palette,
  FolderKanban,
  Bug,
  Timer,
  Play,
  Target,
  Smartphone,
  Download,
} from 'lucide-react';
import { Task, StickyNote, ViewType } from '../../types';
import { PWAInstallModal } from '../PWAInstallModal';

interface DashboardViewProps {
  tasks: Task[];
  notes: StickyNote[];
  username: string;
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onOpenNewTask: (initialDate?: string) => void;
  onEditNote: (note: StickyNote) => void;
  onOpenNewNote: () => void;
  onNavigate: (view: ViewType) => void;
  onOpenVoiceAssistant?: () => void;
  onStartStopwatch?: (task: Task) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  notes,
  username,
  onToggleTask,
  onEditTask,
  onOpenNewTask,
  onEditNote,
  onOpenNewNote,
  onNavigate,
  onOpenVoiceAssistant,
  onStartStopwatch,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`;

  // Time greeting
  const hour = currentTime.getHours();
  let greeting = 'Good morning';
  if (hour >= 5 && hour < 12) {
    greeting = 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
  } else if (hour >= 17 && hour < 21) {
    greeting = 'Good evening';
  } else {
    greeting = 'Good night';
  }

  // Stats calculation
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedTodayCount = todayTasks.filter((t) => t.completed).length;
  const pendingTodayCount = todayTasks.filter((t) => !t.completed).length;

  const overdueTasks = tasks.filter((t) => !t.completed && t.date && t.date < todayStr);
  const upcomingTasks = tasks.filter((t) => !t.completed && t.date && t.date > todayStr).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const allCompleted = tasks.filter((t) => t.completed).length;
  const todayProgressPercent = todayTasks.length > 0 ? Math.round((completedTodayCount / todayTasks.length) * 100) : 0;

  // Scheduled tasks for today's timeline preview
  const scheduledToday = todayTasks
    .filter((t) => t.startTime)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  // Active pinned notes
  const activeNotes = notes.filter((n) => !n.archived).slice(0, 3);

  const getPriorityBadge = (p: Task['priority']) => {
    switch (p) {
      case 'high':
        return <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="High Priority" />;
      case 'medium':
        return <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Medium Priority" />;
      case 'low':
        return <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Low Priority" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Greeting & Live Clock Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Daily Briefing</span>
            </div>
            {onOpenVoiceAssistant && (
              <button
                type="button"
                onClick={onOpenVoiceAssistant}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
                title="Talk to Voice Assistant"
              >
                <Mic className="w-3 h-3 text-rose-500 animate-pulse" />
                <span>Voice Assistant</span>
              </button>
            )}
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {greeting}, {username}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            {todayTasks.length === 0
              ? 'No tasks scheduled for today. Ready to plan your day?'
              : pendingTodayCount === 0
              ? '🎉 All tasks for today are completed! Great job!'
              : `You have ${pendingTodayCount} task${pendingTodayCount === 1 ? '' : 's'} remaining for today.`}
          </p>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100 dark:border-neutral-800">
          <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-neutral-900 dark:text-white">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Mobile App (Android APK) & Mac Desktop App Quick Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-sky-500/10 dark:from-amber-950/40 dark:via-neutral-900 dark:to-sky-950/30 border border-amber-300/60 dark:border-amber-700/50 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                Download as Mobile App (Android APK) & Mac Desktop App
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                100% Offline Standalone
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              Install native WebAPK on Android, download raw .APK file via PWABuilder, or run as a standalone Mac .app with Dock integration.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAppModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-semibold hover:opacity-90 transition cursor-pointer shrink-0 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Get App / APK</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Today's Progress */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Today's Progress</span>
            <TrendingUp className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
              {todayProgressPercent}%
            </span>
            <span className="text-xs text-neutral-400">
              ({completedTodayCount}/{todayTasks.length})
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-neutral-900 dark:bg-white transition-all duration-500 ease-out"
              style={{ width: `${todayProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Completed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
            {completedTodayCount}
          </div>
          <div className="mt-2 text-xs text-neutral-400">
            {allCompleted} all-time completed
          </div>
        </div>

        {/* Pending */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Pending Tasks</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
            {pendingTodayCount}
          </div>
          <div className="mt-2 text-xs text-neutral-400">
            Due before midnight
          </div>
        </div>

        {/* Overdue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Overdue</span>
            <AlertTriangle className={`w-4 h-4 ${overdueTasks.length > 0 ? 'text-rose-500' : 'text-neutral-400'}`} />
          </div>
          <div className={`mt-2 text-2xl sm:text-3xl font-bold ${overdueTasks.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-900 dark:text-white'}`}>
            {overdueTasks.length}
          </div>
          <div className="mt-2 text-xs text-neutral-400">
            {overdueTasks.length > 0 ? 'Action required' : 'Clear & on schedule'}
          </div>
        </div>
      </div>

      {/* Ideation & Project Lifecycle Quick Access Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('targets')}
          className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-950/40 dark:via-neutral-900 border border-indigo-200/70 dark:border-indigo-900/50 shadow-xs cursor-pointer hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Targets & Goals
                </h4>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Step Timing
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                Sequential milestone steps, timing deadlines, active progress beacon, and goal sticky notes.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all mt-1" />
        </div>

        <div
          onClick={() => onNavigate('whiteboard')}
          className="p-5 rounded-2xl bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent dark:from-sky-950/40 dark:via-neutral-900 border border-sky-200/70 dark:border-sky-900/50 shadow-xs cursor-pointer hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Ideation Whiteboard
                </h4>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  Shapes & Icons
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                Design system architectures, UI wireframes, flowcharts, and brainstorm on an infinite canvas.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all mt-1" />
        </div>

        <div
          onClick={() => onNavigate('ideaplanner')}
          className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-neutral-900 border border-amber-200/70 dark:border-amber-900/50 shadow-xs cursor-pointer hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Idea Planner & Bug Notes
                </h4>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  SRS to Prototype
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                Track status from requirements through prototype validation, with root-cause bug notes.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all mt-1" />
        </div>
      </div>

      {/* Main Grid: Today's Tasks & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Today's Tasks & Quick Add */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-neutral-900 dark:text-white" />
                <h3 className="font-semibold text-neutral-900 dark:text-white">Today's Focus</h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  {todayTasks.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenNewTask(todayStr)}
                  className="flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white cursor-pointer px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-0.5 cursor-pointer ml-1"
                >
                  <span>View all</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            {todayTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                No tasks due today. Hit <kbd className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">N</kbd> or click "+ Add Task" to plan something!
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition group ${
                      task.completed
                        ? 'bg-neutral-50/60 dark:bg-neutral-900/40 border-neutral-200/50 dark:border-neutral-800/40 opacity-70'
                        : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white shrink-0 cursor-pointer transition"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950" />
                        ) : (
                          <Circle className="w-5 h-5 text-neutral-300 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-white" />
                        )}
                      </button>

                      {getPriorityBadge(task.priority)}

                      <div
                        onClick={() => onEditTask(task)}
                        className="cursor-pointer min-w-0 flex-1 truncate"
                      >
                        <div
                          className={`text-sm font-medium truncate ${
                            task.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
                          <span>{task.category}</span>
                          {task.startTime && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                {task.startTime}
                              </span>
                            </>
                          )}
                          {task.subtasks.length > 0 && (
                            <>
                              <span>•</span>
                              <span>
                                {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!task.completed && onStartStopwatch && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartStopwatch(task);
                          }}
                          title="Start Focus Stopwatch"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold transition cursor-pointer border border-amber-500/20"
                        >
                          <Play className="w-3 h-3 fill-current text-amber-600 dark:text-amber-400" />
                          <span className="hidden sm:inline">Focus</span>
                        </button>
                      )}

                      <button
                        onClick={() => onEditTask(task)}
                        className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Tasks Preview */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-neutral-900 dark:text-white" />
                <h3 className="font-semibold text-neutral-900 dark:text-white">Upcoming Horizon</h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  {upcomingTasks.length}
                </span>
              </div>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-0.5 cursor-pointer"
              >
                <span>Full Calendar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                No upcoming scheduled tasks.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {upcomingTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/80 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {task.date}
                      </span>
                      {task.startTime && <span className="font-mono">{task.startTime}</span>}
                    </div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                      {task.title}
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-400">
                      {task.category} • {task.priority} priority
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right col: Today's Schedule & Sticky Notes */}
        <div className="space-y-6">
          {/* Today's Schedule Timeline Preview */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-neutral-900 dark:text-white" />
                <h3 className="font-semibold text-neutral-900 dark:text-white">Today's Schedule</h3>
              </div>
              <button
                onClick={() => onNavigate('planner')}
                className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-0.5 cursor-pointer"
              >
                <span>Time Planner</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {scheduledToday.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                No time-blocked tasks for today.
              </div>
            ) : (
              <div className="space-y-2 relative before:absolute before:top-2 before:bottom-2 before:left-3.5 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
                {scheduledToday.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    className="relative flex items-start gap-3 pl-7 py-1 cursor-pointer group"
                  >
                    <span className="absolute left-2.5 top-2 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-neutral-900 bg-neutral-900 dark:bg-white" />
                    <div className="flex-1 p-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-800/50 group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800 transition">
                      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                        <span>{task.startTime} {task.endTime ? `– ${task.endTime}` : ''}</span>
                        <span className="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                          {task.category}
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {task.title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky Notes Quick Widget */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <StickyNoteIcon className="w-5 h-5 text-neutral-900 dark:text-white" />
                <h3 className="font-semibold text-neutral-900 dark:text-white">Quick Notes</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenNewNote}
                  className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  title="New Note"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('notes')}
                  className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Board</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {activeNotes.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                No active sticky notes.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeNotes.map((note) => {
                  const colorStyles: Record<string, string> = {
                    yellow: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50',
                    pink: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50',
                    blue: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/50',
                    green: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50',
                    orange: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/50',
                    purple: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50',
                  };
                  return (
                    <div
                      key={note.id}
                      onClick={() => onEditNote(note)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer hover:shadow-sm ${
                        colorStyles[note.color] || colorStyles.yellow
                      }`}
                    >
                      <div className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                        {note.title}
                      </div>
                      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* App & APK Download Hub Modal */}
      <PWAInstallModal isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} />
    </div>
  );
};
