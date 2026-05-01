import { Play, Pause, Square, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TimerState } from "@/lib/timer-engine";

interface TimerControlsProps {
  state: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onSkip?: () => void;
  canSkip?: boolean;
}

export function TimerControls({ state, onStart, onPause, onResume, onCancel, onSkip, canSkip }: TimerControlsProps) {
  if (state === "idle" || state === "finished") {
    return (
      <div className="flex justify-center">
        <Button
          size="lg"
          className="h-16 px-12 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          onClick={onStart}
        >
          <Play className="mr-2 h-6 w-6" />
          {state === "finished" ? "Repetir" : "Iniciar"}
        </Button>
      </div>
    );
  }

  if (state === "prep") {
    return (
      <div className="flex justify-center">
        <Button variant="outline" size="lg" className="h-12 px-8 rounded-2xl" onClick={onCancel}>
          <Square className="mr-2 h-4 w-4" /> Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-3 justify-center">
      {state === "running" ? (
        <Button size="lg" variant="secondary" className="h-14 px-8 rounded-2xl" onClick={onPause}>
          <Pause className="mr-2 h-5 w-5" /> Pausar
        </Button>
      ) : (
        <Button size="lg" className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90" onClick={onResume}>
          <Play className="mr-2 h-5 w-5" /> Reanudar
        </Button>
      )}
      {canSkip && onSkip && (
        <Button size="lg" variant="outline" className="h-14 px-5 rounded-2xl" onClick={onSkip}>
          <SkipForward className="h-5 w-5" />
        </Button>
      )}
      <Button size="lg" variant="outline" className="h-14 px-5 rounded-2xl text-red-400 border-red-900/50 hover:bg-red-900/20" onClick={onCancel}>
        <Square className="h-5 w-5" />
      </Button>
    </div>
  );
}
