import { Task, StickyNote, UserSettings, Priority, RecurringConfig } from '../types';

const TASKS_KEY = 'productivity_tasks_v2';
const NOTES_KEY = 'productivity_notes_v2';
const SETTINGS_KEY = 'productivity_settings_v2';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  soundEnabled: true,
  notificationsEnabled: true,
  defaultPriority: 'medium',
  defaultCategory: 'Work',
  startHour: 8,
  endHour: 20,
  name: 'Ravora',
  voiceAssistantEnabled: true,
  voiceMuted: false,
  autoGreetOnOpen: true,
  readOutLoudReminders: true,
  spokenReminderVoiceSpeed: 1.0,
};

// Pure neutral clean zero initialization - no dummy/sample tasks or notes
export function generateSeedTasks(): Task[] {
  return [];
}

export function generateSeedNotes(): StickyNote[] {
  return [];
}

export function loadTasks(): Task[] {
  try {
    // Clear any previous pre-seeded demo tasks from v1
    localStorage.removeItem('productivity_tasks_v1');
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      saveTasks([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load tasks from localStorage', e);
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks to localStorage', e);
  }
}

export function loadNotes(): StickyNote[] {
  try {
    // Clear any previous pre-seeded demo notes from v1
    localStorage.removeItem('productivity_notes_v1');
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) {
      saveNotes([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load notes from localStorage', e);
    return [];
  }
}

export function saveNotes(notes: StickyNote[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save notes to localStorage', e);
  }
}

export function clearAllData(): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify([]));
    localStorage.setItem(NOTES_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear data in localStorage', e);
  }
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    const merged: UserSettings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      name: 'Ravora',
      voiceAssistantEnabled: parsed.voiceAssistantEnabled !== undefined ? parsed.voiceAssistantEnabled : true,
      voiceMuted: parsed.voiceMuted !== undefined ? parsed.voiceMuted : false,
      autoGreetOnOpen: parsed.autoGreetOnOpen !== undefined ? parsed.autoGreetOnOpen : true,
      readOutLoudReminders: parsed.readOutLoudReminders !== undefined ? parsed.readOutLoudReminders : true,
      spokenReminderVoiceSpeed: parsed.spokenReminderVoiceSpeed || 1.0,
    };
    return merged;
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export function computeNextRecurringDate(dateStr: string, recurring: RecurringConfig): string {
  const current = new Date(dateStr + 'T00:00:00');
  if (isNaN(current.getTime())) return dateStr;

  const next = new Date(current);
  switch (recurring.type) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekdays': {
      const day = next.getDay();
      if (day === 5) {
        // Friday -> next is Monday (+3)
        next.setDate(next.getDate() + 3);
      } else if (day === 6) {
        // Saturday -> next is Monday (+2)
        next.setDate(next.getDate() + 2);
      } else {
        next.setDate(next.getDate() + 1);
      }
      break;
    }
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'custom':
      next.setDate(next.getDate() + (recurring.interval || 1));
      break;
  }

  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, '0');
  const d = String(next.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
