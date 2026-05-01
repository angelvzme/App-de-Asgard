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
import { workSound, restSound, startSound, finishSound, countdownBeep } from "@/lib/timer-sounds";

interface TabataConfig { rounds: number; workSec: number; restSec: number }
const DEFAULT: TabataConfig = { rounds: 8, workSec: 20, restSec: 10 };

type Phase = "work" | "rest";

export default function TimerTabata() {
  const [config, setConfig] = useState<TabataConfig>(DEFAULT);
  const [phase, setPhase] = useState<Phase>("work");
  const [currentRound, setCurrentRound] = useState(1);

  const intervalSec = config.workSec + config.restSec;
  const totalSeconds = config.rounds * intervalSec;

  const phaseRef = useRef<Phase>("work");
  const roundRef = useRef(1);

  const handleTick = useCallback((rem: number) => {
    const elapsed = totalSeconds - rem;
    const posInInterval = elapsed % intervalSec;
    const newPhase: Phase = posInInterval < config.workSec ? "work" : "rest";
    const newRound = Math.floor(elapsed / intervalSec) + 1;

    if (newPhase !== phaseRef.current) {
      phaseRef.current = newPhase;
      setPhase(newPhase);
      if (newPhase === "work") workSound();
      else restSound();
    }
    if (newRound !== roundRef.current && newRound <= config.rounds) {
      roundRef.current = newRound;
      setCurrentRound(newRound);
    }

    const posInPhase = newPhase === "work"
      ? posInInterval
      : posInInterval - config.workSec;
    const phaseDur = newPhase === "work" ? config.workSec : config.restSec;
    const phaseRem = phaseDur - posInPhase;
    countdownBeep(Math.ceil(phaseRem));
  }, [totalSeconds, intervalSec, config.workSec, config.restSec, config.rounds]);

  const handleFinish = useCallback(() => {
    finishSound();
  }, []);

  const handlePrepFinish = useCallback(() => {
    startSound();
    workSound();
  }, []);

  const timer = useTimer({
    totalSeconds,
    onTick: handleTick,
    onFinish: handleFinish,
    onPrepFinish: handlePrepFinish,
  });

  const handleStart = () => {
    setPhase("work");
    setCurrentRound(1);
    phaseRef.current = "work";
    roundRef.current = 1;
    timer.start();
  };

  const elapsed = timer.elapsed;
  const posInInterval = elapsed % intervalSec;
  const currPhase: Phase = posInInterval < config.workSec ? "work" : "rest";
  const posInPhase = currPhase === "work" ? posInInterval : posInInterval - config.workSec;
  const phaseDur = currPhase === "work" ? config.workSec : config.restSec;
  const phaseRem = Math.max(0, phaseDur - posInPhase);

  if (timer.state === "finished") {
    return (
      <TimerLayout title="Tabata">
        <TimerSummary
          title={`Tabata ${config.rounds} rounds`}
          lines={[
            { label: "Rounds", value: String(config.rounds) },
            { label: "Trabajo", value: `${config.workSec}s` },
            { label: "Descanso", value: `${config.restSec}s` },
            { label: "Tiempo total", value: fmtTime(totalSeconds) },
          ]}
          onRepeat={() => timer.start()}
          onExit={() => timer.cancel()}
        />
      </TimerLayout>
    );
  }

  return (
    <TimerLayout title="Tabata">
      {timer.state === "prep" ? (
        <TimerPrep remaining={timer.prepRemaining} />
      ) : timer.state === "idle" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Rounds</Label>
              <Input type="number" min={1} max={99} value={config.rounds}
                onChange={e => setConfig(c => ({ ...c, rounds: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Trabajo (s)</Label>
              <Input type="number" min={1} max={300} value={config.workSec}
                onChange={e => setConfig(c => ({ ...c, workSec: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Descanso (s)</Label>
              <Input type="number" min={0} max={300} value={config.restSec}
                onChange={e => setConfig(c => ({ ...c, restSec: Number(e.target.value) }))} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Tiempo total: {fmtTime(totalSeconds)} · {config.rounds} rounds de {config.workSec}s/{config.restSec}s
          </p>
          <TimerPresets<TabataConfig>
            type="tabata"
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
            time={fmtTime(phaseRem)}
            label={phase === "work" ? "TRABAJO" : "DESCANSO"}
            color={phase === "work" ? "work" : "rest"}
            round={`Round ${currentRound} / ${config.rounds}`}
            sublabel={phase === "work" ? `Descanso en ${fmtTime(phaseRem)}` : `Próximo round en ${fmtTime(phaseRem)}`}
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
