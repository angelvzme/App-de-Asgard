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
import { beepShort, beepLong, startSound, finishSound, countdownBeep } from "@/lib/timer-sounds";

interface AmrapConfig { minutes: number; seconds: number; rounds: number }

const DEFAULT: AmrapConfig = { minutes: 20, seconds: 0, rounds: 0 };

export default function TimerAmrap() {
  const [config, setConfig] = useState<AmrapConfig>(DEFAULT);
  const [roundsDone, setRoundsDone] = useState(0);
  const prevRemaining = useRef<number>(0);

  const totalSeconds = config.minutes * 60 + config.seconds;

  const handleTick = useCallback((rem: number) => {
    countdownBeep(rem);
    if (prevRemaining.current !== rem) {
      if (rem === 10) beepLong();
      prevRemaining.current = rem;
    }
  }, []);

  const handlePrepTick = useCallback((rem: number) => {
    countdownBeep(rem);
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
    onPrepTick: handlePrepTick,
    onPrepFinish: handlePrepFinish,
  });

  const handleStart = () => {
    setRoundsDone(0);
    prevRemaining.current = 0;
    timer.start();
  };

  const handleRepeat = () => {
    setRoundsDone(0);
    timer.start();
  };

  const addRound = () => {
    if (timer.state === "running" || timer.state === "paused") {
      beepShort();
      setRoundsDone(r => r + 1);
    }
  };

  if (timer.state === "finished") {
    return (
      <TimerLayout title="AMRAP">
        <TimerSummary
          title={`AMRAP ${config.minutes}:${String(config.seconds).padStart(2, "0")}`}
          lines={[
            { label: "Tiempo", value: fmtTime(totalSeconds) },
            { label: "Rounds completados", value: String(roundsDone) },
          ]}
          onRepeat={handleRepeat}
          onExit={() => timer.cancel()}
        />
      </TimerLayout>
    );
  }

  return (
    <TimerLayout title="AMRAP">
      {timer.state === "prep" ? (
        <TimerPrep remaining={timer.prepRemaining} />
      ) : timer.state === "idle" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-muted-foreground">Minutos</Label>
              <Input type="number" min={0} max={99} value={config.minutes}
                onChange={e => setConfig(c => ({ ...c, minutes: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Segundos</Label>
              <Input type="number" min={0} max={59} value={config.seconds}
                onChange={e => setConfig(c => ({ ...c, seconds: Number(e.target.value) }))} />
            </div>
          </div>
          <TimerPresets<AmrapConfig>
            type="amrap"
            currentConfig={config}
            onLoad={setConfig}
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
            label="AMRAP"
            color={timer.remaining <= 10 ? "rest" : "work"}
            round={roundsDone > 0 ? `Round ${roundsDone}` : undefined}
          />
          <div className="flex justify-center">
            <button
              type="button"
              className="h-20 w-20 rounded-full bg-primary/10 border-2 border-primary text-primary font-bold text-sm hover:bg-primary/20 active:scale-95 transition-all select-none"
              onClick={addRound}
            >
              +1 Round
            </button>
          </div>
          {roundsDone > 0 && (
            <p className="text-center text-muted-foreground text-sm">
              Rounds: <span className="text-foreground font-bold">{roundsDone}</span>
            </p>
          )}
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
