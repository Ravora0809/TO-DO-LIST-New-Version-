import { ActiveStopwatchState } from '../types';

const ACTIVE_STOPWATCH_KEY = 'ravora_active_stopwatch';
const ORIGINAL_TITLE = 'Ravora - Modern Productivity & Workspace';

let backgroundWorker: Worker | null = null;
let titleFlashingInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Creates an inline Web Worker running on a separate OS thread.
 * Modern browsers (Chrome, Edge, Safari) aggressively throttle window.setInterval
 * when tabs are inactive or minimized, but Web Workers continue to execute timers reliably!
 */
export function initBackgroundTickWorker(onTick: () => void): () => void {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    // Fallback if Workers not supported
    const fallbackId = setInterval(onTick, 1000);
    return () => clearInterval(fallbackId);
  }

  try {
    const workerBlobCode = `
      var timerId = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (timerId) clearInterval(timerId);
          timerId = setInterval(function() {
            self.postMessage('tick');
          }, 500);
        } else if (e.data === 'stop') {
          if (timerId) {
            clearInterval(timerId);
            timerId = null;
          }
        }
      };
    `;

    const blob = new Blob([workerBlobCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    backgroundWorker = new Worker(workerUrl);

    backgroundWorker.onmessage = (e) => {
      if (e.data === 'tick') {
        onTick();
      }
    };

    backgroundWorker.postMessage('start');

    return () => {
      if (backgroundWorker) {
        try {
          backgroundWorker.postMessage('stop');
          backgroundWorker.terminate();
        } catch {
          // ignore
        }
        backgroundWorker = null;
      }
      try {
        URL.revokeObjectURL(workerUrl);
      } catch {
        // ignore
      }
    };
  } catch (err) {
    console.debug('Worker init failed, using window interval fallback', err);
    const fallbackId = setInterval(onTick, 1000);
    return () => clearInterval(fallbackId);
  }
}

/**
 * Mathematically calculates the exact elapsed seconds using wall-clock timestamps (Date.now()).
 * Even if the browser suspends the tab or execution drifts, this computes the exact seconds
 * that have genuinely passed in the real world.
 */
export function calculateCurrentElapsedSeconds(
  stopwatch: ActiveStopwatchState,
  nowMs = Date.now()
): number {
  if (!stopwatch.isRunning) {
    return stopwatch.elapsedSeconds;
  }

  const base = stopwatch.accumulatedSeconds ?? stopwatch.elapsedSeconds;
  const start = stopwatch.startTimestamp ?? nowMs;
  const delta = Math.max(0, Math.floor((nowMs - start) / 1000));
  return base + delta;
}

/**
 * Format total seconds into MM:SS or HH:MM:SS
 */
export function formatTimeDisplay(totalSec: number): string {
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Update browser tab title to show active countdown / stopwatch
 */
export function updateTabTitleWithTimer(
  stopwatch: ActiveStopwatchState | null,
  isAlarmRinging = false
) {
  if (typeof document === 'undefined') return;

  if (isAlarmRinging) {
    // Handled by startAlarmTitleFlashing
    return;
  }

  if (!stopwatch || !stopwatch.isRunning) {
    stopAlarmTitleFlashing();
    document.title = ORIGINAL_TITLE;
    return;
  }

  const isCountdown = stopwatch.mode === 'countdown';
  const remaining = Math.max(0, stopwatch.targetSeconds - stopwatch.elapsedSeconds);
  const displaySec = isCountdown ? remaining : stopwatch.elapsedSeconds;
  const timeStr = formatTimeDisplay(displaySec);

  document.title = `${isCountdown ? '⏳' : '⏱️'} (${timeStr}) ${stopwatch.taskTitle} • Ravora`;
}

/**
 * Flashes browser tab title back and forth when alarm is ringing,
 * so user immediately sees it even if browsing YouTube, docs, or other tabs!
 */
export function startAlarmTitleFlashing(taskTitle: string) {
  if (typeof document === 'undefined') return;
  stopAlarmTitleFlashing();

  let toggle = false;
  document.title = `⏰ TIME'S UP! 🔔 - ${taskTitle}`;

  titleFlashingInterval = setInterval(() => {
    toggle = !toggle;
    if (toggle) {
      document.title = `🚨 ALARM RINGING! ⏰ (${taskTitle})`;
    } else {
      document.title = `⏰ TIME'S UP! Click to Open 🔔`;
    }
  }, 800);
}

export function stopAlarmTitleFlashing() {
  if (titleFlashingInterval) {
    clearInterval(titleFlashingInterval);
    titleFlashingInterval = null;
  }
  if (typeof document !== 'undefined') {
    document.title = ORIGINAL_TITLE;
  }
}

/**
 * Fires a high-priority system / desktop notification when timer completes
 */
export function triggerTimeUpNotification(taskTitle: string, taskCategory?: string) {
  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    try {
      const notif = new Notification(`⏰ Time's Up: ${taskTitle}!`, {
        body: `Alarm is ringing. Your allocated focus time has ended. Click to mark work done or extend.`,
        icon: '/favicon.ico',
        tag: `alarm-${Date.now()}`,
        requireInteraction: true,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.debug('Notification trigger failed', e);
    }
  }
}

export function saveActiveStopwatch(state: ActiveStopwatchState | null): void {
  try {
    if (!state) {
      localStorage.removeItem(ACTIVE_STOPWATCH_KEY);
    } else {
      localStorage.setItem(ACTIVE_STOPWATCH_KEY, JSON.stringify(state));
    }
  } catch (e) {
    console.debug('Failed to save active stopwatch to localStorage', e);
  }
}

export function loadActiveStopwatch(): ActiveStopwatchState | null {
  try {
    const raw = localStorage.getItem(ACTIVE_STOPWATCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveStopwatchState;
    if (!parsed || !parsed.taskId) return null;

    // If it was running when stored, re-calculate true elapsed time!
    if (parsed.isRunning && parsed.startTimestamp) {
      const trueElapsed = calculateCurrentElapsedSeconds(parsed);
      return {
        ...parsed,
        elapsedSeconds: trueElapsed,
      };
    }
    return parsed;
  } catch (e) {
    console.debug('Failed to load active stopwatch from localStorage', e);
    return null;
  }
}
