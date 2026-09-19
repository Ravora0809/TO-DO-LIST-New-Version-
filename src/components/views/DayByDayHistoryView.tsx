import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Tag,
  Filter,
  Search,
  Timer,
  Layers,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { Task } from '../../types';

interface DayByDayHistoryViewProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onNavigateToTasks?: () => void;
}

export const DayByDayHistoryView: React.FC<DayByDayHistoryViewProps> = ({
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onNavigateToTasks,
}) => {
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Currently viewed date in YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract all completed tasks across history
  const allCompletedTasks = useMemo(() => {
    return tasks.filter((t) => t.completed);
  }, [tasks]);

  // Map dates to completed count for date pill strip
  const dateToCompletedCount = useMemo(() => {
    const map = new Map<string, number>();
    allCompletedTasks.forEach((t) => {
      // Determine task's completion date
      let dateKey = t.date || todayStr;
      if (t.completedAt) {
        dateKey = t.completedAt.slice(0, 10);
      }
      map.set(dateKey, (map.get(dateKey) || 0) + 1);
    });
    return map;
  }, [allCompletedTasks, todayStr]);

  // Generate 14-day history strip (from today back 13 days)
  const recentDaysStrip = useMemo(() => {
    const list: Array<{ dateStr: string; dayNum: string; dayName: string; count: number; isToday: boolean }> = [];
    const base = new Date();

    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      list.push({
        dateStr,
        dayNum: String(d.getDate()),
        dayName: d.toLocaleDateString([], { weekday: 'short' }),
        count: dateToCompletedCount.get(dateStr) || 0,
        isToday: dateStr === todayStr,
      });
    }

    return list.reverse(); // oldest to newest (today at right)
  }, [dateToCompletedCount, todayStr]);

  // Tasks completed on the selectedDate
  const completedForSelectedDate = useMemo(() => {
    return allCompletedTasks.filter((t) => {
      let dateKey = t.date || todayStr;
      if (t.completedAt) {
        dateKey = t.completedAt.slice(0, 10);
      }
      return dateKey === selectedDate;
    });
  }, [allCompletedTasks, selectedDate, todayStr]);

  // Filtered tasks for selected date (search & category)
  const filteredDailyTasks = useMemo(() => {
    return completedForSelectedDate.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }
      if (selectedCategory !== 'all' && t.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [completedForSelectedDate, searchQuery, selectedCategory]);

  // Daily statistics for selected day
  const totalSecondsLoggedOnDay = useMemo(() => {
    return completedForSelectedDate.reduce((acc, t) => acc + (t.timeSpentSeconds || 0), 0);
  }, [completedForSelectedDate]);

  const totalSubtasksFinishedOnDay = useMemo(() => {
    return completedForSelectedDate.reduce((acc, t) => {
      return acc + (t.subtasks ? t.subtasks.filter((s) => s.completed).length : 0);
    }, 0);
  }, [completedForSelectedDate]);

  // Navigation handlers
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    const nextStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setSelectedDate(nextStr);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    const nextStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setSelectedDate(nextStr);
  };

  // Find nearest day with tasks
  const handleJumpToLatestActiveDay = () => {
    const sortedDates = Array.from(dateToCompletedCount.keys()).sort().reverse();
    if (sortedDates.length > 0) {
      setSelectedDate(sortedDates[0]);
    }
  };

  // Format date heading
  const formattedDateTitle = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const isToday = selectedDate === todayStr;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const isYesterday = selectedDate === yesterdayStr;

    const prefix = isToday ? 'Today, ' : isYesterday ? 'Yesterday, ' : '';
    const fullDate = date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return `${prefix}${fullDate}`;
  }, [selectedDate, todayStr]);

  const formatSeconds = (sec: number) => {
    const mins = Math.round(sec / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  const formatCompletionTime = (completedAt?: string) => {
    if (!completedAt) return null;
    try {
      const d = new Date(completedAt);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Day Navigation Bar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-500" />
              <span>Day-By-Day Task History</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">
              {formattedDateTitle}
            </h2>
          </div>

          {/* Stepper controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevDay}
              title="Previous day"
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Jump to date input */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white cursor-pointer focus:outline-none"
            />

            <button
              type="button"
              onClick={handleNextDay}
              title="Next day"
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {selectedDate !== todayStr && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="px-3 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold transition hover:bg-neutral-800 dark:hover:bg-neutral-100 cursor-pointer"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* 14-Day Visual Timeline Strip */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
            Quick Date Picker (Past 14 Days)
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {recentDaysStrip.map((item) => {
              const isSelected = item.dateStr === selectedDate;
              return (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`flex flex-col items-center justify-center min-w-[52px] py-2 px-1.5 rounded-2xl border transition cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white font-bold shadow-sm scale-105'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <span className="text-[10px] font-medium">{item.dayName}</span>
                  <span className="text-sm font-bold mt-0.5">{item.dayNum}</span>
                  <div className="mt-1 flex items-center gap-0.5 h-1.5">
                    {item.count > 0 ? (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected
                            ? 'bg-amber-400 dark:bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        title={`${item.count} tasks completed`}
                      />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full opacity-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completed Count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <span>Tasks Finished</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-neutral-900 dark:text-white">
            {completedForSelectedDate.length}
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Recorded for this day
          </p>
        </div>

        {/* Stopwatch / Focus Time Logged */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <span>Stopwatch Focus Time</span>
            <Timer className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-neutral-900 dark:text-white font-mono">
            {formatSeconds(totalSecondsLoggedOnDay)}
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Active timer duration
          </p>
        </div>

        {/* Subtasks Done */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <span>Subtasks Checked</span>
            <Layers className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-neutral-900 dark:text-white">
            {totalSubtasksFinishedOnDay}
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Step-by-step items done
          </p>
        </div>

        {/* All-time Completed Count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <span>All-Time Logged</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-neutral-900 dark:text-white">
            {allCompletedTasks.length}
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Across all history days
          </p>
        </div>
      </div>

      {/* Filter & Search Bar for This Day */}
      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder={`Search completed tasks for ${selectedDate}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            {Array.from(new Set(completedForSelectedDate.map((t) => t.category))).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List for the Selected Day */}
      <div className="space-y-3">
        {filteredDailyTasks.length === 0 ? (
          <div className="py-16 text-center rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 p-8 space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-700" />
            <h4 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
              No tasks completed on this day ({selectedDate})
            </h4>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              You did not log any finished tasks on this specific date, or none match your active filters.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              {allCompletedTasks.length > 0 && (
                <button
                  type="button"
                  onClick={handleJumpToLatestActiveDay}
                  className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold transition hover:bg-neutral-800 dark:hover:bg-neutral-100 cursor-pointer"
                >
                  Jump to Latest Active Day
                </button>
              )}
              {onNavigateToTasks && (
                <button
                  type="button"
                  onClick={onNavigateToTasks}
                  className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                >
                  View Active Tasks
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredDailyTasks.map((task) => {
            const compTime = formatCompletionTime(task.completedAt);
            const timeSpent = task.timeSpentSeconds ? formatSeconds(task.timeSpentSeconds) : null;

            return (
              <div
                key={task.id}
                className="p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition"
              >
                {/* Left content */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white dark:text-neutral-900" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white line-through opacity-85">
                        {task.title}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        {task.category}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-neutral-400">
                      {compTime && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <Clock className="w-3 h-3" />
                          Finished at {compTime}
                        </span>
                      )}

                      {timeSpent && (
                        <span className="flex items-center gap-1 font-mono font-bold text-amber-600 dark:text-amber-400">
                          <Timer className="w-3 h-3" />
                          {timeSpent} focus spent
                        </span>
                      )}

                      {task.subtasks.length > 0 && (
                        <span className="text-neutral-500">
                          {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks done
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Reopen/Undo Button */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    title="Reopen task (unmark complete)"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reopen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditTask(task)}
                    className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
