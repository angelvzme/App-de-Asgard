import { useState, useCallback, useRef, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Reorder, useDragControls } from "framer-motion";
import { TimerLayout } from "@/components/timer/timer-layout";
import { TimerDisplay } from "@/components/timer/timer-display";
import { TimerPrep } from "@/components/timer/timer-prep";
import { TimerControls } from "@/components/timer/timer-controls";
import { TimerSummary } from "@/components/timer/timer-summary";
import { TimerPresets } from "@/components/timer/timer-presets";
import { useTimer, fmtTime } from "@/lib/timer-engine";
import { workSound, restSound, startSound, finishSound, countdownBeep } from "@/lib/timer-sounds";

type IntervalType = "work" | "rest";

interface Interval {
  id: string;
  label: string;
  seconds: number;
  type: IntervalType;
}

interface MixConfig { intervals: Omit<Interval, "id">[]; rounds: number }

function makeId() { return Math.random().toString(36).slice(2); }

const DEFAULT_INTERVALS: Interval[] = [
  { id: makeId(), label: "Trabajo", seconds: 40, type: "work" },
  { id: makeId(), label: "Descanso", seconds: 20, type: "rest" },
];

function IntervalRow({ interval, onChange, onRemove }: {
  interval: Interval;
  onChange: (i: Interval) => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item value={interval} dragListener={false} dragControls={controls}
      className="flex items-center gap-2 bg-card border border-border rounded-xl p-3">
      <div
        className="cursor-grab active:cursor-grabbing touch-none p-1 opacity-30 hover:opacity-60 transition-opacity"
        onPointerDown={e => { e.preventDefault(); controls.start(e); }}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 grid grid-cols-5 gap-2 items-center">
        <div className="col-span-2 space-y-0.5">
          <Label className="text-xs text-muted-foreground">Nombre</Label>
          <Input value={interval.label} className="h-7 text-xs"
            onChange={e => onChange({ ...interval, label: e.target.value })} />
        </div>
        <div className="col-span-1 space-y-0.5">
          <Label className="text-xs text-muted-foreground">Segundos</Label>
          <Input type="number" min={1} value={interval.seconds} className="h-7 text-xs"
            onChange={e => onChange({ ...interval, seconds: Number(e.target.value) })} />
        </div>
        <div className="col-span-2 space-y-0.5">
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <div className="flex gap-1">
            <button type="button"
              className={`flex-1 h-7 text-xs rounded-lg border transition-colors ${interval.type === "work" ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-border/80"}`}
              onClick={() => onChange({ ...interval, type: "work" })}>
              Trabajo
            </button>
            <button type="button"
              className={`flex-1 h-7 text-xs rounded-lg border transition-colors ${interval.type === "rest" ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-border text-muted-foreground hover:border-border/80"}`}
              onClick={() => onChange({ ...interval, type: "rest" })}>
              Descanso
            </button>
          </div>
        </div>
      </div>
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300 shrink-0"
        onClick={onRemove}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </Reorder.Item>
  );
}

export default function TimerMix() {
  const [intervals, setIntervals] = useState<Interval[]>(DEFAULT_INTERVALS);
  const [rounds, setRounds] = useState(3);

  const [currentIntervalIdx, setCurrentIntervalIdx] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [elapsedInInterval, setElapsedInInterval] = useState(0);

  const intervalsRef = useRef<Interval[]>(intervals);
  intervalsRef.current = intervals;

  const totalRoundsRef = useRef(rounds);
  totalRoundsRef.current = rounds;

  const totalSeconds = intervals.reduce((s, i) => s + i.seconds, 0) * rounds;

  const handleTick = useCallback((rem: number) => {
    const ivs = intervalsRef.current;
    const totalR = totalRoundsRef.current;
    const total = ivs.reduce((s, i) => s + i.seconds, 0) * totalR;
    const elapsed = total - rem;

    const intervalTotal = ivs.reduce((s, i) => s + i.seconds, 0);
    const roundIdx = Math.floor(elapsed / intervalTotal);
    const elapsedInRound = elapsed % intervalTotal;

    let cumulative = 0;
    let ivIdx = 0;
    for (let i = 0; i < ivs.length; i++) {
      cumulative += ivs[i].seconds;
      if (elapsedInRound < cumulative) { ivIdx = i; break; }
    }

    const prevCumulative = ivs.slice(0, ivIdx).reduce((s, iv) => s + iv.seconds, 0);
    const elapsedInIv = elapsedInRound - prevCumulative;
    const ivRem = ivs[ivIdx].seconds - elapsedInIv;

    setCurrentIntervalIdx(ivIdx);
    setCurrentRound(roundIdx + 1);
    setElapsedInInterval(elapsedInIv);
    countdownBeep(Math.ceil(ivRem));
  }, []);

  const handleFinish = useCallback(() => { finishSound(); }, []);
  const handlePrepFinish = useCallback(() => { startSound(); }, []);

  const timer = useTimer({
    totalSeconds,
    onTick: handleTick,
    onFinish: handleFinish,
    onPrepFinish: handlePrepFinish,
  });

  const handleStart = () => {
    setCurrentIntervalIdx(0);
    setCurrentRound(1);
    setElapsedInInterval(0);
    timer.start();
  };

  const addInterval = () => {
    setIntervals(ivs => [...ivs, { id: makeId(), label: "Trabajo", seconds: 30, type: "work" }]);
  };

  const updateInterval = (id: string, iv: Interval) => {
    setIntervals(ivs => ivs.map(i => i.id === id ? iv : i));
  };

  const removeInterval = (id: string) => {
    setIntervals(ivs => ivs.filter(i => i.id !== id));
  };

  const currentIv = intervals[currentIntervalIdx] ?? intervals[0];
  const ivRem = currentIv ? Math.max(0, currentIv.seconds - elapsedInInterval) : 0;

  if (timer.state === "finished") {
    return (
      <TimerLayout title="MIX">
        <TimerSummary
          title={`MIX — ${rounds} rounds`}
          lines={[
            { label: "Rounds", value: String(rounds) },
            { label: "Intervalos por round", value: String(intervals.length) },
            { label: "Tiempo total", value: fmtTime(totalSeconds) },
          ]}
          onRepeat={() => timer.start()}
          onExit={() => timer.cancel()}
        />
      </TimerLayout>
    );
  }

  return (
    <TimerLayout title="MIX">
      {timer.state === "prep" ? (
        <TimerPrep remaining={timer.prepRemaining} />
      ) : timer.state === "idle" ? (
        <div className="space-y-5">
          <div className="space-y-1 max-w-xs">
            <Label className="text-xs text-muted-foreground">Rounds</Label>
            <Input type="number" min={1} value={rounds}
              onChange={e => setRounds(Number(e.target.value))} />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Intervalos — arrastra para reordenar
            </p>
            <Reorder.Group axis="y" values={intervals} onReorder={setIntervals} className="space-y-2">
              {intervals.map(iv => (
                <IntervalRow
                  key={iv.id}
                  interval={iv}
                  onChange={updated => updateInterval(iv.id, updated)}
                  onRemove={() => removeInterval(iv.id)}
                />
              ))}
            </Reorder.Group>
            <Button type="button" variant="outline" size="sm"
              className="w-full border-dashed text-xs h-8 text-muted-foreground hover:text-foreground"
              onClick={addInterval}>
              <Plus className="h-3 w-3 mr-1" /> Añadir intervalo
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Tiempo total: {fmtTime(totalSeconds)}
          </p>

          <TimerPresets<MixConfig>
            type="mix"
            currentConfig={{ intervals: intervals.map(({ id, ...rest }) => rest), rounds }}
            onLoad={c => {
              setIntervals(c.intervals.map(i => ({ ...i, id: makeId() })));
              setRounds(c.rounds);
            }}
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
          {currentIv && (
            <TimerDisplay
              time={fmtTime(ivRem)}
              label={currentIv.label}
              color={currentIv.type === "work" ? "work" : "rest"}
              round={`Round ${currentRound}/${rounds} · ${currentIntervalIdx + 1}/${intervals.length}`}
              sublabel={`Total restante: ${fmtTime(timer.remaining)}`}
            />
          )}
          <div className="flex gap-1 justify-center">
            {intervals.map((iv, i) => (
              <div
                key={iv.id}
                className={`h-2 flex-1 rounded-full transition-colors max-w-8 ${
                  i === currentIntervalIdx
                    ? iv.type === "work" ? "bg-primary" : "bg-blue-400"
                    : i < currentIntervalIdx ? "bg-secondary" : "bg-secondary/30"
                }`}
              />
            ))}
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
