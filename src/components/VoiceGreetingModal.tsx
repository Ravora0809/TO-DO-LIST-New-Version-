import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Square,
  Volume2,
  VolumeX,
  X,
  Calendar,
  Rocket,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Task } from '../types';
import { getGreetingBriefing, speakText, stopSpeaking } from '../services/voiceAssistant';
import { AssistantAvatar } from './AssistantAvatar';

interface VoiceGreetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  tasks: Task[];
  voiceMuted: boolean;
  onToggleMute: () => void;
  onStartMyDay: (highestPriorityTask?: Task) => void;
  onViewSchedule: () => void;
  onAddTask: () => void;
}

export const VoiceGreetingModal: React.FC<VoiceGreetingModalProps> = ({
  isOpen,
  onClose,
  username,
  tasks,
  voiceMuted,
  onToggleMute,
  onStartMyDay,
  onViewSchedule,
  onAddTask,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [briefing, setBriefing] = useState(() => getGreetingBriefing(username, tasks));

  useEffect(() => {
    setBriefing(getGreetingBriefing(username, tasks));
  }, [username, tasks]);

  // Auto-greeting when opened
  useEffect(() => {
    if (isOpen && !voiceMuted) {
      setIsPlaying(true);
      speakText(briefing.spokenGreeting, false, () => {
        setIsPlaying(false);
      });
    }
    return () => {
      stopSpeaking();
      setIsPlaying(false);
    };
  }, [isOpen, voiceMuted, briefing.spokenGreeting]);

  if (!isOpen) return null;

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakText(briefing.spokenGreeting, false, () => {
        setIsPlaying(false);
      });
    }
  };

  const handleDismiss = () => {
    stopSpeaking();
    setIsPlaying(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
        {/* Top subtle highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-900 via-neutral-600 to-neutral-400 dark:from-white dark:via-neutral-300 dark:to-neutral-500" />

        {/* Header Row with Animated Avatar */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            {/* Small animated assistant avatar */}
            <AssistantAvatar state={isPlaying ? 'speaking' : 'idle'} size="md" />
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Daily Greeting
              </span>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight">
                {briefing.timeGreeting}, {username}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleMute}
              title={voiceMuted ? 'Unmute voice' : 'Mute voice'}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleDismiss}
              title="Dismiss"
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Spoken Greeting Card */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-3 mb-5">
          <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
            “{briefing.spokenGreeting}”
          </p>

          <div className="flex items-center justify-between pt-1 text-xs text-neutral-500">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isPlaying
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Replay Voice</span>
                </>
              )}
            </button>

            {briefing.overdueTasksCount > 0 && (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{briefing.overdueTasksCount} Overdue</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: Start My Day, View Schedule, Add Task, Dismiss */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => {
              stopSpeaking();
              onStartMyDay(briefing.highestPriorityTask);
              onClose();
            }}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-100 transition shadow-xs cursor-pointer group"
          >
            <Rocket className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>🚀 Start My Day</span>
          </button>

          <button
            onClick={() => {
              stopSpeaking();
              onViewSchedule();
              onClose();
            }}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold text-xs text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>📅 View Schedule</span>
          </button>

          <button
            onClick={() => {
              stopSpeaking();
              onAddTask();
              onClose();
            }}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold text-xs text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>📝 Add Task</span>
          </button>

          <button
            onClick={handleDismiss}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium text-xs transition cursor-pointer"
          >
            <span>✕ Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
};
