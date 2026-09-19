import React, { useState, useMemo } from 'react';
import {
  Target,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Flame,
  Plus,
  Trash2,
  Edit3,
  Pin,
  Sparkles,
  Timer,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
  StickyNote as StickyIcon,
  Award,
  Play,
  ArrowRight,
  X,
  Search,
  Filter,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TargetGoal, GoalStep, GoalStickyNote, Priority, Task } from '../../types';
import { loadGoals, saveGoals } from '../../services/goalStorage';
import { playCompleteSound } from '../../services/sound';

interface TargetGoalsViewProps {
  onStartStopwatch?: (task: Task) => void;
}

const CATEGORIES = ['All', 'Career', 'Learning', 'Health', 'Finance', 'Personal', 'Project'];
const NOTE_COLORS: Array<GoalStickyNote['color']> = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange'];

const COLOR_CLASSES: Record<GoalStickyNote['color'], { bg: string; border: string; text: string }> = {
  yellow: {
    bg: 'bg-amber-100/90 dark:bg-amber-950/40',
    border: 'border-amber-300 dark:border-amber-700/50',
    text: 'text-amber-900 dark:text-amber-200',
  },
  pink: {
    bg: 'bg-rose-100/90 dark:bg-rose-950/40',
    border: 'border-rose-300 dark:border-rose-700/50',
    text: 'text-rose-900 dark:text-rose-200',
  },
  blue: {
    bg: 'bg-sky-100/90 dark:bg-sky-950/40',
    border: 'border-sky-300 dark:border-sky-700/50',
    text: 'text-sky-900 dark:text-sky-200',
  },
  green: {
    bg: 'bg-emerald-100/90 dark:bg-emerald-950/40',
    border: 'border-emerald-300 dark:border-emerald-700/50',
    text: 'text-emerald-900 dark:text-emerald-200',
  },
  purple: {
    bg: 'bg-purple-100/90 dark:bg-purple-950/40',
    border: 'border-purple-300 dark:border-purple-700/50',
    text: 'text-purple-900 dark:text-purple-200',
  },
  orange: {
    bg: 'bg-orange-100/90 dark:bg-orange-950/40',
    border: 'border-orange-300 dark:border-orange-700/50',
    text: 'text-orange-900 dark:text-orange-200',
  },
};

export const TargetGoalsView: React.FC<TargetGoalsViewProps> = ({ onStartStopwatch }) => {
  const [goals, setGoals] = useState<TargetGoal[]>(() => loadGoals());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [expandedGoalIds, setExpandedGoalIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<TargetGoal | null>(null);

  // New Note state (inline on card)
  const [activeNewNoteGoalId, setActiveNewNoteGoalId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState<GoalStickyNote['color']>('yellow');

  // New Step inline state
  const [activeNewStepGoalId, setActiveNewStepGoalId] = useState<string | null>(null);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDate, setNewStepDate] = useState('');
  const [newStepHours, setNewStepHours] = useState('2');

  const updateAndSaveGoals = (updated: TargetGoal[]) => {
    setGoals(updated);
    saveGoals(updated);
  };

  // Toggle card expansion
  const toggleExpand = (goalId: string) => {
    setExpandedGoalIds((prev) => ({
      ...prev,
      [goalId]: !prev[goalId],
    }));
  };

  // Overall Statistics
  const stats = useMemo(() => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.status === 'completed').length;
    
    let totalSteps = 0;
    let completedSteps = 0;
    let totalEstimatedHours = 0;
    let totalActualHours = 0;

    goals.forEach((g) => {
      g.steps.forEach((s) => {
        totalSteps++;
        if (s.completed) completedSteps++;
        totalEstimatedHours += s.estimatedHours || 0;
        totalActualHours += s.actualHoursSpent || 0;
      });
    });

    const completionRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return {
      totalGoals,
      completedGoals,
      totalSteps,
      completedSteps,
      completionRate,
      totalEstimatedHours,
      totalActualHours,
    };
  }, [goals]);

  // Filtered Goals
  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      if (selectedCategory !== 'All' && goal.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus === 'in_progress' && goal.status === 'completed') {
        return false;
      }
      if (selectedStatus === 'completed' && goal.status !== 'completed') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = goal.title.toLowerCase().includes(q);
        const matchesTagline = goal.tagline?.toLowerCase().includes(q) || false;
        const matchesSteps = goal.steps.some(
          (s) => s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
        );
        const matchesNotes = goal.stickyNotes.some((n) => n.content.toLowerCase().includes(q));
        if (!matchesTitle && !matchesTagline && !matchesSteps && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [goals, selectedCategory, selectedStatus, searchQuery]);

  // Toggle step completion
  const handleToggleStep = (goalId: string, stepId: string) => {
    const updated = goals.map((goal) => {
      if (goal.id !== goalId) return goal;

      let allDone = true;
      const updatedSteps = goal.steps.map((step) => {
        if (step.id === stepId) {
          const nextCompleted = !step.completed;
          if (nextCompleted) {
            playCompleteSound(true);
            try {
              confetti({
                particleCount: 35,
                spread: 50,
                origin: { y: 0.8 },
                colors: ['#10b981', '#6366f1', '#f59e0b'],
              });
            } catch {
              // ignore
            }
          }
          if (!nextCompleted) allDone = false;
          return {
            ...step,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        if (!step.completed) allDone = false;
        return step;
      });

      const nextStatus = allDone ? 'completed' : 'in_progress';
      return {
        ...goal,
        steps: updatedSteps,
        status: nextStatus,
        completedAt: allDone ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };
    });

    updateAndSaveGoals(updated);
  };

  // Add Step inline
  const handleAddStep = (goalId: string) => {
    if (!newStepTitle.trim()) return;

    const updated = goals.map((goal) => {
      if (goal.id !== goalId) return goal;

      const newStep: GoalStep = {
        id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: newStepTitle.trim(),
        targetDate: newStepDate || undefined,
        estimatedHours: Number(newStepHours) || 2,
        actualHoursSpent: 0,
        completed: false,
        order: goal.steps.length + 1,
      };

      return {
        ...goal,
        steps: [...goal.steps, newStep],
        updatedAt: new Date().toISOString(),
      };
    });

    updateAndSaveGoals(updated);
    setNewStepTitle('');
    setNewStepDate('');
    setNewStepHours('2');
    setActiveNewStepGoalId(null);
  };

  // Delete Step
  const handleDeleteStep = (goalId: string, stepId: string) => {
    const updated = goals.map((goal) => {
      if (goal.id !== goalId) return goal;
      return {
        ...goal,
        steps: goal.steps.filter((s) => s.id !== stepId),
        updatedAt: new Date().toISOString(),
      };
    });
    updateAndSaveGoals(updated);
  };

  // Add Sticky Note
  const handleAddStickyNote = (goalId: string) => {
    if (!newNoteContent.trim()) return;

    const updated = goals.map((goal) => {
      if (goal.id !== goalId) return goal;

      const newNote: GoalStickyNote = {
        id: `gnote-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        content: newNoteContent.trim(),
        color: newNoteColor,
        createdAt: new Date().toISOString(),
        pinned: false,
      };

      return {
        ...goal,
        stickyNotes: [newNote, ...goal.stickyNotes],
        updatedAt: new Date().toISOString(),
      };
    });

    updateAndSaveGoals(updated);
    setNewNoteContent('');
    setActiveNewNoteGoalId(null);
  };

  // Toggle Pin on Sticky Note
  const handleTogglePinNote = (goalId: string, noteId: string) => {
    const updated = goals.map((goal) => {
      if (goal.id !== goalId) return goal;
      return {
        ...goal,
        stickyNotes: goal.stickyNotes.map((n) =>
          n.id === noteId ? { ...n, pinned: !n.pinned } : n
        ),
      };
    });
    updateAndSaveGoals(updated);
  };

  // Delete Sticky Note
  const handleDeleteStickyNote = (goalId: string, noteId: string) => {
    const updated = goals.map((goal) => {
      if (goal.id !== goalId) return goal;
      return {
        ...goal,
        stickyNotes: goal.stickyNotes.filter((n) => n.id !== noteId),
      };
    });
    updateAndSaveGoals(updated);
  };

  // Delete entire goal
  const handleDeleteGoal = (goalId: string) => {
    if (!window.confirm('Are you sure you want to delete this target goal?')) return;
    const updated = goals.filter((g) => g.id !== goalId);
    updateAndSaveGoals(updated);
  };

  // Quick launch stopwatch on step
  const handleStartStopwatchOnStep = (goal: TargetGoal, step: GoalStep) => {
    if (!onStartStopwatch) return;

    const pseudoTask: Task = {
      id: `gtask-${goal.id}-${step.id}`,
      title: `${goal.title}: ${step.title}`,
      description: `Target Goal: ${goal.title}\nStep: ${step.title}\nTiming: ${step.targetDate || 'Today'}`,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: goal.priority,
      category: goal.category,
      date: step.targetDate || new Date().toISOString().split('T')[0],
      startTime: step.targetTime,
      subtasks: [],
      order: 1,
    };

    onStartStopwatch(pseudoTask);
  };

  // Calculate days remaining helper
  const getDaysRemainingInfo = (targetDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isUrgent: true };
    }
    if (diffDays === 0) {
      return { text: 'Due today', isOverdue: false, isUrgent: true };
    }
    if (diffDays === 1) {
      return { text: '1 day left', isOverdue: false, isUrgent: true };
    }
    return { text: `${diffDays} days left`, isOverdue: false, isUrgent: diffDays <= 5 };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Target className="w-4 h-4" />
            <span>Target Roadmaps & Milestones</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Goals & Step Progression
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
            Break down ambitious targets into sequential steps with dedicated timing, visual tracking of where you completed up to, and embedded sticky notes.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            setIsGoalModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Target Goal</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span>Overall Progress</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">
            {stats.completionRate}%
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            {stats.completedSteps} of {stats.totalSteps} steps completed
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span>Active Goals</span>
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">
            {stats.totalGoals - stats.completedGoals}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            {stats.completedGoals} goals finished
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span>Hours Invested</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">
            {stats.totalActualHours}h
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            of {stats.totalEstimatedHours}h estimated
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span>Execution Cadence</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">
            {goals.filter((g) => g.status === 'completed').length > 0
              ? `${goals.filter((g) => g.status === 'completed').length} Won`
              : 'In Flight'}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            Step-by-step milestones
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search goals, steps, or sticky notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-100/70 dark:bg-neutral-800/70 rounded-lg border-none focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 text-neutral-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-neutral-100/70 dark:bg-neutral-800/70 border-none rounded-lg text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 text-xs bg-neutral-100/70 dark:bg-neutral-800/70 border-none rounded-lg text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer"
          >
            <option value="all">Status: All</option>
            <option value="in_progress">Status: In Progress</option>
            <option value="completed">Status: Completed</option>
          </select>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-5">
        {filteredGoals.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-6">
            <Target className="w-10 h-10 mx-auto text-neutral-400 dark:text-neutral-600 mb-3" />
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">
              No target goals found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 max-w-sm mx-auto">
              Create your first target goal to map out the exact sequence of steps, timing, and sticky notes required to reach it.
            </p>
            <button
              onClick={() => {
                setEditingGoal(null);
                setIsGoalModalOpen(true);
              }}
              className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Create Target Goal
            </button>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const completedCount = goal.steps.filter((s) => s.completed).length;
            const totalCount = goal.steps.length;
            const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const daysInfo = getDaysRemainingInfo(goal.targetDate);
            const isExpanded = expandedGoalIds[goal.id] ?? true;

            // Find current active step ("Until where it completed")
            // The first non-completed step in order
            const currentActiveStep = goal.steps.find((s) => !s.completed);
            const lastCompletedStepIndex = goal.steps.reduce(
              (acc, s, idx) => (s.completed ? idx : acc),
              -1
            );

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden transition"
              >
                {/* Goal Header Card */}
                <div className="p-5 sm:p-6 border-b border-neutral-100 dark:border-neutral-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {goal.category}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            goal.priority === 'urgent'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : goal.priority === 'high'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {goal.priority}
                        </span>

                        {goal.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Goal Achieved!</span>
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                              daysInfo.isOverdue
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : daysInfo.isUrgent
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Target: {goal.targetDate} ({daysInfo.text})</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                        {goal.title}
                      </h3>

                      {goal.tagline && (
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {goal.tagline}
                        </p>
                      )}
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center gap-2 self-end sm:self-start">
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setIsGoalModalOpen(true);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                        title="Edit Goal"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleExpand(goal.id)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                      >
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & "Until Where It Completed" Indicator */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/60">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-900 dark:text-white">
                          Progress: {percent}%
                        </span>
                        <span className="text-neutral-500 dark:text-neutral-400 font-normal">
                          ({completedCount} of {totalCount} steps finished)
                        </span>
                      </div>

                      {/* Until where it completed banner */}
                      {currentActiveStep ? (
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span>Currently at Step {goal.steps.indexOf(currentActiveStep) + 1}: {currentActiveStep.title.slice(0, 32)}...</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>All steps completed!</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-6 bg-neutral-50/50 dark:bg-neutral-950/40">
                    {/* SECTION 1: Step-by-Step Path ("Until Where It Completed") */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Goal Steps & Timing Roadmap</span>
                        </h4>

                        <button
                          onClick={() => {
                            setActiveNewStepGoalId(goal.id);
                            setNewStepTitle('');
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Step</span>
                        </button>
                      </div>

                      {/* Stepper Timeline List */}
                      <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
                        {goal.steps.map((step, idx) => {
                          const isCurrent = currentActiveStep?.id === step.id;
                          const isPast = step.completed;

                          return (
                            <div
                              key={step.id}
                              className={`relative p-3.5 sm:p-4 rounded-xl border transition ${
                                isCurrent
                                  ? 'bg-white dark:bg-neutral-900 border-amber-300 dark:border-amber-600/50 shadow-sm ring-1 ring-amber-400/20'
                                  : isPast
                                  ? 'bg-white/70 dark:bg-neutral-900/60 border-neutral-200/70 dark:border-neutral-800/70'
                                  : 'bg-white/40 dark:bg-neutral-900/40 border-neutral-200/50 dark:border-neutral-800/40 opacity-75'
                              }`}
                            >
                              {/* Step Node Marker on vertical line */}
                              <div
                                onClick={() => handleToggleStep(goal.id, step.id)}
                                className={`absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-full flex items-center justify-center -translate-x-1/2 cursor-pointer transition ${
                                  isPast
                                    ? 'bg-emerald-500 text-white shadow-xs'
                                    : isCurrent
                                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-950/60 animate-pulse'
                                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                                }`}
                              >
                                {isPast ? (
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                ) : (
                                  <span className="text-[11px] font-bold">{idx + 1}</span>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="space-y-1 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold text-neutral-400">
                                      Step {idx + 1}
                                    </span>

                                    {isCurrent && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white tracking-wide uppercase">
                                        Active Milestone (You Are Here)
                                      </span>
                                    )}

                                    {isPast && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        Completed
                                      </span>
                                    )}

                                    {step.targetDate && (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                                        <Calendar className="w-3 h-3" />
                                        <span>Target: {step.targetDate} {step.targetTime || ''}</span>
                                      </span>
                                    )}

                                    {step.estimatedHours ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                          {step.actualHoursSpent || 0}h / {step.estimatedHours}h
                                        </span>
                                      </span>
                                    ) : null}
                                  </div>

                                  <h5
                                    className={`text-sm font-semibold ${
                                      isPast
                                        ? 'line-through text-neutral-400 dark:text-neutral-500'
                                        : 'text-neutral-900 dark:text-white'
                                    }`}
                                  >
                                    {step.title}
                                  </h5>

                                  {step.description && (
                                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                      {step.description}
                                    </p>
                                  )}

                                  {step.notes && (
                                    <p className="text-[11px] text-neutral-500 italic">
                                      Note: {step.notes}
                                    </p>
                                  )}
                                </div>

                                {/* Step Actions */}
                                <div className="flex items-center gap-1.5 self-end sm:self-start">
                                  {/* Launch Stopwatch for this step */}
                                  {!isPast && onStartStopwatch && (
                                    <button
                                      type="button"
                                      onClick={() => handleStartStopwatchOnStep(goal, step)}
                                      className="px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition cursor-pointer flex items-center gap-1"
                                      title="Start stopwatch focus on this step"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                      <span>Focus</span>
                                    </button>
                                  )}

                                  {/* Check/Uncheck toggle button */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStep(goal.id, step.id)}
                                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1 ${
                                      isPast
                                        ? 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    }`}
                                  >
                                    {isPast ? (
                                      <span>Re-open</span>
                                    ) : (
                                      <>
                                        <Check className="w-3 h-3 stroke-[3]" />
                                        <span>Mark Done</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => handleDeleteStep(goal.id, step.id)}
                                    className="p-1.5 text-neutral-400 hover:text-rose-500 transition rounded-lg"
                                    title="Delete Step"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Inline Add Step Form */}
                        {activeNewStepGoalId === goal.id && (
                          <div className="p-3.5 bg-white dark:bg-neutral-900 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-3">
                            <h5 className="text-xs font-bold text-neutral-900 dark:text-white">
                              Add Step to &quot;{goal.title}&quot;
                            </h5>

                            <input
                              type="text"
                              placeholder="Step title (e.g. Build prototype mockups)..."
                              value={newStepTitle}
                              onChange={(e) => setNewStepTitle(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              autoFocus
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] text-neutral-500 mb-1">
                                  Target Date
                                </label>
                                <input
                                  type="date"
                                  value={newStepDate}
                                  onChange={(e) => setNewStepDate(e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-neutral-500 mb-1">
                                  Estimated Hours
                                </label>
                                <input
                                  type="number"
                                  min="0.5"
                                  step="0.5"
                                  value={newStepHours}
                                  onChange={(e) => setNewStepHours(e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setActiveNewStepGoalId(null)}
                                className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddStep(goal.id)}
                                className="px-3.5 py-1.5 text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg"
                              >
                                Save Step
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION 2: Embedded Sticky Notes */}
                    <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                          <StickyIcon className="w-3.5 h-3.5" />
                          <span>Goal Sticky Notes ({goal.stickyNotes.length})</span>
                        </h4>

                        <button
                          onClick={() => {
                            setActiveNewNoteGoalId(goal.id);
                            setNewNoteContent('');
                            setNewNoteColor('yellow');
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Sticky Note</span>
                        </button>
                      </div>

                      {/* Sticky Notes Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {goal.stickyNotes.map((note) => {
                          const colorCfg = COLOR_CLASSES[note.color];
                          return (
                            <div
                              key={note.id}
                              className={`p-3.5 rounded-xl border ${colorCfg.bg} ${colorCfg.border} shadow-2xs relative group transition-transform hover:-translate-y-0.5`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                  {new Date(note.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleTogglePinNote(goal.id, note.id)}
                                    className={`p-1 rounded-md transition ${
                                      note.pinned
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-neutral-400 opacity-0 group-hover:opacity-100'
                                    }`}
                                  >
                                    <Pin className="w-3 h-3 fill-current" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteStickyNote(goal.id, note.id)}
                                    className="p-1 text-neutral-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition rounded-md"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <p className={`text-xs ${colorCfg.text} leading-relaxed whitespace-pre-wrap font-medium`}>
                                {note.content}
                              </p>
                            </div>
                          );
                        })}

                        {/* Inline Add Sticky Note Box */}
                        {activeNewNoteGoalId === goal.id && (
                          <div className="p-3.5 rounded-xl border border-dashed border-amber-300 dark:border-amber-600 bg-amber-50/70 dark:bg-amber-950/20 space-y-2.5">
                            <textarea
                              placeholder="Write a quick thought, reference, or blocker..."
                              value={newNoteContent}
                              onChange={(e) => setNewNoteContent(e.target.value)}
                              rows={2}
                              className="w-full p-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none"
                              autoFocus
                            />

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                {NOTE_COLORS.map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setNewNoteColor(c)}
                                    className={`w-4 h-4 rounded-full border transition cursor-pointer ${
                                      c === 'yellow'
                                        ? 'bg-amber-300 border-amber-400'
                                        : c === 'pink'
                                        ? 'bg-rose-300 border-rose-400'
                                        : c === 'blue'
                                        ? 'bg-sky-300 border-sky-400'
                                        : c === 'green'
                                        ? 'bg-emerald-300 border-emerald-400'
                                        : c === 'purple'
                                        ? 'bg-purple-300 border-purple-400'
                                        : 'bg-orange-300 border-orange-400'
                                    } ${newNoteColor === c ? 'ring-2 ring-neutral-900 dark:ring-white scale-110' : ''}`}
                                  />
                                ))}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setActiveNewNoteGoalId(null)}
                                  className="text-[11px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 px-2 py-1"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddStickyNote(goal.id)}
                                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer"
                                >
                                  Pin Note
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Target Goal Create / Edit Modal */}
      {isGoalModalOpen && (
        <GoalEditorModal
          isOpen={isGoalModalOpen}
          goalToEdit={editingGoal}
          onClose={() => {
            setIsGoalModalOpen(false);
            setEditingGoal(null);
          }}
          onSave={(savedGoal) => {
            if (editingGoal) {
              const updated = goals.map((g) => (g.id === savedGoal.id ? savedGoal : g));
              updateAndSaveGoals(updated);
            } else {
              updateAndSaveGoals([savedGoal, ...goals]);
            }
            setIsGoalModalOpen(false);
            setEditingGoal(null);
          }}
        />
      )}
    </div>
  );
};

// Modal for creating/editing full Target Goal with initial steps
interface GoalEditorModalProps {
  isOpen: boolean;
  goalToEdit: TargetGoal | null;
  onClose: () => void;
  onSave: (goal: TargetGoal) => void;
}

const GoalEditorModal: React.FC<GoalEditorModalProps> = ({
  isOpen,
  goalToEdit,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(goalToEdit?.title || '');
  const [tagline, setTagline] = useState(goalToEdit?.tagline || '');
  const [category, setCategory] = useState(goalToEdit?.category || 'Career');
  const [priority, setPriority] = useState<Priority>(goalToEdit?.priority || 'high');
  const [targetDate, setTargetDate] = useState(
    goalToEdit?.targetDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [startDate, setStartDate] = useState(
    goalToEdit?.startDate || new Date().toISOString().split('T')[0]
  );

  // Initial steps builder
  const [steps, setSteps] = useState<Array<{ title: string; targetDate?: string; estimatedHours: number }>>(
    goalToEdit?.steps.map((s) => ({
      title: s.title,
      targetDate: s.targetDate,
      estimatedHours: s.estimatedHours || 2,
    })) || [
      { title: 'Step 1: Planning and research', estimatedHours: 4 },
      { title: 'Step 2: Prototype build', estimatedHours: 8 },
      { title: 'Step 3: Verification and launch', estimatedHours: 6 },
    ]
  );

  if (!isOpen) return null;

  const handleAddStepRow = () => {
    setSteps((prev) => [
      ...prev,
      { title: `Step ${prev.length + 1}: `, estimatedHours: 4 },
    ]);
  };

  const handleRemoveStepRow = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, field: string, val: any) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: val } : s))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formattedSteps: GoalStep[] = steps
      .filter((s) => s.title.trim().length > 0)
      .map((s, idx) => ({
        id: goalToEdit?.steps[idx]?.id || `step-${Date.now()}-${idx}`,
        title: s.title.trim(),
        targetDate: s.targetDate || undefined,
        estimatedHours: s.estimatedHours,
        actualHoursSpent: goalToEdit?.steps[idx]?.actualHoursSpent || 0,
        completed: goalToEdit?.steps[idx]?.completed || false,
        completedAt: goalToEdit?.steps[idx]?.completedAt,
        order: idx + 1,
      }));

    const finalGoal: TargetGoal = {
      id: goalToEdit?.id || `goal-${Date.now()}`,
      title: title.trim(),
      tagline: tagline.trim() || undefined,
      category,
      priority,
      targetDate,
      startDate,
      status: goalToEdit?.status || 'in_progress',
      steps: formattedSteps,
      stickyNotes: goalToEdit?.stickyNotes || [],
      createdAt: goalToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(finalGoal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden my-8">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {goalToEdit ? 'Edit Target Goal' : 'Create New Target Goal'}
              </h3>
              <p className="text-xs text-neutral-500">
                Define the end objective and sequential milestone steps
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Goal Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Master Full-Stack AI System Architecture"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Tagline / Objective Statement
            </label>
            <input
              type="text"
              placeholder="Brief description of the victory condition..."
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white cursor-pointer"
              >
                {['Career', 'Learning', 'Health', 'Finance', 'Personal', 'Project'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white cursor-pointer"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Target Deadline *
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          {/* Sequential Steps Builder */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-900 dark:text-white">
                Milestone Steps Sequence
              </label>
              <button
                type="button"
                onClick={handleAddStepRow}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-2">
              {steps.map((st, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 text-center text-xs font-bold text-neutral-400">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    placeholder="Step milestone title..."
                    value={st.title}
                    onChange={(e) => handleStepChange(i, 'title', e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  />
                  <input
                    type="number"
                    min="1"
                    title="Estimated hours"
                    placeholder="Hrs"
                    value={st.estimatedHours}
                    onChange={(e) =>
                      handleStepChange(i, 'estimatedHours', Number(e.target.value) || 2)
                    }
                    className="w-16 px-2 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStepRow(i)}
                    className="p-1 text-neutral-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl shadow-xs cursor-pointer"
            >
              {goalToEdit ? 'Save Changes' : 'Create Target Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
