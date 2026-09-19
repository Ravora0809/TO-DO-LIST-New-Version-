import { Task } from '../types';
import { playPopSound, playWarningBeep } from './sound';
import { speakText, isSpeechSynthesisSupported } from './voiceAssistant';

export interface SpokenReminderOptions {
  readOutLoud?: boolean;
  voiceMuted?: boolean;
  speechRate?: number;
}

export interface InAppReminderDetail {
  id: string;
  title: string;
  body: string;
  spokenText: string;
  task: Task;
  minutesMessage: string;
  timestamp: number;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Format spoken reminder message for crystal-clear natural speech synthesis
 */
export function formatSpokenReminderText(task: Task, minutesMessage: string): string {
  const cleanTitle = task.title.trim();
  let timeClause = '';

  if (minutesMessage.toLowerCase().includes('due now') || minutesMessage.toLowerCase().includes('due right now')) {
    timeClause = 'is due right now';
  } else if (minutesMessage.toLowerCase().includes('5 minute')) {
    timeClause = 'is coming up in five minutes';
  } else if (minutesMessage.toLowerCase().includes('10 minute')) {
    timeClause = 'starts in ten minutes';
  } else if (minutesMessage.toLowerCase().includes('30 minute')) {
    timeClause = 'starts in thirty minutes';
  } else if (minutesMessage.toLowerCase().includes('in ')) {
    timeClause = `is scheduled ${minutesMessage.toLowerCase()}`;
  } else {
    timeClause = `is due ${minutesMessage.toLowerCase()}`;
  }

  let text = `Reminder alert: ${cleanTitle} ${timeClause}.`;

  if (task.category && task.category !== 'General') {
    text += ` Category: ${task.category}.`;
  }

  if (task.description && task.description.trim().length > 0) {
    const preview = task.description.trim().slice(0, 90).replace(/https?:\/\/\S+/g, '');
    if (preview.length > 0) {
      text += ` Note: ${preview}.`;
    }
  }

  return text;
}

/**
 * Trigger task reminder with sound, speech synthesis readout, system notification, and in-app banner
 */
export function showTaskNotification(
  task: Task,
  minutesMessage: string,
  options?: SpokenReminderOptions
) {
  // 1. Play alert chime
  playPopSound(true);

  // 2. Prepare speech text
  const spokenText = formatSpokenReminderText(task, minutesMessage);

  // 3. Read Out Loud reminder via Web Speech Synthesis if enabled
  const shouldReadAloud = options?.readOutLoud !== false && !options?.voiceMuted;
  if (shouldReadAloud && isSpeechSynthesisSupported()) {
    speakText(spokenText, false, undefined, options?.speechRate || 1.0);
  }

  // 4. Native Browser / System Notification (if allowed)
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      new Notification(`Reminder: ${task.title}`, {
        body: `${minutesMessage} • Category: ${task.category || 'Work'} ${task.startTime ? `at ${task.startTime}` : ''}`,
        icon: '/favicon.ico',
        tag: `task-${task.id}`,
      });
    } catch (e) {
      console.debug('Native Notification trigger failed', e);
    }
  }

  // 5. In-App Interactive Notification Banner
  const notificationId = `notif-${Date.now()}-${task.id}`;
  const customEvent = new CustomEvent<InAppReminderDetail>('in-app-notification', {
    detail: {
      id: notificationId,
      title: `Reminder: ${task.title}`,
      body: `${minutesMessage} • Category: ${task.category || 'General'}`,
      spokenText,
      task,
      minutesMessage,
      timestamp: Date.now(),
    },
  });
  window.dispatchEvent(customEvent);
}

/**
 * Check all active task reminders against the current clock
 */
export function checkTaskReminders(tasks: Task[], options?: SpokenReminderOptions): string[] {
  const now = new Date();
  const firedReminderIds: string[] = [];

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  tasks.forEach((task) => {
    if (task.completed || !task.date || !task.startTime || !task.reminder) return;
    if (task.date !== todayStr) return;
    if (task.reminder.notified) return;

    const [hours, minutes] = task.startTime.split(':').map(Number);
    const taskDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    let offsetMinutes = 0;
    let label = 'Due right now';

    if (task.reminder.type === 'at_time') {
      offsetMinutes = 0;
      label = 'Due right now';
    } else if (task.reminder.type === '5m') {
      offsetMinutes = 5;
      label = 'In 5 minutes';
    } else if (task.reminder.type === '10m') {
      offsetMinutes = 10;
      label = 'In 10 minutes';
    } else if (task.reminder.type === '30m') {
      offsetMinutes = 30;
      label = 'In 30 minutes';
    } else if (task.reminder.type === 'custom' && task.reminder.minutesBefore) {
      offsetMinutes = task.reminder.minutesBefore;
      label = `In ${offsetMinutes} minutes`;
    }

    const reminderTime = new Date(taskDate.getTime() - offsetMinutes * 60 * 1000);
    const diffMs = now.getTime() - reminderTime.getTime();

    // Trigger if within a 2-minute window from the target reminder time
    if (diffMs >= 0 && diffMs < 120000) {
      showTaskNotification(task, label, options);
      firedReminderIds.push(task.id);
    }
  });

  return firedReminderIds;
}

/**
 * Test function allowing user to immediately experience a spoken reminder readout
 */
export function testSpokenReminder(options?: SpokenReminderOptions) {
  const sampleTask: Task = {
    id: `sample-${Date.now()}`,
    title: 'Review Project Launch Strategy',
    description: 'Double-check final milestones, confirm team priorities, and prepare brief.',
    category: 'Work',
    priority: 'high',
    date: new Date().toISOString().slice(0, 10),
    startTime: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
    completed: false,
    order: 0,
    subtasks: [],
    createdAt: new Date().toISOString(),
    reminder: {
      type: '5m',
      notified: false,
    },
  };

  showTaskNotification(sampleTask, 'In 5 minutes', options);
}
