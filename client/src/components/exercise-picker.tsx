import { useState, useEffect, useRef } from "react";
import { useExercises, useCreateExercise, useRecentExercises } from "@/hooks/use-members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Dumbbell, Clock, Weight } from "lucide-react";
import { parseNotesWithLinks } from "@/lib/utils";
import { NotesDisplay } from "@/components/notes-display";
import type { LibraryExercise, LibraryExerciseWithUsage } from "@shared/schema";

// Re-export for backward compat in other components
export { parseNotesWithLinks };
export const renderNotesWithLinks = parseNotesWithLinks;

// ── Local exercise state (in a block, before saving) ──────────────────────────
export type LocalExercise = {
  exerciseId: number;
  name: string;
  notes: string | null;
  hasWeight: boolean;
  sets: number;
  reps: string;
  duration: string;
  weightLbs: number | null;
};

// ── 3-step Add Exercise Dialog ─────────────────────────────────────────────────
type Step = 1 | 2 | 3;

function ExerciseListItem({
  ex,
  onClick,
}: {
  ex: LibraryExercise;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors flex items-center justify-between gap-2 text-sm"
      onClick={onClick}
    >
      <span className="font-medium truncate">{ex.name}</span>
      {ex.hasWeight && (
        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">Con peso</span>
      )}
    </button>
  );
}

function AddExerciseDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (ex: LocalExercise) => void;
}) {
  const create = useCreateExercise();
  const { data: allExercises } = useExercises();
  const { data: recentExercises } = useRecentExercises();

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [hasWeight, setHasWeight] = useState(false);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState("");
  const [duration, setDuration] = useState("");
  const [weightLbs, setWeightLbs] = useState<string>("");
  const [selectedExercise, setSelectedExercise] = useState<LibraryExercise | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setName("");
      setNotes("");
      setHasWeight(false);
      setSets(3);
      setReps("");
      setDuration("");
      setWeightLbs("");
      setSelectedExercise(null);
    } else {
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open]);

  const query = name.trim().toLowerCase();
  const allSorted = [...(allExercises || [])].sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  );
  const filteredLibrary = query
    ? allSorted.filter(e => e.name.toLowerCase().includes(query))
    : allSorted;

  const isExactMatch = (allExercises || []).some(
    e => e.name.toLowerCase() === query
  );

  const handleSelectExercise = (ex: LibraryExercise) => {
    setSelectedExercise(ex);
    setName(ex.name);
    setHasWeight(ex.hasWeight);
    setStep(3);
  };

  const handleStep1Continue = () => {
    if (!name.trim()) return;
    const exact = (allExercises || []).find(
      e => e.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (exact) {
      handleSelectExercise(exact);
    } else {
      setStep(2);
    }
  };

  const handleStep2SaveAndContinue = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    create.mutate(
      { name: name.trim(), notes: notes.trim() || null, hasWeight },
      {
        onSuccess: (ex) => {
          setSelectedExercise(ex);
          setIsSaving(false);
          setStep(3);
        },
        onError: () => setIsSaving(false),
      }
    );
  };

  const handleStep3Add = () => {
    if (!selectedExercise) return;
    onAdd({
      exerciseId: selectedExercise.id,
      name: selectedExercise.name,
      notes: selectedExercise.notes ?? null,
      hasWeight: selectedExercise.hasWeight,
      sets,
      reps,
      duration,
      weightLbs: weightLbs !== "" ? Number(weightLbs) : null,
    });
    onOpenChange(false);
  };

  const recentList: LibraryExercise[] = !query && recentExercises ? recentExercises : [];
  const recentIds = new Set(recentList.map(e => e.id));
  const libraryListToShow = query
    ? filteredLibrary
    : filteredLibrary.filter(e => !recentIds.has(e.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Añadir ejercicio"}
            {step === 2 && "Nuevo ejercicio — configuración"}
            {step === 3 && `Parámetros — ${selectedExercise?.name}`}
          </DialogTitle>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-secondary"}`}
              />
            ))}
          </div>
        </DialogHeader>

        {/* ── Step 1: Search + always-visible library list ── */}
        {step === 1 && (
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Nombre del ejercicio <span className="text-primary text-xs">(requerido)</span></Label>
              <Input
                ref={nameRef}
                placeholder="Buscar ejercicio o escribir nombre nuevo..."
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setSelectedExercise(null);
                }}
                autoComplete="off"
              />
              {isExactMatch && (
                <p className="text-xs text-green-400 pt-1">✓ Ejercicio encontrado en la biblioteca</p>
              )}
            </div>

            {/* Static list — always visible */}
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
              {recentList.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-1">
                    Usados recientemente
                  </p>
                  <div className="space-y-0.5">
                    {recentList.map(ex => (
                      <ExerciseListItem
                        key={`recent-${ex.id}`}
                        ex={ex}
                        onClick={() => handleSelectExercise(ex)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {libraryListToShow.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-1">
                    {query ? "Resultados" : "Biblioteca de ejercicios"}
                  </p>
                  <div className="space-y-0.5">
                    {libraryListToShow.map(ex => (
                      <ExerciseListItem
                        key={ex.id}
                        ex={ex}
                        onClick={() => handleSelectExercise(ex)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {query && !isExactMatch && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-primary/10 text-primary transition-colors flex items-center gap-2 text-sm border border-dashed border-primary/40"
                  onClick={handleStep1Continue}
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span>Crear "<span className="font-semibold">{name.trim()}</span>" como ejercicio nuevo</span>
                </button>
              )}

              {!query && recentList.length === 0 && libraryListToShow.length === 0 && (
                <p className="text-xs text-muted-foreground px-1 py-4 text-center">
                  La biblioteca está vacía. Escribe el nombre del ejercicio para crearlo.
                </p>
              )}

              {query && libraryListToShow.length === 0 && isExactMatch && (
                <p className="text-xs text-muted-foreground px-1">
                  Presiona "Seleccionar" para continuar con este ejercicio.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="button" disabled={!name.trim()} onClick={handleStep1Continue}>
                {isExactMatch ? "Seleccionar" : "Continuar"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── Step 2: New exercise config ── */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm">¿Este ejercicio lleva peso?</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setHasWeight(true)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    hasWeight
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/20 text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <Dumbbell className="h-6 w-6" />
                  <span className="text-xs font-medium">Sí, lleva peso</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHasWeight(false)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    !hasWeight
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/20 text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <Clock className="h-6 w-6" />
                  <span className="text-xs font-medium">No lleva peso</span>
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notas / Enlace de referencia <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea
                placeholder="Descripción o URL de YouTube..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
              {notes.trim() && (
                <div className="text-xs border border-border/50 rounded-lg p-2 bg-secondary/10">
                  <p className="text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wider">Vista previa:</p>
                  <NotesDisplay text={notes} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>Atrás</Button>
              <Button type="button" disabled={isSaving || !name.trim()} onClick={handleStep2SaveAndContinue}>
                {isSaving ? "Guardando..." : "Guardar y continuar"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── Step 3: Assignment params ── */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            {selectedExercise?.notes && (
              <NotesDisplay text={selectedExercise.notes} className="text-muted-foreground" />
            )}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Series</Label>
                <Input
                  type="number" min={0} value={sets}
                  onChange={e => setSets(Number(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Reps</Label>
                <Input
                  placeholder="10 / al fallo"
                  value={reps}
                  onChange={e => setReps(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duración</Label>
                <Input
                  placeholder="45 seg"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            {selectedExercise?.hasWeight && (
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Weight className="h-3 w-3" /> Peso (lbs)
                  <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  type="number" min={0}
                  placeholder="ej: 135"
                  value={weightLbs}
                  onChange={e => setWeightLbs(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => {
                const isNew = selectedExercise && !(allExercises || []).some(e => e.id === selectedExercise.id);
                setStep(isNew ? 2 : 1);
              }}>Atrás</Button>
              <Button type="button" onClick={handleStep3Add}>
                <Plus className="h-4 w-4 mr-1" /> Añadir a la rutina
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── ExercisePicker (trigger button + dialog) ───────────────────────────────────
export function ExercisePicker({ onExerciseAdded }: {
  onExerciseAdded: (ex: LocalExercise) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-dashed text-xs h-8 text-muted-foreground hover:text-foreground hover:border-primary/50"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3 w-3 mr-1" /> Añadir ejercicio
      </Button>
      <AddExerciseDialog
        open={open}
        onOpenChange={setOpen}
        onAdd={ex => { onExerciseAdded(ex); setOpen(false); }}
      />
    </>
  );
}

// ── Added exercise row (inside a block) ───────────────────────────────────────
export function ExerciseItem({
  exercise,
  onChange,
  onRemove,
}: {
  exercise: LocalExercise;
  onChange: (updated: LocalExercise) => void;
  onRemove: () => void;
}) {
  const set = (k: keyof LocalExercise, v: any) => onChange({ ...exercise, [k]: v });
  return (
    <div className="bg-card border border-border/60 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{exercise.name}</p>
            {exercise.hasWeight && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">con peso</span>
            )}
          </div>
          {exercise.notes && (
            <NotesDisplay text={exercise.notes} className="text-muted-foreground mt-0.5" />
          )}
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300 shrink-0"
          onClick={onRemove}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Series</Label>
          <Input type="number" min={0} value={exercise.sets}
            onChange={e => set("sets", Number(e.target.value))} className="h-7 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Reps</Label>
          <Input placeholder="10 / al fallo" value={exercise.reps}
            onChange={e => set("reps", e.target.value)} className="h-7 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Duración</Label>
          <Input placeholder="45 seg" value={exercise.duration}
            onChange={e => set("duration", e.target.value)} className="h-7 text-xs" />
        </div>
      </div>
      {exercise.hasWeight && (
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <Weight className="h-3 w-3" /> Peso (lbs)
          </Label>
          <Input
            type="number" min={0}
            placeholder="ej: 135"
            value={exercise.weightLbs ?? ""}
            onChange={e => set("weightLbs", e.target.value !== "" ? Number(e.target.value) : null)}
            className="h-7 text-xs"
          />
        </div>
      )}
    </div>
  );
}
