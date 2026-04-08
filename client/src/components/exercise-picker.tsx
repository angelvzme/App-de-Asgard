import { useState, useEffect, useRef } from "react";
import { useExercises, useCreateExercise, useRecentExercises } from "@/hooks/use-members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Dumbbell, Clock, Weight } from "lucide-react";
import { parseNotesWithLinks } from "@/lib/utils";
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedName, setDebouncedName] = useState("");

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
      setShowDropdown(false);
      setDebouncedName("");
    } else {
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedName(name), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [name]);

  const suggestions = debouncedName.trim().length >= 1
    ? (allExercises || []).filter(e =>
        e.name.toLowerCase().includes(debouncedName.toLowerCase())
      ).slice(0, 7)
    : [];

  const isExactMatch = (allExercises || []).some(
    e => e.name.toLowerCase() === name.trim().toLowerCase()
  );

  const handleSelectExercise = (ex: LibraryExercise) => {
    setSelectedExercise(ex);
    setName(ex.name);
    setHasWeight(ex.hasWeight);
    setShowDropdown(false);
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

  // Exercises to show when input is empty
  const showingRecent = recentExercises && recentExercises.length > 0;
  const emptyListItems: LibraryExercise[] = showingRecent
    ? recentExercises!
    : (allExercises || []).slice(0, 6);
  const emptyListLabel = showingRecent ? "Usados recientemente" : "Todos los ejercicios";

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

        {/* ── Step 1: Search + suggestions ── */}
        {step === 1 && (
          <div className="space-y-3 py-2">
            {/* Search input with dropdown */}
            <div className="space-y-1 relative">
              <Label>Nombre del ejercicio <span className="text-primary text-xs">(requerido)</span></Label>
              <Input
                ref={nameRef}
                placeholder="Buscar o escribir nombre nuevo..."
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setShowDropdown(true);
                  setSelectedExercise(null);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                autoComplete="off"
              />

              {/* Dropdown when typing */}
              {showDropdown && debouncedName.trim().length >= 1 && (suggestions.length > 0 || (!isExactMatch && name.trim())) && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                  {suggestions.map(ex => (
                    <button
                      key={ex.id}
                      type="button"
                      className="w-full text-left px-3 py-2.5 hover:bg-secondary/50 transition-colors flex items-center justify-between gap-2 text-sm"
                      onMouseDown={() => handleSelectExercise(ex)}
                    >
                      <span className="font-medium truncate">{ex.name}</span>
                      {ex.notes && (
                        <span className="text-xs text-muted-foreground truncate hidden sm:block">
                          {ex.notes.slice(0, 40)}{ex.notes.length > 40 ? "…" : ""}
                        </span>
                      )}
                      {ex.hasWeight && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">Con peso</span>
                      )}
                    </button>
                  ))}
                  {/* Create-new option */}
                  {!isExactMatch && name.trim() && (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2.5 hover:bg-primary/10 text-primary transition-colors flex items-center gap-2 text-sm border-t border-border/40"
                      onMouseDown={handleStep1Continue}
                    >
                      <Plus className="h-3.5 w-3.5 shrink-0" />
                      <span>Crear "<span className="font-semibold">{name.trim()}</span>" como ejercicio nuevo</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {isExactMatch && (
              <p className="text-xs text-green-400">✓ Ejercicio encontrado en la biblioteca</p>
            )}

            {/* Recent / all list when input is empty */}
            {!name.trim() && emptyListItems.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
                  {emptyListLabel}
                </p>
                <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
                  {emptyListItems.map(ex => (
                    <ExerciseListItem
                      key={ex.id}
                      ex={ex}
                      onClick={() => handleSelectExercise(ex)}
                    />
                  ))}
                </div>
              </div>
            )}

            {!name.trim() && emptyListItems.length === 0 && (
              <p className="text-xs text-muted-foreground px-1 py-2">
                Escribe el nombre del ejercicio para buscarlo o crearlo nuevo.
              </p>
            )}

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
                  <p className="text-xs leading-relaxed break-words">{parseNotesWithLinks(notes)}</p>
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
              <p className="text-xs text-muted-foreground break-words leading-relaxed">
                {parseNotesWithLinks(selectedExercise.notes)}
              </p>
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
            <p className="text-xs text-muted-foreground mt-0.5 break-words">
              {parseNotesWithLinks(exercise.notes)}
            </p>
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
