import React, { useState } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  Square,
  Plus,
  ChevronUp,
  ChevronDown,
  Timer,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ActiveStopwatchState } from '../types';

interface TaskStopwatchBarProps {
  stopwatch: ActiveStopwatchState | null;
  onTogglePause: () => void;
  onExtend: (minutes: number) => void;
  onComplete: (taskId: string, elapsedSeconds: number) => void;
  onStop: (taskId: string, elapsedSeconds: number) => void;
  onOpenDetail?: () => void;
}

export const TaskStopwatchBar: React.FC<TaskStopwatchBarProps> = ({
  stopwatch,
  onTogglePause,
  onExtend,
  onComplete,
  onStop,
  onOpenDetail,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!stopwatch) return null;

  // Format seconds into MM:SS or HH:MM:SS
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isCountdown = stopwatch.mode === 'countdown';
  const remainingSeconds = Math.max(0, stopwatch.targetSeconds - stopwatch.elapsedSeconds);
  const displaySeconds = isCountdown ? remainingSeconds : stopwatch.elapsedSeconds;
  const progressPercent = isCountdown && stopwatch.targetSeconds > 0
    ? Math.min(100, Math.round((stopwatch.elapsedSeconds / stopwatch.targetSeconds) * 100))
    : 0;

  const isNearlyComplete = isCountdown && remainingSeconds <= 60 && remainingSeconds > 0;

  return (
    <div
      aria-label="Active Task Stopwatch"
      className="fixed bottom-20 md:bottom-6 right-4 z-40 max-w-md w-[calc(100vw-2rem)] sm:w-auto transition-all duration-300 select-none animate-in slide-in-from-bottom-5"
    >
      <div
        className={`bg-neutral-900/95 dark:bg-neutral-900/95 backdrop-blur-xl border ${
          isNearlyComplete
            ? 'border-amber-500 ring-2 ring-amber-500/50'
            : 'border-neutral-700/80 dark:border-neutral-750'
        } text-white rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Top Progress bar if countdown */}
        {isCountdown && (
          <div className="w-full h-1.5 bg-neutral-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isNearlyComplete ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Bar Content */}
        <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
          {/* Status Indicator & Title */}
          <div
            onClick={onOpenDetail}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
          >
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${
                stopwatch.isRunning
                  ? isNearlyComplete
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-emerald-400 animate-pulse'
                  : 'bg-neutral-500'
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
                <span>{stopwatch.taskCategory}</span>
                <span>•</span>
                <span>{isCountdown ? 'Timebox' : 'Stopwatch'}</span>
                {isNearlyComplete && (
                  <span className="text-amber-400 font-bold animate-pulse ml-1">
                    About to finish!
                  </span>
                )}
              </div>
              <div className="font-bold text-sm text-white truncate max-w-[170px] sm:max-w-[220px]">
                {stopwatch.taskTitle}
              </div>
            </div>
          </div>

          {/* Time Display */}
          <div className="text-right shrink-0">
            <div
              className={`font-mono font-extrabold text-lg sm:text-xl tracking-tight ${
                isNearlyComplete ? 'text-amber-400 animate-pulse' : 'text-white'
              }`}
            >
              {formatTime(displaySeconds)}
            </div>
            <div className="text-[10px] text-neutral-400 font-medium">
              {isCountdown ? 'remaining' : 'elapsed'}
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-1.5 shrink-0 border-l border-neutral-750 pl-2.5">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={onTogglePause}
              title={stopwatch.isRunning ? 'Pause' : 'Resume'}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition cursor-pointer"
            >
              {stopwatch.isRunning ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current text-emerald-400" />
              )}
            </button>

            {/* Quick +5m Extend */}
            {isCountdown && (
              <button
                type="button"
                onClick={() => onExtend(5)}
                title="Extend by 5 minutes"
                className="px-2 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-mono text-xs font-bold transition cursor-pointer hidden sm:inline-flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>5m</span>
              </button>
            )}

            {/* Complete Task Button */}
            <button
              type="button"
              onClick={() => onComplete(stopwatch.taskId, stopwatch.elapsedSeconds)}
              title="Mark Task Done"
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>

            {/* Stop Incomplete Button */}
            <button
              type="button"
              onClick={() => onStop(stopwatch.taskId, stopwatch.elapsedSeconds)}
              title="Stop timer without completing"
              className="p-2 rounded-xl bg-neutral-800 hover:bg-rose-900/60 text-neutral-400 hover:text-rose-300 transition cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
