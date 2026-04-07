import { useState, useEffect, useRef } from "react";
import { useExercises, useRecentExercises, useCreateExercise } from "@/hooks/use-members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { LibraryExercise } from "@shared/schema";

// ── URL renderer ───────────────────────────────────────────────────────────────
export function renderNotesWithLinks(text: string): React.ReactNode {
  if (!text) return null;
  const urlPattern = /https?:\/\/[^\s]+/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = urlPattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    nodes.push(
      <a key={match.index} href={match[0]} target="_blank" rel="noopener noreferrer"
        className="text-primary hover:underline break-all" onClick={e => e.stopPropagation()}>
        {match[0]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.length > 0 ? nodes : text;
}

// ── Create Exercise Dialog ─────────────────────────────────────────────────────
function CreateExerciseDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (ex: LibraryExercise) => void;
}) {
  const create = useCreateExercise();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) { setName(""); setNotes(""); }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate({ name: name.trim(), notes: notes.trim() || null }, {
      onSuccess: (ex) => {
        onCreated(ex);
        toast({ title: "Ejercicio creado y añadido" });
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Crear ejercicio nuevo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Nombre del ejercicio <span className="text-primary text-xs">(requerido)</span></Label>
            <Input
              placeholder="Ej: Press de banca, Sentadilla..."
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
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
              <div className="text-xs text-muted-foreground border border-border/50 rounded-lg p-2 bg-secondary/10">
                <p className="text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wider">Vista previa:</p>
                <p className="text-xs leading-relaxed break-words">{renderNotesWithLinks(notes)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              {create.isPending ? "Guardando..." : "Guardar ejercicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Exercise picker row ────────────────────────────────────────────────────────
function ExerciseRow({ exercise, onAdd }: { exercise: LibraryExercise; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-secondary/30 group">
      <div className="flex-1 min-w-0 mr-2">
        <span className="text-sm truncate block">{exercise.name}</span>
        {exercise.notes && (
          <span className="text-xs text-muted-foreground truncate block">{exercise.notes.slice(0, 50)}{exercise.notes.length > 50 ? "…" : ""}</span>
        )}
      </div>
      <Button
        type="button" size="sm" variant="ghost"
        className="h-6 text-xs px-2 text-primary shrink-0 opacity-70 group-hover:opacity-100"
        onClick={onAdd}
      >
        + Añadir
      </Button>
    </div>
  );
}

// ── Local exercise state (in a block, before saving) ──────────────────────────
export type LocalExercise = {
  exerciseId: number;
  name: string;
  notes: string | null;
  sets: number;
  reps: string;
  duration: string;
};

// ── ExercisePicker ─────────────────────────────────────────────────────────────
export function ExercisePicker({ onExerciseAdded }: {
  onExerciseAdded: (ex: { exerciseId: number; name: string; notes: string | null }) => void;
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const { data: allExercises } = useExercises();
  const { data: recentExercises } = useRecentExercises();

  const displayList = debouncedSearch.length > 0
    ? (allExercises || []).filter(e =>
        e.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : null; // null = show recent

  const handleAdd = (ex: LibraryExercise) => {
    onExerciseAdded({ exerciseId: ex.id, name: ex.name, notes: ex.notes ?? null });
    setSearch("");
  };

  const handleCreated = (ex: LibraryExercise) => {
    handleAdd(ex);
  };

  return (
    <div className="border border-dashed border-border rounded-xl p-3 space-y-2 bg-secondary/5">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar en la biblioteca..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <div className="space-y-0.5 max-h-40 overflow-y-auto">
        {displayList !== null ? (
          displayList.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">Sin resultados para "{debouncedSearch}"</p>
          ) : (
            displayList.map(ex => (
              <ExerciseRow key={ex.id} exercise={ex} onAdd={() => handleAdd(ex)} />
            ))
          )
        ) : recentExercises && recentExercises.length > 0 ? (
          <>
            <p className="text-xs text-muted-foreground uppercase tracking-wider px-1 pb-0.5">Usados recientemente</p>
            {recentExercises.map(ex => (
              <ExerciseRow key={ex.id} exercise={ex} onAdd={() => handleAdd(ex)} />
            ))}
          </>
        ) : (
          <p className="text-xs text-muted-foreground py-2 text-center">
            La biblioteca está vacía. Crea tu primer ejercicio.
          </p>
        )}
      </div>

      <Button
        type="button" variant="ghost" size="sm"
        className="w-full text-xs text-muted-foreground h-7 border border-dashed border-border hover:border-primary/40"
        onClick={() => setShowCreate(true)}
      >
        <Plus className="h-3 w-3 mr-1" /> Crear ejercicio nuevo
      </Button>

      <CreateExerciseDialog open={showCreate} onOpenChange={setShowCreate} onCreated={handleCreated} />
    </div>
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
          <p className="text-sm font-medium truncate">{exercise.name}</p>
          {exercise.notes && (
            <p className="text-xs text-muted-foreground mt-0.5 break-words">
              {renderNotesWithLinks(exercise.notes)}
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
    </div>
  );
}
