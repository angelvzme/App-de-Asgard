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
import { beepShort, startSound, finishSound, countdownBeep } from "@/lib/timer-sounds";

interface EmomConfig { minutes: number }
const DEFAULT: EmomConfig = { minutes: 12 };

export default function TimerEmom() {
  const [config, setConfig] = useState<EmomConfig>(DEFAULT);
  const [currentMinute, setCurrentMinute] = useState(1);
  const prevMinute = useRef(1);

  const totalSeconds = config.minutes * 60;

  const handleTick = useCallback((rem: number) => {
    countdownBeep(rem % 60);
    const minutePassed = Math.floor((totalSeconds - rem) / 60) + 1;
    if (minutePassed !== prevMinute.current) {
      prevMinute.current = minutePassed;
      setCurrentMinute(minutePassed);
      beepShort();
    }
  }, [totalSeconds]);

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
    setCurrentMinute(1);
    prevMinute.current = 1;
    timer.start();
  };

  const secInMinute = totalSeconds > 0
    ? 60 - Math.ceil(timer.remaining % 60 === 0 ? 60 : timer.remaining % 60)
    : 0;
  const secRemaining = Math.ceil(timer.remaining % 60 === 0 && timer.remaining > 0 ? 60 : timer.remaining % 60);

  if (timer.state === "finished") {
    return (
      <TimerLayout title="EMOM">
        <TimerSummary
          title={`EMOM ${config.minutes} min`}
          lines={[
            { label: "Duración", value: `${config.minutes} minutos` },
            { label: "Minutos completados", value: String(config.minutes) },
          ]}
          onRepeat={() => timer.start()}
          onExit={() => timer.cancel()}
        />
      </TimerLayout>
    );
  }

  return (
    <TimerLayout title="EMOM">
      {timer.state === "prep" ? (
        <TimerPrep remaining={timer.prepRemaining} />
      ) : timer.state === "idle" ? (
        <div className="space-y-6">
          <div className="space-y-1 max-w-xs mx-auto">
            <Label className="text-xs text-muted-foreground">Duración total (minutos)</Label>
            <Input type="number" min={1} max={99} value={config.minutes}
              onChange={e => setConfig({ minutes: Number(e.target.value) })} />
          </div>
          <TimerPresets<EmomConfig>
            type="emom"
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
            time={fmtTime(secRemaining)}
            label="En este minuto"
            color={secRemaining <= 5 ? "rest" : "work"}
            round={`Minuto ${currentMinute} / ${config.minutes}`}
            sublabel={`Total restante: ${fmtTime(timer.remaining)}`}
          />
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
