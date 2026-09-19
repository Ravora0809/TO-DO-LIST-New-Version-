import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Repeat,
  Bell,
  Trash2,
  Edit2,
  Tag,
  Flag,
  GripVertical,
  Check,
  ChevronDown,
  Sparkles,
  Timer,
  Play,
  History,
  CheckSquare,
} from 'lucide-react';
import { Task, Priority, TaskFilterOptions } from '../../types';
import { parseNaturalTaskInput } from '../../services/nlp';
import { DayByDayHistoryView } from './DayByDayHistoryView';

interface TasksViewProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onQuickAddTask: (title: string) => void;
  onReorderTasks: (reorderedTasks: Task[]) => void;
  onOpenNewTaskModal: () => void;
  onStartStopwatch?: (task: Task) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onQuickAddTask,
  onReorderTasks,
  onOpenNewTaskModal,
  onStartStopwatch,
}) => {
  const [viewMode, setViewMode] = useState<'tasks' | 'day_by_day_history'>('tasks');
  const [quickInput, setQuickInput] = useState('');
  const [filters, setFilters] = useState<TaskFilterOptions>({
    status: 'all',
    priority: 'all',
    category: 'all',
    scheduled: 'all',
    searchQuery: '',
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Natural Language dynamic preview tokens as user types
  const parsedPreview = useMemo(() => {
    if (!quickInput.trim() || quickInput.trim().length < 3) return null;
    const p = parseNaturalTaskInput(quickInput);
    const hasAnyTag = Boolean(p.date || p.startTime || p.priority || p.category || p.recurring);
    if (!hasAnyTag) return null;
    return p;
  }, [quickInput]);

  // Extract all distinct categories
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        const matchCat = task.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      // Status
      if (filters.status === 'today') {
        if (task.date !== todayStr) return false;
      } else if (filters.status === 'upcoming') {
        if (!task.date || task.date <= todayStr || task.completed) return false;
      } else if (filters.status === 'completed') {
        if (!task.completed) return false;
      } else if (filters.status === 'overdue') {
        if (task.completed || !task.date || task.date >= todayStr) return false;
      }

      // Priority
      if (filters.priority !== 'all') {
        if (task.priority !== filters.priority) return false;
      }

      // Category
      if (filters.category !== 'all') {
        if (task.category !== filters.category) return false;
      }

      // Scheduled
      if (filters.scheduled === 'scheduled') {
        if (!task.date && !task.startTime) return false;
      } else if (filters.scheduled === 'unscheduled') {
        if (task.date || task.startTime) return false;
      }

      return true;
    });
  }, [tasks, filters, todayStr]);

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickAddTask(quickInput.trim());
    setQuickInput('');
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newItems = [...filteredTasks];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    onReorderTasks(newItems);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'high':
        return <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">High</span>;
      case 'medium':
        return <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">Medium</span>;
      case 'low':
        return <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">Low</span>;
    }
  };

  const getDateBadge = (taskDate?: string, completed?: boolean) => {
    if (!taskDate) return null;
    const isOverdue = !completed && taskDate < todayStr;
    const isToday = taskDate === todayStr;

    return (
      <span
        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium ${
          isOverdue
            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold'
            : isToday
            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-semibold'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
        }`}
      >
        <Calendar className="w-3 h-3" />
        <span>{isToday ? 'Today' : isOverdue ? `Overdue (${taskDate})` : taskDate}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* View Mode Toggle: Tasks vs Day-by-Day History */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
          <button
            type="button"
            onClick={() => setViewMode('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'tasks'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
            <span>Active Tasks</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('day_by_day_history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'day_by_day_history'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-500" />
            <span>Day-by-Day History</span>
          </button>
        </div>
      </div>

      {viewMode === 'day_by_day_history' ? (
        <DayByDayHistoryView
          tasks={tasks}
          onToggleTask={onToggleTask}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onNavigateToTasks={() => setViewMode('tasks')}
        />
      ) : (
        <>
          {/* Quick Add Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
        <form onSubmit={handleQuickAddSubmit} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                id="quick-add-task-input"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="+ Add Task → type (e.g. Call client tomorrow at 2pm #Work !high) → Enter"
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/70 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
              />
              <button
                type="button"
                onClick={onOpenNewTaskModal}
                title="Open detailed task form"
                className="absolute right-2 top-2 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              id="quick-add-submit-btn"
              disabled={!quickInput.trim()}
              className="px-4 py-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-medium text-sm disabled:opacity-40 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition cursor-pointer shrink-0"
            >
              Add
            </button>
          </div>

          {/* Natural language auto-detected tokens preview */}
          {parsedPreview && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-neutral-500 animate-in fade-in duration-150">
              <span className="flex items-center gap-1 text-[11px] font-medium text-neutral-400">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Detected:
              </span>
              {parsedPreview.date && (
                <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                  📅 {parsedPreview.date}
                </span>
              )}
              {parsedPreview.startTime && (
                <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono font-medium">
                  ⏰ {parsedPreview.startTime}
                </span>
              )}
              {parsedPreview.category && (
                <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                  🏷️ {parsedPreview.category}
                </span>
              )}
              {parsedPreview.priority && (
                <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium capitalize">
                  ⚡ {parsedPreview.priority}
                </span>
              )}
              {parsedPreview.recurring && (
                <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                  🔁 {parsedPreview.recurring.type}
                </span>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'today', 'upcoming', 'overdue', 'completed'] as TaskFilterOptions['status'][]).map((st) => {
            const isSel = filters.status === st;
            return (
              <button
                key={st}
                onClick={() => setFilters({ ...filters, status: st })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition cursor-pointer ${
                  isSel
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Dropdowns & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value as any })}
            className="px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Scheduled Filter */}
          <select
            value={filters.scheduled}
            onChange={(e) => setFilters({ ...filters, scheduled: e.target.value as any })}
            className="px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Schedules</option>
            <option value="scheduled">Scheduled Only</option>
            <option value="unscheduled">Unscheduled Only</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 p-6">
            <CheckCircle2 className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
            <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              {tasks.length === 0 ? 'Workspace is neutral & clean' : 'No tasks found'}
            </h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              {tasks.length === 0
                ? 'All tasks are zero. Add your first task using the input above or press "N" anytime.'
                : 'No tasks match your current filters. Clear filters or add a new task above.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task, index) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition group cursor-grab active:cursor-grabbing ${
                task.completed
                  ? 'bg-neutral-50/70 dark:bg-neutral-900/40 border-neutral-200/50 dark:border-neutral-800/40 opacity-65'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs'
              }`}
            >
              {/* Left Drag & Checkbox */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-neutral-300 dark:text-neutral-700 hover:text-neutral-500 cursor-grab shrink-0">
                  <GripVertical className="w-4 h-4" />
                </span>

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

                {/* Content */}
                <div
                  onClick={() => onEditTask(task)}
                  className="cursor-pointer min-w-0 flex-1 pr-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-medium ${
                        task.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                    {getPriorityBadge(task.priority)}
                  </div>

                  {task.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                      {task.description}
                    </p>
                  )}

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-2.5 mt-2 flex-wrap text-xs text-neutral-400">
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium">
                      {task.category}
                    </span>

                    {getDateBadge(task.date, task.completed)}

                    {task.startTime && (
                      <span className="flex items-center gap-1 font-mono text-neutral-600 dark:text-neutral-400">
                        <Clock className="w-3 h-3" />
                        {task.startTime} {task.endTime ? `– ${task.endTime}` : ''}
                      </span>
                    )}

                    {task.recurring && (
                      <span className="flex items-center gap-1 text-neutral-500 capitalize" title={`Repeats ${task.recurring.type}`}>
                        <Repeat className="w-3 h-3" />
                        {task.recurring.type}
                      </span>
                    )}

                    {task.reminder && (
                      <span className="flex items-center gap-1 text-neutral-500" title="Reminder set">
                        <Bell className="w-3 h-3 text-amber-500" />
                      </span>
                    )}

                    {task.subtasks.length > 0 && (
                      <span className="text-neutral-500">
                        {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                      </span>
                    )}

                    {task.timeSpentSeconds && (
                      <span className="flex items-center gap-1 font-mono font-semibold text-amber-600 dark:text-amber-400">
                        <Timer className="w-3 h-3" />
                        {Math.round(task.timeSpentSeconds / 60)}m focus
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {!task.completed && onStartStopwatch && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartStopwatch(task);
                    }}
                    title="Start Task Stopwatch"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold transition cursor-pointer border border-amber-500/20 shadow-xs"
                  >
                    <Play className="w-3 h-3 fill-current text-amber-600 dark:text-amber-400" />
                    <span className="hidden sm:inline">Focus</span>
                  </button>
                )}

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditTask(task)}
                    title="Edit"
                    className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    title="Delete"
                    className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
        </>
      )}
    </div>
  );
};
