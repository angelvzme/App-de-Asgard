import { useState, useCallback, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TimerLayout } from "@/components/timer/timer-layout";
import { TimerDisplay } from "@/components/timer/timer-display";
import { TimerPrep } from "@/components/timer/timer-prep";
import { TimerControls } from "@/components/timer/timer-controls";
import { TimerSummary } from "@/components/timer/timer-summary";
import { TimerPresets } from "@/components/timer/timer-presets";
import { useTimer, fmtTime } from "@/lib/timer-engine";
import { startSound, finishSound, countdownBeep, beepShort } from "@/lib/timer-sounds";

interface ForTimeConfig { rounds: number; timeCap: number }
const DEFAULT: ForTimeConfig = { rounds: 3, timeCap: 20 * 60 };

export default function TimerForTime() {
  const [config, setConfig] = useState<ForTimeConfig>(DEFAULT);
  const [timecapMin, setTimecapMin] = useState(20);
  const [roundsDone, setRoundsDone] = useState(0);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const prevRemaining = useRef<number>(0);

  const totalSeconds = timecapMin * 60;

  const handleTick = useCallback((rem: number) => {
    countdownBeep(rem);
    prevRemaining.current = rem;
  }, []);

  const handleFinish = useCallback(() => {
    finishSound();
  }, []);

  const handlePrepFinish = useCallback(() => {
    startSound();
  }, []);

  const timer = useTimer({
    totalSeconds,
    onTick: handleTick,
    onFinish: handleFinish,
    onPrepFinish: handlePrepFinish,
  });

  const handleStart = () => {
    setRoundsDone(0);
    setFinishedAt(null);
    prevRemaining.current = 0;
    setConfig({ rounds: config.rounds, timeCap: totalSeconds });
    timer.start();
  };

  const handleDone = () => {
    if (timer.state === "running" || timer.state === "paused") {
      beepShort();
      setFinishedAt(timer.elapsed);
      timer.cancel();
    }
  };

  if (timer.state === "finished" || finishedAt !== null) {
    return (
      <TimerLayout title="For Time">
        <TimerSummary
          title={`For Time — ${config.rounds} rounds`}
          lines={[
            { label: "Tiempo empleado", value: finishedAt !== null ? fmtTime(finishedAt) : "Tiempo límite" },
            { label: "Time cap", value: fmtTime(totalSeconds) },
            { label: "Rounds", value: String(config.rounds) },
          ]}
          onRepeat={() => { setFinishedAt(null); timer.start(); }}
          onExit={() => { setFinishedAt(null); timer.cancel(); }}
        />
      </TimerLayout>
    );
  }

  return (
    <TimerLayout title="For Time">
      {timer.state === "prep" ? (
        <TimerPrep remaining={timer.prepRemaining} />
      ) : timer.state === "idle" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Rounds</Label>
              <Input type="number" min={1} value={config.rounds}
                onChange={e => setConfig(c => ({ ...c, rounds: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Time cap (min)</Label>
              <Input type="number" min={1} value={timecapMin}
                onChange={e => setTimecapMin(Number(e.target.value))} />
            </div>
          </div>
          <TimerPresets<ForTimeConfig>
            type="fortime"
            currentConfig={{ rounds: config.rounds, timeCap: totalSeconds }}
            onLoad={c => { setConfig(c); setTimecapMin(Math.round(c.timeCap / 60)); }}
          />
          <TimerControls
            state={timer.state}
            onStart={handleStart}
            onPause={timer.pause}
            onResume={timer.resume}
            onCancel={timer.cancel}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <TimerDisplay
            time={fmtTime(timer.remaining)}
            label="Time cap"
            color={timer.remaining <= 60 ? "rest" : "work"}
            sublabel={`${config.rounds} rounds`}
          />
          <div className="flex justify-center">
            <button
              type="button"
              className="h-20 w-56 rounded-2xl bg-green-500/10 border-2 border-green-500 text-green-400 font-bold text-base hover:bg-green-500/20 active:scale-95 transition-all select-none"
              onClick={handleDone}
            >
              ¡Listo! Registrar tiempo
            </button>
          </div>
          <TimerControls
            state={timer.state}
            onStart={handleStart}
            onPause={timer.pause}
            onResume={timer.resume}
            onCancel={timer.cancel}
          />
        </div>
      )}
    </TimerLayout>
  );
}
