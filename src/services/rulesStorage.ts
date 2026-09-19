import { WorkRule } from '../types';

export const DEFAULT_RULES: WorkRule[] = [
  {
    id: 'rule-2-minute',
    title: 'The 2-Minute Rule',
    description: 'If an incoming task or subtask takes less than 2 minutes to complete, execute it immediately instead of scheduling or postponing it.',
    category: 'Focus & Time',
    strictness: 'mandatory',
    icon: 'Clock',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule-single-tasking',
    title: 'Single-Tasking Discipline',
    description: 'Work on only one active task at a time. While the task stopwatch is running, close unrelated browser tabs and avoid switching context.',
    category: 'Focus & Time',
    strictness: 'mandatory',
    icon: 'Zap',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule-definition-of-done',
    title: 'Clear Definition of Done',
    description: 'Before marking a task as done, verify that all subtasks are checked and deliverables meet quality expectations without loose ends.',
    category: 'Execution & Quality',
    strictness: 'mandatory',
    icon: 'CheckCircle2',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule-eat-that-frog',
    title: 'Eat That Frog (High Priority First)',
    description: 'Tackle your high-priority items during your peak energy hours before addressing routine emails or low-impact administrative items.',
    category: 'Execution & Quality',
    strictness: 'recommended',
    icon: 'Flame',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule-focus-rhythm',
    title: 'Timeboxed Focus & Rest Cycles',
    description: 'Work in dedicated 25-minute or 45-minute focus blocks using the Task Stopwatch, followed by 5–10 minutes of screen-free hydration and stretch rest.',
    category: 'Focus & Time',
    strictness: 'recommended',
    icon: 'Timer',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule-daily-shutdown',
    title: 'Daily Shutdown & Evening Triage',
    description: 'At the end of each day, review today\'s Day-by-Day History, clear loose ends, and select the top 3 critical tasks for tomorrow.',
    category: 'Habits & Mindset',
    strictness: 'recommended',
    icon: 'Calendar',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule-break-large-tasks',
    title: 'Deconstruct Work Over 90 Minutes',
    description: 'Never leave a task open that takes more than 90 minutes. Break it into measurable subtasks of 20–45 minutes each.',
    category: 'Execution & Quality',
    strictness: 'best-practice',
    icon: 'Layers',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule-distraction-free-env',
    title: 'Distraction-Free Sanctuary',
    description: 'Keep your smartphone out of arm\'s reach and turn off social notifications during deep-focus timer sessions.',
    category: 'Environment',
    strictness: 'recommended',
    icon: 'Shield',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const RULES_STORAGE_KEY = 'ravora_work_rules_v1';
const COMPLIANCE_STORAGE_PREFIX = 'ravora_rule_compliance_';

export function loadRules(): WorkRule[] {
  if (typeof window === 'undefined') return DEFAULT_RULES;
  try {
    const raw = localStorage.getItem(RULES_STORAGE_KEY);
    if (!raw) {
      saveRules(DEFAULT_RULES);
      return DEFAULT_RULES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_RULES;
  } catch (err) {
    console.error('Failed to load rules', err);
    return DEFAULT_RULES;
  }
}

export function saveRules(rules: WorkRule[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
  } catch (err) {
    console.error('Failed to save rules', err);
  }
}

export function loadDailyCompliance(dateStr: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${COMPLIANCE_STORAGE_PREFIX}${dateStr}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load compliance', err);
    return [];
  }
}

export function saveDailyCompliance(dateStr: string, checkedRuleIds: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${COMPLIANCE_STORAGE_PREFIX}${dateStr}`, JSON.stringify(checkedRuleIds));
  } catch (err) {
    console.error('Failed to save compliance', err);
  }
}
