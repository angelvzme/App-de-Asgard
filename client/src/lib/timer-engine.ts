import { useEffect, useRef, useCallback, useState } from "react";

export type TimerState = "idle" | "prep" | "running" | "paused" | "finished";

export interface UseTimerOptions {
  totalSeconds: number;
  onTick?: (remaining: number) => void;
  onFinish?: () => void;
  prepSeconds?: number;
  onPrepTick?: (remaining: number) => void;
  onPrepFinish?: () => void;
}

export function useTimer({
  totalSeconds,
  onTick,
  onFinish,
  prepSeconds = 10,
  onPrepTick,
  onPrepFinish,
}: UseTimerOptions) {
  const [state, setState] = useState<TimerState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [prepElapsed, setPrepElapsed] = useState(0);

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const remaining = Math.max(0, totalSeconds - elapsed);
  const prepRemaining = Math.max(0, prepSeconds - prepElapsed);

  const acquireWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {}
  };

  const releaseWakeLock = () => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  };

  const tick = useCallback(() => {
    const now = Date.now();
    setState(prev => {
      if (prev === "prep") {
        const pe = (now - startTimeRef.current) / 1000;
        setPrepElapsed(pe);
        const pr = Math.max(0, prepSeconds - pe);
        onPrepTick?.(Math.ceil(pr));
        if (pr <= 0) {
          onPrepFinish?.();
          startTimeRef.current = Date.now();
          pausedElapsedRef.current = 0;
          return "running";
        }
      } else if (prev === "running") {
        const el = pausedElapsedRef.current + (now - startTimeRef.current) / 1000;
        setElapsed(el);
        const rem = Math.max(0, totalSeconds - el);
        onTick?.(Math.ceil(rem));
        if (rem <= 0) {
          onFinish?.();
          releaseWakeLock();
          return "finished";
        }
      }
      return prev;
    });
    rafRef.current = requestAnimationFrame(tick);
  }, [totalSeconds, prepSeconds, onTick, onFinish, onPrepTick, onPrepFinish]);

  const stopRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const start = useCallback(async () => {
    await acquireWakeLock();
    setPrepElapsed(0);
    setElapsed(0);
    pausedElapsedRef.current = 0;
    startTimeRef.current = Date.now();
    setState(prepSeconds > 0 ? "prep" : "running");
    rafRef.current = requestAnimationFrame(tick);
  }, [tick, prepSeconds]);

  const pause = useCallback(() => {
    setState(prev => {
      if (prev === "running") {
        stopRaf();
        pausedElapsedRef.current += (Date.now() - startTimeRef.current) / 1000;
        return "paused";
      }
      return prev;
    });
  }, []);

  const resume = useCallback(() => {
    setState(prev => {
      if (prev === "paused") {
        startTimeRef.current = Date.now();
        rafRef.current = requestAnimationFrame(tick);
        return "running";
      }
      return prev;
    });
  }, [tick]);

  const cancel = useCallback(() => {
    stopRaf();
    releaseWakeLock();
    setElapsed(0);
    setPrepElapsed(0);
    pausedElapsedRef.current = 0;
    setState("idle");
  }, []);

  useEffect(() => () => { stopRaf(); releaseWakeLock(); }, []);

  return { state, elapsed, remaining, prepRemaining, start, pause, resume, cancel };
}

export function fmtTime(totalSec: number): string {
  const s = Math.ceil(totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function fmtElapsed(totalSec: number): string {
  return fmtTime(totalSec);
}
