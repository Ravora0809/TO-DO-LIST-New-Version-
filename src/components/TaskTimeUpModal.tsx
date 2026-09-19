import React, { useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Task } from '../types';

interface TaskTimeUpModalProps {
  isOpen: boolean;
  taskTitle: string;
  taskId: string;
  elapsedSeconds: number;
  isAlarmPlaying?: boolean;
  onSilenceAlarm?: () => void;
  onMarkDone: (taskId: string, elapsedSeconds: number) => void;
  onExtend: (extraMinutes: number) => void;
  onContinueUncapped: () => void;
  onStopIncomplete: (taskId: string, elapsedSeconds: number) => void;
}

export const TaskTimeUpModal: React.FC<TaskTimeUpModalProps> = ({
  isOpen,
  taskTitle,
  taskId,
  elapsedSeconds,
  isAlarmPlaying = true,
  onSilenceAlarm,
  onMarkDone,
  onExtend,
  onContinueUncapped,
  onStopIncomplete,
}) => {
  const [customMinutes, setCustomMinutes] = useState<string>('15');
  const [showCustomExtend, setShowCustomExtend] = useState<boolean>(false);

  if (!isOpen) return null;

  const minutesSpent = Math.max(1, Math.round(elapsedSeconds / 60));

  const handleCustomExtendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMinutes, 10);
    if (!isNaN(val) && val > 0) {
      onExtend(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border-2 border-amber-500/80 dark:border-amber-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/10 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header with pulsing alarm */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 animate-bounce">
              <BellRing className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Alarm Ringing
                </span>
                {isAlarmPlaying && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 animate-pulse">
                    <Volume2 className="w-3.5 h-3.5" />
                    Audio Sound On
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mt-1.5 leading-tight">
                Focus Session Complete
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Your allotted time for <span className="font-semibold text-neutral-900 dark:text-white">"{taskTitle}"</span> has finished.
              </p>
            </div>
          </div>

          {/* Quick Silence Alarm Button */}
          {isAlarmPlaying && onSilenceAlarm && (
            <button
              type="button"
              onClick={onSilenceAlarm}
              className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-900 dark:text-amber-200 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              title="Silence the ringing alarm"
            >
              <VolumeX className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Silence</span>
            </button>
          )}
        </div>

        {/* Time spent banner */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60">
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Time logged this session:</span>
          </div>
          <span className="font-mono font-bold text-base text-neutral-900 dark:text-white">
            {minutesSpent} min{minutesSpent !== 1 ? 's' : ''} ({elapsedSeconds}s)
          </span>
        </div>

        {/* Main question prompt */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-sm font-medium text-center">
          Please mark whether your work is done, or if you want to extend your time!
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-3">
          {/* 1. Mark as Done */}
          <button
            type="button"
            onClick={() => onMarkDone(taskId, elapsedSeconds)}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/20 transition active:scale-[0.99] cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Yes, Mark Work as Done!</span>
            <Sparkles className="w-4 h-4 ml-auto opacity-75" />
          </button>

          {/* 2. Extend Time Options */}
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Extend Task Duration
              </span>
              <button
                type="button"
                onClick={() => setShowCustomExtend(!showCustomExtend)}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                {showCustomExtend ? 'Quick options' : 'Custom duration'}
              </button>
            </div>

            {!showCustomExtend ? (
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => onExtend(mins)}
                    className="py-2.5 px-2 rounded-xl text-xs font-bold border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300 transition cursor-pointer"
                  >
                    +{mins}m
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleCustomExtendSubmit} className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-24 px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="Minutes"
                />
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer"
                >
                  Extend by {customMinutes} min
                </button>
              </form>
            )}
          </div>

          {/* 3. Secondary options: Keep Working / Stop Incomplete */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onContinueUncapped}
              className="py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Keep Working (Uncapped)</span>
            </button>

            <button
              type="button"
              onClick={() => onStopIncomplete(taskId, elapsedSeconds)}
              className="py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Stop for Now (Incomplete)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
