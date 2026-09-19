import React, { useState } from 'react';
import {
  Timer,
  Play,
  Clock,
  X,
  Sparkles,
  Flame,
  Check,
} from 'lucide-react';
import { Task } from '../types';

interface StartTaskStopwatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onStart: (task: Task, mode: 'countdown' | 'stopwatch', targetMinutes: number) => void;
}

export const StartTaskStopwatchModal: React.FC<StartTaskStopwatchModalProps> = ({
  isOpen,
  onClose,
  task,
  onStart,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [customInput, setCustomInput] = useState<string>('');
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown');

  if (!isOpen || !task) return null;

  const presets = [
    { label: 'Quick Sprint', mins: 15, desc: 'For brief focused tasks' },
    { label: 'Pomodoro', mins: 25, desc: 'Classic focus interval' },
    { label: 'Standard Focus', mins: 30, desc: 'Balanced deep work' },
    { label: 'Deep Session', mins: 45, desc: 'Complex problem-solving' },
    { label: 'Full Hour', mins: 60, desc: 'Immersion & execution' },
  ];

  const handleStart = () => {
    let finalMinutes = selectedMinutes;
    if (customInput.trim()) {
      const parsed = parseInt(customInput, 10);
      if (!isNaN(parsed) && parsed > 0) {
        finalMinutes = parsed;
      }
    }
    onStart(task, mode, finalMinutes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">
                Start Task Stopwatch
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Focus timer with completion alarms
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Task Preview */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80">
          <div className="text-xs text-neutral-400 font-medium">Selected Task</div>
          <div className="font-bold text-neutral-900 dark:text-white text-sm mt-0.5 line-clamp-1">
            {task.title}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-neutral-500">
            <span className="px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-700/60 font-medium">
              {task.category}
            </span>
            <span className="capitalize font-semibold text-amber-600 dark:text-amber-400">
              {task.priority} Priority
            </span>
          </div>
        </div>

        {/* Mode Selector: Countdown vs Stopwatch */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Timer Mode
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800">
            <button
              type="button"
              onClick={() => setMode('countdown')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'countdown'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Target Timebox</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('stopwatch')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'stopwatch'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Open Stopwatch</span>
            </button>
          </div>
        </div>

        {/* Presets if Countdown */}
        {mode === 'countdown' ? (
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Select Target Duration
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {presets.map((p) => {
                const isSelected = selectedMinutes === p.mins && !customInput;
                return (
                  <button
                    key={p.mins}
                    type="button"
                    onClick={() => {
                      setSelectedMinutes(p.mins);
                      setCustomInput('');
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-semibold'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{p.label}</div>
                      <div className="text-[11px] opacity-70">{p.desc}</div>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-700/60">
                      {p.mins}m
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="pt-2">
              <input
                type="number"
                min="1"
                max="240"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Or custom minutes (e.g. 20)..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
            <p>
              In Open Stopwatch mode, the timer will count upward continuously. You can stop or mark the task done at any moment.
            </p>
            <p className="text-amber-600 dark:text-amber-400 font-medium">
              An alert chime will remind you at every 30-minute interval to keep you on track.
            </p>
          </div>
        )}

        {/* Launch Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleStart}
            className="w-full py-3 px-4 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold text-sm shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              Start Focus Stopwatch ({mode === 'countdown' ? `${customInput || selectedMinutes}m` : 'Uncapped'})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
