// Web Audio API chime synthesis for micro-interactions
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playCompleteSound(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // First tone (G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now); // G5
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second harmonious tone (C6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.50, now + 0.08); // C6
    gain2.gain.setValueAtTime(0.1, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.debug('Audio play failed', err);
  }
}

export function playPopSound(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch (err) {
    console.debug('Audio play failed', err);
  }
}

// Warning chime when a task is about to complete (e.g. 1 min or 30s remaining)
export function playWarningBeep(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [0, 0.15].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 659.25 : 880, now + offset); // E5 -> A5
      gain.gain.setValueAtTime(0.08, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.25);
    });
  } catch (err) {
    console.debug('Audio play warning failed', err);
  }
}

let alarmSourceNode: AudioBufferSourceNode | null = null;
let alarmGainNode: GainNode | null = null;
let isAlarmCurrentlyPlaying = false;
let activeAlarmInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Creates a pre-rendered 1.3s AudioBuffer containing a recognizable, crisp alarm pattern.
 * When played on an AudioBufferSourceNode with loop=true, this plays directly inside the
 * system's audio hardware thread, ensuring it never gets throttled or silenced when the
 * user moves to another browser tab or minimizes the browser!
 */
function createAlarmAudioBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate || 44100;
  const duration = 1.35; // seconds per cycle
  const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
  const data = buffer.getChannelData(0);

  // Define alarm chime sequence: 4 energetic tones
  const notes = [
    { freq: 1046.50, start: 0.00, dur: 0.12 }, // C6
    { freq: 1318.51, start: 0.14, dur: 0.12 }, // E6
    { freq: 1567.98, start: 0.28, dur: 0.14 }, // G6
    { freq: 2093.00, start: 0.45, dur: 0.24 }, // C7 high peak
  ];

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (const note of notes) {
      if (t >= note.start && t < note.start + note.dur) {
        const noteTime = t - note.start;
        // Triangle/sine blend waveform
        const phase = noteTime * note.freq * 2 * Math.PI;
        const wave = Math.sin(phase) * 0.75 + Math.asin(Math.sin(phase)) * 0.25;
        // Exponential decay envelope
        const envelope = Math.max(0, 1 - noteTime / note.dur) ** 1.8;
        sample += wave * envelope * 0.28;
      }
    }

    data[i] = sample;
  }

  return buffer;
}

// Persistent repeating alarm sound when task time is up
export function playAlarmSound(enabled = true) {
  if (!enabled) return;
  stopAlarmSound(); // Ensure no duplicate streams
  isAlarmCurrentlyPlaying = true;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const alarmBuffer = createAlarmAudioBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = alarmBuffer;
    source.loop = true; // Hardware audio loop — continuous even in background tabs!

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);

    source.connect(gain);
    gain.connect(ctx.destination);

    source.start(0);

    alarmSourceNode = source;
    alarmGainNode = gain;
  } catch (err) {
    console.debug('Looping alarm setup failed, falling back to interval', err);
    // Interval fallback
    const triggerBeepSeries = () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const notes = [1046.50, 1318.51, 1567.98];
        notes.forEach((freq, idx) => {
          const offset = idx * 0.12;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + offset);
          gain.gain.setValueAtTime(0.18, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.22);
        });
      } catch {
        // ignore
      }
    };

    triggerBeepSeries();
    activeAlarmInterval = setInterval(triggerBeepSeries, 1400);
  }
}

export function stopAlarmSound() {
  isAlarmCurrentlyPlaying = false;

  if (alarmSourceNode) {
    try {
      alarmSourceNode.stop();
      alarmSourceNode.disconnect();
    } catch {
      // already stopped
    }
    alarmSourceNode = null;
  }

  if (alarmGainNode) {
    try {
      alarmGainNode.disconnect();
    } catch {
      // ignore
    }
    alarmGainNode = null;
  }

  if (activeAlarmInterval) {
    clearInterval(activeAlarmInterval);
    activeAlarmInterval = null;
  }
}

export function isAlarmRinging(): boolean {
  return isAlarmCurrentlyPlaying;
}


