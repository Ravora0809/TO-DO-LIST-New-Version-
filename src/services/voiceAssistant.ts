import { Task, StickyNote, VoiceAssistantAction } from '../types';
import { parseNaturalTaskInput } from './nlp';
import {
  searchHolidays,
  getUpcomingHolidays,
  getHolidaysForDate,
  getHolidaysForMonth,
} from './holidays';

// Check Web Speech API availability
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

// Speak text using Web Speech API Synthesis
export function speakText(text: string, muted = false, onEnd?: () => void): void {
  if (muted || !isSpeechSynthesisSupported()) {
    onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel(); // cancel any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;

    // Pick best natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Zira') || v.name.includes('Ava'))) ||
        v.lang === 'en-US' ||
        v.lang === 'en-GB'
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.05;
    utterance.pitch = 1.02;
    utterance.volume = 0.95;

    utterance.onend = () => {
      activeUtterance = null;
      onEnd?.();
    };

    utterance.onerror = () => {
      activeUtterance = null;
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('SpeechSynthesis error:', e);
    onEnd?.();
  }
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
      activeUtterance = null;
    } catch (e) {
      // ignore
    }
  }
}

// Generate Personalized Voice Greeting & Briefing
export interface BriefingData {
  timeGreeting: string; // "Good morning" | "Good afternoon" | "Good evening" | "Good night"
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  spokenGreeting: string;
  todayTasksCount: number;
  overdueTasksCount: number;
  firstTaskTime?: string;
  firstTaskTitle?: string;
  highestPriorityTask?: Task;
}

export function getGreetingBriefing(username: string, tasks: Task[]): BriefingData {
  const now = new Date();
  const hour = now.getHours();

  // 1. Detect morning, afternoon, evening, and night
  let timeGreeting = 'Good morning';
  let period: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';

  if (hour >= 5 && hour < 12) {
    timeGreeting = 'Good morning';
    period = 'morning';
  } else if (hour >= 12 && hour < 17) {
    timeGreeting = 'Good afternoon';
    period = 'afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeGreeting = 'Good evening';
    period = 'evening';
  } else {
    timeGreeting = 'Good night';
    period = 'night';
  }

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  // Filter today's pending tasks and overdue tasks
  const todayTasks = tasks.filter((t) => t.date === todayStr && !t.completed);
  const overdueTasks = tasks.filter((t) => !t.completed && t.date && t.date < todayStr);

  // First scheduled task today by time
  const scheduledToday = [...todayTasks]
    .filter((t) => t.startTime)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const firstTask = scheduledToday[0];
  const highPriority = todayTasks.find((t) => t.priority === 'high');

  // Format first task time: "09:00" -> "9 AM"
  let timeReadable = '';
  if (firstTask?.startTime) {
    const [h, min] = firstTask.startTime.split(':');
    const hNum = parseInt(h, 10);
    const ampm = hNum >= 12 ? 'PM' : 'AM';
    const displayHour = hNum % 12 || 12;
    timeReadable = min === '00' ? `${displayHour} ${ampm}` : `${displayHour}:${min} ${ampm}`;
  }

  // Keep greeting crisp & strictly under 5 seconds
  let spokenGreeting = '';
  if (todayTasks.length === 0) {
    spokenGreeting = `${timeGreeting}, ${username}! You have 0 tasks today. Your workspace is clear.`;
  } else if (overdueTasks.length > 0) {
    spokenGreeting = `${timeGreeting}, ${username}! You have ${todayTasks.length} ${todayTasks.length === 1 ? 'task' : 'tasks'} today, and ${overdueTasks.length} overdue.`;
  } else if (firstTask && timeReadable) {
    spokenGreeting = `${timeGreeting}, ${username}! You have ${todayTasks.length} ${todayTasks.length === 1 ? 'task' : 'tasks'} today. First starts at ${timeReadable}.`;
  } else if (highPriority) {
    const shortTitle = highPriority.title.length > 20 ? highPriority.title.slice(0, 18) + '...' : highPriority.title;
    spokenGreeting = `${timeGreeting}, ${username}! You have ${todayTasks.length} ${todayTasks.length === 1 ? 'task' : 'tasks'} today, focusing on ${shortTitle}.`;
  } else {
    spokenGreeting = `${timeGreeting}, ${username}! You have ${todayTasks.length} ${todayTasks.length === 1 ? 'task' : 'tasks'} today. Ready to get started?`;
  }

  return {
    timeGreeting,
    period,
    spokenGreeting,
    todayTasksCount: todayTasks.length,
    overdueTasksCount: overdueTasks.length,
    firstTaskTime: firstTask?.startTime,
    firstTaskTitle: firstTask?.title,
    highestPriorityTask: highPriority || todayTasks[0],
  };
}

function formatCurrentTime(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

// Convert Recognized Voice Commands to Actions
export function parseVoiceCommand(
  transcript: string,
  tasks: Task[],
  notes: StickyNote[] = []
): VoiceAssistantAction {
  const rawText = transcript.trim();
  // Strip common punctuation and normalize spaces
  const clean = rawText
    .toLowerCase()
    .replace(/[?!.,;:"'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  const todayTasks = tasks.filter((t) => t.date === todayStr && !t.completed);
  const totalPending = tasks.filter((t) => !t.completed).length;
  const overdueTasks = tasks.filter((t) => !t.completed && t.date && t.date < todayStr);

  // Helper formatting for task list
  const formatTaskListResponse = (intro: string): string => {
    if (todayTasks.length === 0) {
      if (totalPending > 0) {
        return `You have 0 tasks scheduled for today, but you have ${totalPending} pending ${totalPending === 1 ? 'task' : 'tasks'} overall.`;
      }
      return 'You have 0 tasks left today. Your workspace is completely clear!';
    }
    const countPhrase = todayTasks.length === 1 ? '1 task left today' : `${todayTasks.length} tasks left today`;
    const titles = todayTasks.slice(0, 3).map((t) => t.title).join(', ');
    const more = todayTasks.length > 3 ? ` and ${todayTasks.length - 3} more` : '';
    return `${intro} You have ${countPhrase}: ${titles}${more}.`;
  };

  // 1. Time query + Tasks left query (e.g. "what is time right now how many task left", "what's the time and how many tasks left")
  const hasTimeKeyword = /\b(time|clock|hour)\b/i.test(clean);
  const hasTaskKeyword = /\b(tasks?|todos?|work|item|items)\b/i.test(clean);
  const hasLeftKeyword = /\b(left|remain|remaining|pending|scheduled)\b/i.test(clean);

  if (hasTimeKeyword && (hasTaskKeyword || hasLeftKeyword)) {
    const timeStr = formatCurrentTime();
    if (todayTasks.length === 0) {
      return {
        type: 'query_time_and_tasks',
        spokenResponse: `The time is ${timeStr}, and you have 0 tasks left today. Your workspace is clear!`,
      };
    }
    const countPhrase = todayTasks.length === 1 ? '1 task left today' : `${todayTasks.length} tasks left today`;
    const firstTitle = todayTasks[0]?.title ? ` First is "${todayTasks[0].title}".` : '';
    return {
      type: 'query_time_and_tasks',
      spokenResponse: `The time is ${timeStr}, and you have ${countPhrase}.${firstTitle}`,
    };
  }

  // 2. Just Time query (e.g. "what is time right now", "what time is it", "tell me the time")
  if (
    /^(what is (the )?time|what time is it|whats the time|current time|tell me (the )?time|time right now|what time now|the time right now|time please)/i.test(clean) ||
    clean === 'time' ||
    clean === 'what time'
  ) {
    const timeStr = formatCurrentTime();
    return {
      type: 'query_time',
      spokenResponse: `The time is ${timeStr}.`,
    };
  }

  // 3. Query Tasks Left / Status / Count / List (handles "do i have any task left", "any task left", "how many task left", etc.)
  const isTaskLeftQuery =
    /do i have (any )?(tasks?|todos?|work)( left| remaining| today)?/i.test(clean) ||
    /have i got (any )?(tasks?|todos?)( left)?/i.test(clean) ||
    /(is there|are there) (any )?(tasks?|todos?)( left| remaining)?/i.test(clean) ||
    /any (tasks?|todos?|work) (left|remaining|pending|today)/i.test(clean) ||
    /^(any )?(tasks?|todos?) left$/i.test(clean) ||
    /how many (tasks?|todos?|items?) (do i have|are there|are left|left|remaining)/i.test(clean) ||
    /how many (tasks?|todos?) (i have|left|remaining)/i.test(clean) ||
    /^how many (tasks?|todos?)$/i.test(clean) ||
    /what (tasks?|todos?) (are )?left/i.test(clean) ||
    /what (are|is) my (tasks?|todos?)( today)?/i.test(clean) ||
    /what do i have (today|left|to do)/i.test(clean) ||
    /do i have anything (left|to do|pending)/i.test(clean) ||
    /^(anything left|anything to do|am i done|am i finished)( today)?$/i.test(clean) ||
    /^(show|tell me|check|list|get) (my )?(tasks?|todos?)( today| left)?$/i.test(clean) ||
    clean === 'my tasks' ||
    clean === 'tasks today' ||
    clean === 'task left' ||
    clean === 'tasks left' ||
    clean === 'do i have tasks';

  if (isTaskLeftQuery) {
    if (todayTasks.length === 0) {
      if (totalPending > 0) {
        return {
          type: 'query_tasks',
          spokenResponse: `No tasks scheduled for today, but you have ${totalPending} pending ${totalPending === 1 ? 'task' : 'tasks'} overall.`,
        };
      }
      return {
        type: 'query_tasks',
        spokenResponse: 'No, you have 0 tasks left today. Your workspace is completely clear!',
      };
    }
    const intro = todayTasks.length === 1 ? 'Yes, you have 1 task left today:' : `Yes, you have ${todayTasks.length} tasks left today:`;
    return {
      type: 'query_tasks',
      payload: 'today',
      spokenResponse: formatTaskListResponse(intro),
    };
  }

  // 4. Overdue tasks query ("any overdue tasks", "what is overdue", "do i have overdue tasks")
  if (/\b(overdue|late|missed)\b/i.test(clean) && (hasTaskKeyword || clean.includes('overdue'))) {
    if (overdueTasks.length === 0) {
      return {
        type: 'query_overdue',
        spokenResponse: 'You have no overdue tasks. Great job staying on track!',
      };
    }
    const titles = overdueTasks.slice(0, 2).map((t) => t.title).join(', ');
    return {
      type: 'query_overdue',
      spokenResponse: `You have ${overdueTasks.length} overdue ${overdueTasks.length === 1 ? 'task' : 'tasks'}: ${titles}.`,
    };
  }

  // 5. Query next task ("what's my next task?", "next task", "what do i do next")
  if (
    /what is my next task|whats my next task|next task|what should i do next|what do i do next|upcoming task|whats next|what is next/i.test(clean)
  ) {
    const scheduled = [...todayTasks].sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));

    if (scheduled.length === 0) {
      return {
        type: 'query_next',
        spokenResponse: 'You have no upcoming tasks scheduled for today.',
      };
    }
    const next = scheduled[0];
    const atTime = next.startTime ? ` at ${next.startTime}` : '';
    return {
      type: 'query_next',
      payload: next,
      spokenResponse: `Your next task is "${next.title}"${atTime}.`,
    };
  }

  // 6. Festival & Holiday Queries (e.g. "when is diwali", "upcoming festivals", "what holiday is next", "is today a holiday")
  const isHolidayQuery =
    /\b(festivals?|holidays?|celebrations?|dates?|diwali|holi|eid|christmas|halloween|thanksgiving|easter|new year|republic day|independence day)\b/i.test(
      clean
    );

  if (isHolidayQuery) {
    // A. "when is [festival]" (e.g. "when is diwali", "when is thanksgiving")
    const whenMatch = clean.match(
      /(?:when is|what date is|when is the|date of)\s+(?:the\s+)?([a-z0-9\s'-]+)/i
    );
    if (whenMatch && whenMatch[1]) {
      const festivalName = whenMatch[1].replace(/\b(next|this year|in 2026|coming up)\b/gi, '').trim();
      const results = searchHolidays(festivalName, now.getFullYear());
      if (results.length > 0) {
        const found = results[0];
        const [y, m, d] = found.date.split('-').map(Number);
        const eventD = new Date(y, m - 1, d);
        const formattedDate = eventD.toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        return {
          type: 'query_holidays',
          payload: found,
          spokenResponse: `${found.name} is on ${formattedDate}. ${found.description}`,
        };
      }
    }

    // B. "is today a holiday" or "holiday today"
    if (/\b(today)\b/i.test(clean) && /\b(holiday|festival)\b/i.test(clean)) {
      const todayHolidays = getHolidaysForDate(todayStr);
      if (todayHolidays.length > 0) {
        const h = todayHolidays[0];
        return {
          type: 'query_holidays',
          payload: h,
          spokenResponse: `Yes, today is ${h.name}! ${h.description}`,
        };
      } else {
        const nextUp = getUpcomingHolidays(todayStr, 1);
        const nextPhrase =
          nextUp.length > 0
            ? ` Your next upcoming festival is ${nextUp[0].name} on ${nextUp[0].date}.`
            : '';
        return {
          type: 'query_holidays',
          spokenResponse: `There are no public holidays or festivals today.${nextPhrase}`,
        };
      }
    }

    // C. "upcoming festivals", "what festival is next", "holidays this month", "show holidays"
    if (
      /\b(upcoming|next|soon|this month|what festival|what holiday|show festivals|list festivals)\b/i.test(
        clean
      ) ||
      clean === 'festivals' ||
      clean === 'holidays'
    ) {
      const upcoming = getUpcomingHolidays(todayStr, 3);
      if (upcoming.length > 0) {
        const listStr = upcoming
          .map((h) => {
            const [y, m, d] = h.date.split('-').map(Number);
            const dateStr = new Date(y, m - 1, d).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            });
            return `${h.name} on ${dateStr}`;
          })
          .join(', ');
        return {
          type: 'query_holidays',
          payload: upcoming,
          spokenResponse: `Upcoming festivals: ${listStr}. Opening the calendar for full dates.`,
        };
      }
    }
  }

  // 7. Navigation Commands (Calendar, Planner, Tasks, Notes, Dashboard, Settings, Stats)
  if (/\b(calendar)\b/i.test(clean) && (/\b(show|open|go to|view|see)\b/i.test(clean) || clean === 'calendar' || clean === 'open calendar')) {
    return {
      type: 'open_view',
      payload: 'calendar',
      spokenResponse: 'Opening calendar.',
    };
  }

  if (
    /\b(planner|schedule|timeline)\b/i.test(clean) &&
    (/\b(show|open|go to|view|see)\b/i.test(clean) || clean === 'schedule' || clean === 'planner' || clean === 'view schedule')
  ) {
    return {
      type: 'open_view',
      payload: 'planner',
      spokenResponse: 'Opening schedule planner.',
    };
  }

  if (
    /\b(task list|all tasks|todo list)\b/i.test(clean) &&
    /\b(show|open|go to|view)\b/i.test(clean)
  ) {
    return {
      type: 'open_view',
      payload: 'tasks',
      spokenResponse: 'Opening task list.',
    };
  }

  if (
    /\b(sticky notes?|stickies|notes)\b/i.test(clean) &&
    (/\b(show|open|go to|view|board)\b/i.test(clean) || clean === 'notes' || clean === 'sticky notes')
  ) {
    return {
      type: 'open_view',
      payload: 'notes',
      spokenResponse: 'Opening sticky notes.',
    };
  }

  if (
    /\b(dashboard|home)\b/i.test(clean) &&
    (/\b(show|open|go to|view)\b/i.test(clean) || clean === 'dashboard' || clean === 'home')
  ) {
    return {
      type: 'open_view',
      payload: 'dashboard',
      spokenResponse: 'Opening dashboard.',
    };
  }

  if (/\b(productivity|stats|analytics|progress)\b/i.test(clean)) {
    return {
      type: 'open_view',
      payload: 'productivity',
      spokenResponse: 'Here are your productivity metrics.',
    };
  }

  if (/\b(settings|preferences)\b/i.test(clean) && /\b(show|open|go to|view)\b/i.test(clean)) {
    return {
      type: 'open_view',
      payload: 'settings',
      spokenResponse: 'Opening settings.',
    };
  }

  // 7. Complete task ("mark this task complete", "mark study react complete", "complete task")
  if (
    /^(mark (this )?task (as )?complete|complete this task|check off this task|finish this task|done with this task)$/i.test(clean)
  ) {
    if (todayTasks.length > 0) {
      const target = todayTasks[0];
      return {
        type: 'complete_task',
        payload: target.id,
        spokenResponse: `Marked "${target.title}" complete.`,
      };
    }
    return {
      type: 'unknown',
      spokenResponse: 'You have no pending tasks to mark complete.',
    };
  }

  const completeNamedMatch = clean.match(/(?:mark|complete|check off|done with|finish)\s+(?:task\s+)?(.+?)(?:\s+(?:as\s+)?(?:completed|done|finished))?$/i);
  if (completeNamedMatch && completeNamedMatch[1]) {
    const query = completeNamedMatch[1].replace(/as\s+(completed|done)/i, '').trim();
    if (query && query !== 'this' && query !== 'this task' && query !== 'a task') {
      const found = tasks.find(
        (t) => !t.completed && t.title.toLowerCase().includes(query)
      );
      if (found) {
        return {
          type: 'complete_task',
          payload: found.id,
          spokenResponse: `Marked "${found.title}" complete.`,
        };
      }
    }
  }

  // 8. Move / Reschedule task ("move this task to 5 PM", "move meeting to 5 PM", "reschedule study to 5 PM")
  const moveMatch = clean.match(/(?:move|reschedule|change)\s+(?:(this\s+task|my\s+task|task)|(.+?))\s+to\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (moveMatch) {
    const targetQuery = (moveMatch[2] || moveMatch[1] || '').trim();
    const timeRaw = (moveMatch[3] || '').trim();

    let hours = 0;
    let mins = '00';
    const isPM = /pm/i.test(timeRaw);
    const isAM = /am/i.test(timeRaw);
    const digits = timeRaw.replace(/(am|pm)/i, '').trim();
    if (digits.includes(':')) {
      const [h, m] = digits.split(':');
      hours = parseInt(h, 10);
      mins = m;
    } else {
      hours = parseInt(digits, 10);
    }
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    const formattedTime = `${String(hours).padStart(2, '0')}:${mins}`;

    let targetTask: Task | undefined;
    if (targetQuery === 'this task' || targetQuery === 'this' || targetQuery === 'task' || !targetQuery) {
      targetTask = todayTasks[0];
    } else {
      targetTask = tasks.find((t) => !t.completed && t.title.toLowerCase().includes(targetQuery));
    }

    if (targetTask) {
      return {
        type: 'move_task',
        payload: { taskId: targetTask.id, time: formattedTime },
        spokenResponse: `Moved "${targetTask.title}" to ${timeRaw.toUpperCase()}.`,
      };
    }
  }

  // 9. Delete task with confirmation ("delete task [title]", "delete this task")
  const deleteTaskMatch = clean.match(/^(?:delete|remove)\s+(?:task\s+)?(.+)$/i);
  if (deleteTaskMatch && !clean.includes('note')) {
    const query = deleteTaskMatch[1].trim();
    let targetTask: Task | undefined;
    if (query === 'this' || query === 'this task') {
      targetTask = todayTasks[0];
    } else {
      targetTask = tasks.find((t) => t.title.toLowerCase().includes(query));
    }

    if (targetTask) {
      return {
        type: 'delete_task',
        payload: targetTask.id,
        spokenResponse: `Are you sure you want to delete "${targetTask.title}"?`,
        requiresConfirmation: true,
        confirmationPrompt: `Delete task "${targetTask.title}"?`,
      };
    }
  }

  // 10. Delete sticky note with confirmation ("delete note [title]", "delete sticky note [title]")
  const deleteNoteMatch = clean.match(/^(?:delete|remove)\s+(?:sticky\s+)?note\s*(.*)$/i);
  if (deleteNoteMatch && (clean.includes('note') || clean.includes('sticky'))) {
    const query = deleteNoteMatch[1]?.trim();
    const targetNote = query
      ? notes.find((n) => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query))
      : notes[0];

    if (targetNote) {
      return {
        type: 'delete_note',
        payload: targetNote.id,
        spokenResponse: `Are you sure you want to delete the note "${targetNote.title}"?`,
        requiresConfirmation: true,
        confirmationPrompt: `Delete note "${targetNote.title}"?`,
      };
    }
  }

  // 11. Add Sticky note ("add a sticky note", "add sticky note buy groceries")
  const noteMatch = rawText.match(/(?:add|create|make|write|note\s+down)\s+(?:a\s+)?(?:sticky\s+)?note(?:\s+(.+))?$/i);
  if (noteMatch && (clean.includes('note') || clean.includes('sticky'))) {
    const noteContent = noteMatch[1]?.trim() || 'New note from voice';
    return {
      type: 'add_note',
      payload: { content: noteContent },
      spokenResponse: `Added sticky note: "${noteContent}".`,
    };
  }

  // 12. Add Task command (e.g. "Add a task", "Add study React at 7 PM", "Create task review code")
  const addTaskMatch = rawText.match(/^(?:add|create|new|schedule|remind\s+me\s+to)\s+(?:a\s+)?task(?:\s+(.+))?$/i);
  if (addTaskMatch) {
    const taskInput = addTaskMatch[1]?.trim();
    if (!taskInput) {
      return {
        type: 'open_view',
        payload: 'open_task_modal',
        spokenResponse: 'Opening new task form.',
      };
    }
    const parsed = parseNaturalTaskInput(taskInput);
    const timeMention = parsed.startTime ? ` at ${parsed.startTime}` : '';
    return {
      type: 'add_task',
      payload: parsed,
      spokenResponse: `Added "${parsed.title}"${timeMention}.`,
    };
  }

  // 13. Natural task phrasing starting with "add ..." or "schedule ..." or "remind me to ..."
  if (/^(add|schedule|remind me to)\s+/i.test(rawText)) {
    const raw = rawText.replace(/^(add|schedule|remind me to)\s+/i, '').trim();
    const parsed = parseNaturalTaskInput(raw);
    const timeMention = parsed.startTime ? ` at ${parsed.startTime}` : '';
    return {
      type: 'add_task',
      payload: parsed,
      spokenResponse: `Added "${parsed.title}"${timeMention}.`,
    };
  }

  // 14. Friendly Courtesies & Help
  if (/^(hello|hi|hey|good (morning|afternoon|evening|night))/i.test(clean)) {
    return {
      type: 'unknown',
      spokenResponse: `Hello! You have ${todayTasks.length} ${todayTasks.length === 1 ? 'task' : 'tasks'} today. How can I help you?`,
    };
  }

  if (/^(thank you|thanks|great|awesome)/i.test(clean)) {
    return {
      type: 'unknown',
      spokenResponse: "You're welcome! Let me know if you need anything else.",
    };
  }

  if (/^(help|what can you do|who are you|capabilities)/i.test(clean)) {
    return {
      type: 'unknown',
      spokenResponse: "I can check your remaining tasks, tell you the time, add tasks like 'Add study React at 7 PM', mark tasks complete, or add sticky notes.",
    };
  }

  // 15. Intelligent Fallback: if user mentioned tasks or todos in any way, answer with task status rather than an error!
  if (hasTaskKeyword) {
    if (todayTasks.length === 0) {
      return {
        type: 'query_tasks',
        spokenResponse: `I noticed you asked about your tasks. You currently have 0 tasks left today. Would you like to add one?`,
      };
    }
    const titles = todayTasks.slice(0, 2).map((t) => t.title).join(', ');
    return {
      type: 'query_tasks',
      spokenResponse: `You have ${todayTasks.length} ${todayTasks.length === 1 ? 'task' : 'tasks'} left today, including ${titles}.`,
    };
  }

  // 16. Fallback with helpful guidance
  return {
    type: 'unknown',
    spokenResponse: `I heard: "${rawText}". Try asking "do I have any tasks left?", "what is the time?", or "add study React at 7 PM".`,
  };
}
