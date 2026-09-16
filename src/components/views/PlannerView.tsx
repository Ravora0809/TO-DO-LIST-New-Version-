import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  GripVertical,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Task, Priority } from '../../types';

interface PlannerViewProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onUpdateTaskTime: (taskId: string, date: string, startTime: string) => void;
  onOpenNewTask: (initialDate?: string, initialTime?: string) => void;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  tasks,
  onToggleTask,
  onEditTask,
  onUpdateTaskTime,
  onOpenNewTask,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const selectedDateStr = useMemo(() => formatDate(currentDate), [currentDate]);
  const todayStr = useMemo(() => formatDate(new Date()), []);
  const isToday = selectedDateStr === todayStr;

  // Unscheduled tasks or tasks for today without a specific time
  const unassignedTasks = useMemo(() => {
    return tasks.filter(
      (t) => !t.completed && (!t.startTime || t.date !== selectedDateStr)
    );
  }, [tasks, selectedDateStr]);

  // Hours: 07:00 to 22:00
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnHour = (hour: number) => {
    if (!draggedTaskId) return;
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    onUpdateTaskTime(draggedTaskId, selectedDateStr, timeStr);
    setDraggedTaskId(null);
  };

  const getPriorityBorder = (p: Priority) => {
    switch (p) {
      case 'high':
        return 'border-rose-400 dark:border-rose-700 bg-rose-50/60 dark:bg-rose-950/20';
      case 'medium':
        return 'border-amber-400 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/20';
      case 'low':
        return 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/20';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Date Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3.5 py-1.5 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="ml-2">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <span>{currentDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {isToday && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-950">
                  Today
                </span>
              )}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenNewTask(selectedDateStr, '09:00')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Timeline</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Timeline on left, Unscheduled Tasks drawer on right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Timeline (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs p-4 sm:p-6">
          <div className="space-y-3 relative">
            {hours.map((hour) => {
              const hourStr = `${String(hour).padStart(2, '0')}:00`;
              const hourTasks = tasks.filter(
                (t) =>
                  t.date === selectedDateStr &&
                  t.startTime &&
                  parseInt(t.startTime.split(':')[0]) === hour
              );

              return (
                <div
                  key={hour}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDropOnHour(hour)}
                  className="flex items-start gap-3 sm:gap-4 p-2 rounded-xl transition border border-dashed border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 group min-h-[72px]"
                >
                  {/* Hour label */}
                  <div className="w-16 shrink-0 pt-1 text-right pr-2">
                    <span className="font-mono text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                      {hourStr}
                    </span>
                  </div>

                  {/* Slot content */}
                  <div className="flex-1 flex flex-col sm:flex-row flex-wrap gap-2.5 min-w-0">
                    {hourTasks.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => onOpenNewTask(selectedDateStr, hourStr)}
                        className="w-full text-left py-2 px-3 text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add task at {hourStr} or drop task here</span>
                      </button>
                    ) : (
                      hourTasks.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            handleDragStart(e, task.id);
                          }}
                          className={`flex-1 min-w-[240px] p-3 rounded-xl border shadow-2xs cursor-grab active:cursor-grabbing transition hover:shadow-xs flex items-center justify-between gap-3 ${getPriorityBorder(
                            task.priority
                          )} ${task.completed ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              onClick={() => onToggleTask(task.id)}
                              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white shrink-0 cursor-pointer"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>

                            <div
                              onClick={() => onEditTask(task)}
                              className="cursor-pointer min-w-0 flex-1"
                            >
                              <div
                                className={`text-xs font-semibold truncate ${
                                  task.completed ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-white'
                                }`}
                              >
                                {task.title}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                                <span className="font-mono">
                                  {task.startTime} {task.endTime ? `– ${task.endTime}` : ''}
                                </span>
                                <span>•</span>
                                <span>{task.category}</span>
                              </div>
                            </div>
                          </div>

                          <span className="text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 cursor-grab">
                            <GripVertical className="w-4 h-4" />
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unassigned / Drag-to-Schedule Sidebar (1 col) */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Task Pool</h3>
              <p className="text-[11px] text-neutral-400">Drag into timeline slots</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              {unassignedTasks.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {unassignedTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                All tasks are scheduled!
              </div>
            ) : (
              unassignedTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => onEditTask(task)}
                  className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/50 hover:bg-neutral-100/80 dark:hover:bg-neutral-800 transition cursor-grab active:cursor-grabbing shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                      {task.title}
                    </span>
                    <GripVertical className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-neutral-500">
                    <span className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                      {task.category}
                    </span>
                    {task.date && (
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        {task.date}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
