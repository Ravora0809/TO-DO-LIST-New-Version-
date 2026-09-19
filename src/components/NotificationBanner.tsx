import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  X,
  Play,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Square,
  ListTodo,
} from 'lucide-react';
import { Task } from '../types';
import { InAppReminderDetail } from '../services/notifications';
import { speakText, stopSpeaking, isSpeaking } from '../services/voiceAssistant';

interface NotificationBannerProps {
  onStartFocus?: (task: Task) => void;
  onOpenTask?: (task: Task) => void;
  onOpenReminders?: () => void;
  speechRate?: number;
  voiceMuted?: boolean;
}

interface BannerItem extends InAppReminderDetail {
  progress: number; // 0 to 100
  isHovered: boolean;
  speaking: boolean;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  onStartFocus,
  onOpenTask,
  onOpenReminders,
  speechRate = 1.0,
  voiceMuted = false,
}) => {
  const [notifications, setNotifications] = useState<BannerItem[]>([]);
  const intervalsRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const handleNotification = (e: Event) => {
      const customEvent = e as CustomEvent<InAppReminderDetail>;
      if (!customEvent.detail) return;

      const detail = customEvent.detail;

      setNotifications((prev) => {
        // Prevent exact duplicate notifications
        if (prev.some((n) => n.id === detail.id || (n.task.id === detail.task.id && Date.now() - n.timestamp < 10000))) {
          return prev;
        }

        const newItem: BannerItem = {
          ...detail,
          progress: 100,
          isHovered: false,
          speaking: !voiceMuted,
        };

        // Keep at most 3 active notifications
        return [newItem, ...prev.slice(0, 2)];
      });
    };

    window.addEventListener('in-app-notification', handleNotification as EventListener);
    return () => {
      window.removeEventListener('in-app-notification', handleNotification as EventListener);
    };
  }, [voiceMuted]);

  // Handle countdown progress bar & auto-dismiss
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications((prev) => {
        return prev
          .map((item) => {
            if (item.isHovered) return item;
            // Decay progress over ~14 seconds
            const nextProgress = item.progress - (100 / (14 * 10));
            return {
              ...item,
              progress: nextProgress,
              speaking: isSpeaking(),
            };
          })
          .filter((item) => item.progress > 0);
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleReplaySpokenReminder = (item: BannerItem) => {
    stopSpeaking();
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, speaking: true } : n))
    );

    speakText(
      item.spokenText,
      false,
      () => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, speaking: false } : n))
        );
      },
      speechRate,
      () => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, speaking: true } : n))
        );
      }
    );
  };

  const handleStopSpeech = (id: string) => {
    stopSpeaking();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, speaking: false } : n))
    );
  };

  const handleMouseEnter = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isHovered: true } : n))
    );
  };

  const handleMouseLeave = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isHovered: false } : n))
    );
  };

  if (notifications.length === 0) return null;

  return (
    <div
      id="in-app-reminders-container"
      className="fixed top-4 right-4 z-[95] w-full max-w-sm sm:max-w-md space-y-3 pointer-events-none px-3 sm:px-0"
    >
      {notifications.map((notif) => (
        <div
          key={notif.id}
          onMouseEnter={() => handleMouseEnter(notif.id)}
          onMouseLeave={() => handleMouseLeave(notif.id)}
          className="pointer-events-auto relative overflow-hidden rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-amber-300/80 dark:border-amber-700/80 shadow-2xl transition-all duration-200 animate-in slide-in-from-top-3 fade-in"
        >
          {/* Top colored accent bar & progress indicator */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-100 ease-linear"
              style={{ width: `${Math.max(0, notif.progress)}%` }}
            />
          </div>

          <div className="p-4 pt-3.5 space-y-3">
            {/* Header / Badges Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-amber-500 text-white shadow-xs shrink-0 animate-bounce">
                  <Bell className="w-3.5 h-3.5" />
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                    Spoken Reminder
                  </span>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    {notif.minutesMessage}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => handleDismiss(notif.id)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="Dismiss"
                aria-label="Dismiss reminder"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Task Title & Details */}
            <div className="pl-9">
              <h4
                onClick={() => onOpenTask?.(notif.task)}
                className="text-sm font-bold text-neutral-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer line-clamp-2 leading-snug"
              >
                {notif.task.title}
              </h4>

              <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-neutral-500 dark:text-neutral-400">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {notif.task.category || 'Work'}
                </span>
                {notif.task.startTime && (
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    <span>{notif.task.startTime}</span>
                  </span>
                )}
                {notif.task.priority === 'urgent' && (
                  <span className="text-[10px] font-bold text-rose-500">Urgent</span>
                )}
              </div>

              {notif.task.description && (
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5 line-clamp-2 italic bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  "{notif.task.description}"
                </p>
              )}
            </div>

            {/* Speaking animation & controls footer */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
              {/* Voice Readout Soundwave Status */}
              <div className="flex items-center gap-2">
                {notif.speaking ? (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {/* Animated sound wave bars */}
                    <div className="flex items-center gap-0.5 h-3.5">
                      <span className="w-1 bg-amber-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2.5" />
                      <span className="w-1 bg-amber-500 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-3.5" />
                      <span className="w-1 bg-amber-500 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-2" />
                      <span className="w-1 bg-amber-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-3" />
                    </div>
                    <span className="text-[11px] font-semibold">Reading Aloud...</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleReplaySpokenReminder(notif)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
                    title="Read reminder aloud again"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Read Aloud</span>
                  </button>
                )}

                {notif.speaking && (
                  <button
                    onClick={() => handleStopSpeech(notif.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    title="Stop reading voice"
                  >
                    <Square className="w-3 h-3 fill-current text-rose-500" />
                    <span className="text-[11px]">Stop</span>
                  </button>
                )}
              </div>

              {/* Action Buttons: Start Focus or View Task */}
              <div className="flex items-center gap-1.5">
                {onOpenReminders && (
                  <button
                    onClick={() => {
                      onOpenReminders();
                      handleDismiss(notif.id);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium text-xs text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
                    title="See all pending reminders"
                  >
                    <ListTodo className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="hidden sm:inline">All</span>
                  </button>
                )}

                {onStartFocus && (
                  <button
                    onClick={() => {
                      onStartFocus(notif.task);
                      handleDismiss(notif.id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold text-xs hover:opacity-90 transition cursor-pointer shadow-xs"
                    title="Start focus timer for this task"
                  >
                    <Play className="w-3 h-3 fill-current text-amber-400" />
                    <span>Start Focus</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
