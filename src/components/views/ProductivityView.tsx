import React, { useMemo } from 'react';
import {
  CheckCircle2,
  TrendingUp,
  Flame,
  Award,
  BarChart2,
  PieChart,
  Calendar,
  Layers,
} from 'lucide-react';
import { Task } from '../../types';

interface ProductivityViewProps {
  tasks: Task[];
}

export const ProductivityView: React.FC<ProductivityViewProps> = ({ tasks }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Last 7 days activity computation
  const last7Days = useMemo(() => {
    const days: Array<{ dateStr: string; label: string; completed: number; total: number }> = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      const label = d.toLocaleDateString([], { weekday: 'short' });

      // Count completed on that date
      const comp = tasks.filter(
        (t) => t.completed && (t.date === dateStr || (t.completedAt && t.completedAt.startsWith(dateStr)))
      ).length;

      const tot = tasks.filter((t) => t.date === dateStr).length;

      days.push({
        dateStr,
        label,
        completed: comp,
        total: tot,
      });
    }

    return days;
  }, [tasks]);

  const maxDailyCompleted = Math.max(...last7Days.map((d) => d.completed), 4);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();
    tasks.forEach((t) => {
      const current = map.get(t.category) || { total: 0, completed: 0 };
      current.total += 1;
      if (t.completed) current.completed += 1;
      map.set(t.category, current);
    });

    return Array.from(map.entries()).map(([cat, stat]) => ({
      category: cat,
      total: stat.total,
      completed: stat.completed,
      percent: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
    }));
  }, [tasks]);

  // Priority breakdown
  const priorityStats = useMemo(() => {
    const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
    return priorities.map((p) => {
      const pTasks = tasks.filter((t) => t.priority === p);
      const comp = pTasks.filter((t) => t.completed).length;
      return {
        priority: p,
        total: pTasks.length,
        completed: comp,
        percent: pTasks.length > 0 ? Math.round((comp / pTasks.length) * 100) : 0,
      };
    });
  }, [tasks]);

  // Productivity streak calculation
  const streakDays = useMemo(() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      const hasCompleted = tasks.some(
        (t) => t.completed && (t.date === dateStr || (t.completedAt && t.completedAt.startsWith(dateStr)))
      );
      if (hasCompleted) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [tasks]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion % */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <span>Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-neutral-900 dark:text-white">
              {completionRate}%
            </span>
          </div>
          <div className="mt-3 w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Completed count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <span>Completed Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-white" />
          </div>
          <div className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
            {completedTasks}
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            Out of {totalTasks} total tasks logged
          </p>
        </div>

        {/* Current Streak */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <span>Consistency Streak</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
            {streakDays} {streakDays === 1 ? 'day' : 'days'}
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            Consecutive productive days
          </p>
        </div>

        {/* Focus Score */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <span>Productivity Tier</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            {completionRate >= 80 ? 'Master' : completionRate >= 50 ? 'Achiever' : 'Builder'}
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            Based on execution velocity
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Progress Chart (Last 7 days) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                <span>Daily Completion Activity</span>
              </h3>
              <p className="text-xs text-neutral-400">Completed items over the past 7 days</p>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-56 flex items-end justify-between gap-3 pt-4 px-2">
            {last7Days.map((d) => {
              const heightPercent = Math.max(8, Math.round((d.completed / maxDailyCompleted) * 100));
              return (
                <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[11px] font-mono font-bold text-neutral-700 dark:text-neutral-300 opacity-0 group-hover:opacity-100 transition">
                    {d.completed}
                  </span>
                  <div className="w-full max-w-[40px] bg-neutral-100 dark:bg-neutral-800 rounded-t-lg h-full flex items-end overflow-hidden">
                    <div
                      className="w-full bg-neutral-900 dark:bg-white rounded-t-lg transition-all duration-500 group-hover:bg-neutral-700 dark:group-hover:bg-neutral-200"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-1">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                <span>Category Breakdown</span>
              </h3>
              <p className="text-xs text-neutral-400">Task distribution and completion rates</p>
            </div>
          </div>

          <div className="space-y-4">
            {categoryStats.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                No categorized tasks yet.
              </div>
            ) : (
              categoryStats.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-neutral-900 dark:text-white">{cat.category}</span>
                    <span className="text-neutral-400 font-mono">
                      {cat.completed}/{cat.total} ({cat.percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-neutral-900 dark:bg-white transition-all duration-500"
                      style={{ width: `${cat.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
        <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4" />
          <span>Priority Performance</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {priorityStats.map((p) => {
            const colors = {
              high: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50',
              medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50',
              low: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50',
            }[p.priority];

            return (
              <div
                key={p.priority}
                className={`p-4 rounded-xl border ${colors}`}
              >
                <div className="text-xs uppercase font-bold tracking-wider">{p.priority} Priority</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{p.percent}%</span>
                  <span className="text-xs opacity-75">
                    ({p.completed}/{p.total})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
