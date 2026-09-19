import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  X,
  Play,
  Square,
  AlertCircle,
  Calendar,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Task } from '../types';
import { speakText, stopSpeaking } from '../services/voiceAssistant';
import { showTaskNotification } from '../services/notifications';

interface RemindersPopupProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onToggleTask: (taskId: string) => void;
  voiceMuted: boolean;
  onToggleMute: () => void;
}

export const RemindersPopup: React.FC<RemindersPopupProps> = ({
  isOpen,
  onClose,
  tasks,
  onOpenTask,
  onToggleTask,
  voiceMuted,
  onToggleMute,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechTask, setActiveSpeechTask] = useState<string | null>(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Pending tasks for today
  const pendingTodayTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.completed && (t.date === todayStr || !t.date))
      .sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));
  }, [tasks, todayStr]);

  // Upcoming reminders with configured reminder setting
  const upcomingReminders = useMemo(() => {
    return tasks
      .filter((t) => !t.completed && t.date === todayStr && t.reminder)
      .sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));
  }, [tasks, todayStr]);

  // Overdue tasks
  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => !t.completed && t.date && t.date < todayStr);
  }, [tasks, todayStr]);

  // Clean up speech when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      setIsSpeaking(false);
      setActiveSpeechTask(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Speak all pending tasks out loud
  const handleReadOutLoudAllPending = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      setActiveSpeechTask(null);
      return;
    }

    if (pendingTodayTasks.length === 0 && overdueTasks.length === 0) {
      setIsSpeaking(true);
      speakText('Great news! You have no pending tasks or reminders for today. Everything is completed!', voiceMuted, () => {
        setIsSpeaking(false);
      });
      return;
    }

    let speech = `Here is your reminder notification of pending tasks. `;
    if (overdueTasks.length > 0) {
      speech += `Attention: you have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. `;
    }

    speech += `You have ${pendingTodayTasks.length} pending task${pendingTodayTasks.length > 1 ? 's' : ''} for today. `;

    const itemsToRead = [...overdueTasks.slice(0, 2), ...pendingTodayTasks.slice(0, 5)];
    itemsToRead.forEach((t, index) => {
      const timeInfo = t.startTime ? `at ${t.startTime}` : 'with no scheduled time';
      speech += `Number ${index + 1}: ${t.title}, ${timeInfo}, priority ${t.priority}. `;
    });

    if (pendingTodayTasks.length > 5) {
      speech += `Plus ${pendingTodayTasks.length - 5} more pending items.`;
    }

    setIsSpeaking(true);
    setActiveSpeechTask('all');
    speakText(speech, voiceMuted, () => {
      setIsSpeaking(false);
      setActiveSpeechTask(null);
    });
  };

  // Speak single task
  const handleReadSingleTask = (task: Task) => {
    if (isSpeaking && activeSpeechTask === task.id) {
      stopSpeaking();
      setIsSpeaking(false);
      setActiveSpeechTask(null);
      return;
    }

    stopSpeaking();
    setIsSpeaking(true);
    setActiveSpeechTask(task.id);

    const timeInfo = task.startTime ? `scheduled for ${task.startTime}` : 'scheduled for today';
    const descInfo = task.description ? `. Description: ${task.description}` : '';
    const text = `Reminder: ${task.title}. ${timeInfo}. Priority is ${task.priority}${descInfo}.`;

    speakText(text, voiceMuted, () => {
      setIsSpeaking(false);
      setActiveSpeechTask(null);
    });
  };

  // Trigger test live notification
  const handleTriggerTestNotification = () => {
    const targetTask: Task = pendingTodayTasks[0] || tasks[0] || {
      id: 'demo-task',
      title: 'Review team productivity deliverables',
      completed: false,
      createdAt: new Date().toISOString(),
      priority: 'high',
      category: 'Work',
      date: todayStr,
      startTime: '14:00',
      subtasks: [],
      order: 0,
    };

    showTaskNotification(targetTask, 'Due in 5 minutes');

    // Read it out loud immediately
    const speech = `Reminder notification: ${targetTask.title} is due in 5 minutes! You currently have ${pendingTodayTasks.length} pending tasks remaining today.`;
    speakText(speech, voiceMuted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Reminders & Pending Tasks
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200">
                  {pendingTodayTasks.length} pending
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Live audio readout & upcoming schedule reminders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleMute}
              title={voiceMuted ? 'Voice Muted (Click to unmute)' : 'Voice Audio Active'}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Read Out Loud Action Ribbon */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-neutral-900 border-b border-neutral-100 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReadOutLoudAllPending}
              id="reminders-read-all-btn"
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer ${
                isSpeaking && activeSpeechTask === 'all'
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:opacity-90'
              }`}
            >
              {isSpeaking && activeSpeechTask === 'all' ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Speaking</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Read Out Loud Pending Tasks</span>
                </>
              )}
            </button>

            {voiceMuted && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                (Voice muted)
              </span>
            )}
          </div>

          <button
            onClick={handleTriggerTestNotification}
            id="reminders-test-notification-btn"
            className="text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            🔊 Test Voice Notification
          </button>
        </div>

        {/* Task lists container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Overdue alert if any */}
          {overdueTasks.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold mb-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Overdue Pending ({overdueTasks.length})</span>
              </div>
              <div className="space-y-2">
                {overdueTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 dark:bg-neutral-900/80 border border-rose-100 dark:border-rose-900/40 gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-rose-600 dark:text-rose-400">
                        Due: {task.date} {task.startTime || ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleReadSingleTask(task)}
                        title="Read this task out loud"
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 hover:text-emerald-700 transition cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Tasks for Today */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Today's Pending Reminders & Schedule
              </span>
              <span className="text-xs text-neutral-400">
                {pendingTodayTasks.length} tasks
              </span>
            </div>

            {pendingTodayTasks.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-200 dark:border-neutral-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  All caught up!
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  No pending reminders or tasks for today.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTodayTasks.map((task) => {
                  const isTaskSpeaking = isSpeaking && activeSpeechTask === task.id;
                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isTaskSpeaking
                          ? 'border-amber-400 bg-amber-50/60 dark:border-amber-600 dark:bg-amber-950/40 ring-1 ring-amber-400'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-850/50 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <div
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        onClick={() => onOpenTask(task)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTask(task.id);
                          }}
                          className="w-5 h-5 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 hover:border-emerald-500 flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          {task.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                            {task.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                            {task.startTime ? (
                              <span className="flex items-center gap-1 font-mono text-neutral-700 dark:text-neutral-300">
                                <Clock className="w-3 h-3 text-amber-500" />
                                {task.startTime}
                              </span>
                            ) : (
                              <span>Today</span>
                            )}
                            <span>•</span>
                            <span className="capitalize">{task.category}</span>
                            <span>•</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                task.priority === 'high'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : task.priority === 'medium'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleReadSingleTask(task)}
                          title={isTaskSpeaking ? 'Stop voice' : 'Read this task aloud'}
                          className={`p-2 rounded-xl transition cursor-pointer ${
                            isTaskSpeaking
                              ? 'bg-amber-500 text-white'
                              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Voice Readout uses Web Speech Synthesis
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-semibold hover:opacity-90 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
