let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function beep(freq: number, duration: number, volume = 0.5, type: OscillatorType = "sine") {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch {}
}

export function beepShort() { beep(880, 0.12, 0.4); }
export function beepLong() { beep(660, 0.5, 0.5); }

export function startSound() {
  beep(523, 0.1, 0.4);
  setTimeout(() => beep(659, 0.1, 0.4), 120);
  setTimeout(() => beep(784, 0.25, 0.5), 240);
}

export function workSound() {
  beep(880, 0.15, 0.5, "square");
  setTimeout(() => beep(1047, 0.3, 0.5, "square"), 150);
}

export function restSound() {
  beep(440, 0.2, 0.35);
  setTimeout(() => beep(349, 0.35, 0.35), 200);
}

export function finishSound() {
  const times = [0, 150, 300, 500];
  const freqs = [523, 659, 784, 1047];
  times.forEach((t, i) => setTimeout(() => beep(freqs[i], 0.35, 0.6), t));
}

export function countdownBeep(remaining: number) {
  if (remaining <= 3 && remaining > 0) beep(1100, 0.08, 0.3, "square");
}
