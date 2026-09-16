import { Task } from '../types';
import { playPopSound } from './sound';

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

export function showTaskNotification(task: Task, minutesMessage: string) {
  playPopSound(true);

  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      new Notification(`Reminder: ${task.title}`, {
        body: `${minutesMessage} • Category: ${task.category}`,
        icon: '/favicon.ico',
      });
      return;
    } catch (e) {
      console.debug('Notification trigger failed', e);
    }
  }

  // Fallback in-app broadcast event
  const customEvent = new CustomEvent('in-app-notification', {
    detail: {
      title: `Reminder: ${task.title}`,
      body: `${minutesMessage} (${task.startTime || 'Today'})`,
      task,
    },
  });
  window.dispatchEvent(customEvent);
}

export function checkTaskReminders(tasks: Task[]): string[] {
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
    let label = 'Due now';
    if (task.reminder.type === '5m') {
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

    // Trigger if within the window of 0 to 60 seconds
    if (diffMs >= 0 && diffMs < 60000) {
      showTaskNotification(task, label);
      firedReminderIds.push(task.id);
    }
  });

  return firedReminderIds;
}
