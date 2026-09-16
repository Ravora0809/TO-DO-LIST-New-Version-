import { Priority, RecurringConfig } from '../types';

export interface ParsedTaskInput {
  title: string;
  date?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  priority?: Priority;
  category?: string;
  recurring?: RecurringConfig;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseNaturalTaskInput(input: string): ParsedTaskInput {
  let text = input.trim();
  const result: ParsedTaskInput = {
    title: text,
  };

  if (!text) return result;

  // 1. Extract Priority: !high, !med, !medium, !low, !p1, !p2, !p3
  const priorityMatch = text.match(/(?:^|\s)(?:!|p:)(high|p1|urgent|medium|med|p2|low|p3)(?:\s|$)/i);
  if (priorityMatch) {
    const p = priorityMatch[1].toLowerCase();
    if (p === 'high' || p === 'p1' || p === 'urgent') result.priority = 'high';
    else if (p === 'medium' || p === 'med' || p === 'p2') result.priority = 'medium';
    else if (p === 'low' || p === 'p3') result.priority = 'low';
    text = text.replace(priorityMatch[0], ' ');
  }

  // 2. Extract Category: #Work, #Personal, etc.
  const categoryMatch = text.match(/(?:^|\s)#([a-zA-Z0-9_\-]+)/);
  if (categoryMatch) {
    result.category = categoryMatch[1].charAt(0).toUpperCase() + categoryMatch[1].slice(1);
    text = text.replace(categoryMatch[0], ' ');
  }

  // 3. Extract Recurring: "every day", "daily", "every weekday", "every week", "weekly", "every month"
  const recurringDailyMatch = text.match(/(?:^|\s)(?:every\s+day|daily)(?:\s|$)/i);
  if (recurringDailyMatch) {
    result.recurring = { type: 'daily' };
    text = text.replace(recurringDailyMatch[0], ' ');
  } else {
    const recurringWeekdayMatch = text.match(/(?:^|\s)(?:every\s+weekday|on\s+weekdays)(?:\s|$)/i);
    if (recurringWeekdayMatch) {
      result.recurring = { type: 'weekdays' };
      text = text.replace(recurringWeekdayMatch[0], ' ');
    } else {
      const recurringWeeklyMatch = text.match(/(?:^|\s)(?:every\s+week|weekly)(?:\s|$)/i);
      if (recurringWeeklyMatch) {
        result.recurring = { type: 'weekly' };
        text = text.replace(recurringWeeklyMatch[0], ' ');
      } else {
        const recurringMonthlyMatch = text.match(/(?:^|\s)(?:every\s+month|monthly)(?:\s|$)/i);
        if (recurringMonthlyMatch) {
          result.recurring = { type: 'monthly' };
          text = text.replace(recurringMonthlyMatch[0], ' ');
        }
      }
    }
  }

  // 4. Extract Date: "today", "tomorrow", "tmrw", "next monday/tue...", "on monday..."
  const today = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNamesShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  let matchedDate: Date | null = null;

  if (/(?:^|\s)(?:today|tonight)(?:\s|$)/i.test(text)) {
    matchedDate = new Date(today);
    text = text.replace(/(?:^|\s)(?:today|tonight)(?:\s|$)/i, ' ');
  } else if (/(?:^|\s)(?:tomorrow|tmrw)(?:\s|$)/i.test(text)) {
    matchedDate = new Date(today);
    matchedDate.setDate(today.getDate() + 1);
    text = text.replace(/(?:^|\s)(?:tomorrow|tmrw)(?:\s|$)/i, ' ');
  } else if (/(?:^|\s)in\s+(\d+)\s+days?(?:\s|$)/i.test(text)) {
    const daysMatch = text.match(/(?:^|\s)in\s+(\d+)\s+days?(?:\s|$)/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      matchedDate = new Date(today);
      matchedDate.setDate(today.getDate() + days);
      text = text.replace(daysMatch[0], ' ');
    }
  } else {
    // Check for "next [day]" or "on [day]" or just "[day]"
    const dayRegex = new RegExp(`(?:^|\\s)(?:(?:next|this|on)\\s+)?(${dayNames.join('|')}|${dayNamesShort.join('|')})(?:\\s|$)`, 'i');
    const dayMatch = text.match(dayRegex);
    if (dayMatch) {
      const dayStr = dayMatch[1].toLowerCase();
      let targetDayIndex = dayNames.indexOf(dayStr);
      if (targetDayIndex === -1) {
        targetDayIndex = dayNamesShort.indexOf(dayStr);
      }
      if (targetDayIndex !== -1) {
        matchedDate = new Date(today);
        const currentDayIndex = today.getDay();
        let daysUntil = (targetDayIndex - currentDayIndex + 7) % 7;
        if (daysUntil === 0) daysUntil = 7; // Next occurrence
        matchedDate.setDate(today.getDate() + daysUntil);
        text = text.replace(dayMatch[0], ' ');
      }
    }
  }

  if (matchedDate) {
    result.date = formatDate(matchedDate);
  }

  // 5. Extract Time: "at 10 AM", "at 10:30pm", "at 3 pm", "14:00", "at 5"
  const timeMatch = text.match(/(?:^|\s)(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?:\s|$)/i);
  if (timeMatch && (timeMatch[0].toLowerCase().includes('at') || timeMatch[3] || timeMatch[2])) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const modifier = timeMatch[3]?.toLowerCase();

    if (modifier === 'pm' && hours < 12) hours += 12;
    if (modifier === 'am' && hours === 12) hours = 0;

    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      const startH = String(hours).padStart(2, '0');
      const startM = String(minutes).padStart(2, '0');
      result.startTime = `${startH}:${startM}`;
      
      // Default end time 1 hour later
      const endHour = (hours + 1) % 24;
      result.endTime = `${String(endHour).padStart(2, '0')}:${startM}`;

      // If no date was specified but time is specified, default to today
      if (!result.date) {
        result.date = formatDate(today);
      }

      text = text.replace(timeMatch[0], ' ');
    }
  }

  // Clean title: remove leftover extra spaces
  result.title = text.replace(/\s+/g, ' ').trim();
  if (!result.title) {
    result.title = input.trim();
  }

  return result;
}
