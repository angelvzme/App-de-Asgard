import { useState, useEffect } from "react";
import {
  useExercises, useCreateExercise, useUpdateExercise, useDeleteExercise,
} from "@/hooks/use-members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Pencil, Trash2, Dumbbell, Clock } from "lucide-react";
import AdminLayout from "@/components/layout-admin";
import { NotesDisplay } from "@/components/notes-display";
import type { LibraryExerciseWithUsage } from "@shared/schema";

// ── Shared form fields ────────────────────────────────────────────────────────
function ExerciseFormFields({
  name, onName,
  notes, onNotes,
  hasWeight, onHasWeight,
}: {
  name: string; onName: (v: string) => void;
  notes: string; onNotes: (v: string) => void;
  hasWeight: boolean; onHasWeight: (v: boolean) => void;
}) {
  return (
    <>
      <div className="space-y-1">
        <Label>Nombre <span className="text-primary text-xs">(requerido)</span></Label>
        <Input
          value={name}
          onChange={e => onName(e.target.value)}
          placeholder="Ej: Sentadilla, Press de banca..."
          required
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">¿Lleva peso?</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onHasWeight(true)}
            className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm transition-all ${
              hasWeight
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-secondary/20 text-muted-foreground hover:border-border/80"
            }`}
          >
            <Dumbbell className="h-4 w-4" /> Sí, lleva peso
          </button>
          <button
            type="button"
            onClick={() => onHasWeight(false)}
            className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm transition-all ${
              !hasWeight
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-secondary/20 text-muted-foreground hover:border-border/80"
            }`}
          >
            <Clock className="h-4 w-4" /> No lleva peso
          </button>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Notas / Enlace de referencia <span className="text-muted-foreground text-xs">(opcional)</span></Label>
        <Textarea value={notes} onChange={e => onNotes(e.target.value)} rows={3} />
        {notes.trim() && (
          <div className="text-xs border border-border/50 rounded-lg p-2 bg-secondary/10">
            <p className="text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wider">Vista previa:</p>
            <NotesDisplay text={notes} />
          </div>
        )}
      </div>
    </>
  );
}

// ── Create Dialog ─────────────────────────────────────────────────────────────
function CreateExerciseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const create = useCreateExercise();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [hasWeight, setHasWeight] = useState(false);

  useEffect(() => {
    if (!open) { setName(""); setNotes(""); setHasWeight(false); }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), notes: notes.trim() || null, hasWeight },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Nuevo ejercicio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <ExerciseFormFields
            name={name} onName={setName}
            notes={notes} onNotes={setNotes}
            hasWeight={hasWeight} onHasWeight={setHasWeight}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              {create.isPending ? "Guardando..." : "Guardar ejercicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Dialog ───────────────────────────────────────────────────────────────
function EditExerciseDialog({
  exercise,
  open,
  onOpenChange,
}: {
  exercise: LibraryExerciseWithUsage;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const update = useUpdateExercise();
  const [name, setName] = useState(exercise.name);
  const [notes, setNotes] = useState(exercise.notes ?? "");
  const [hasWeight, setHasWeight] = useState(exercise.hasWeight);

  useEffect(() => {
    if (open) {
      setName(exercise.name);
      setNotes(exercise.notes ?? "");
      setHasWeight(exercise.hasWeight);
    }
  }, [open, exercise]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      { id: exercise.id, name: name.trim(), notes: notes.trim() || null, hasWeight },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Editar ejercicio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <ExerciseFormFields
            name={name} onName={setName}
            notes={notes} onNotes={setNotes}
            hasWeight={hasWeight} onHasWeight={setHasWeight}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={update.isPending || !name.trim()}>
              {update.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ExercisesPage() {
  const { data: exerciseList, isLoading } = useExercises();
  const deleteEx = useDeleteExercise();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingEx, setEditingEx] = useState<LibraryExerciseWithUsage | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const filtered = (exerciseList ?? []).filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (ex: LibraryExerciseWithUsage) => {
    if (confirmDeleteId === ex.id) {
      deleteEx.mutate(ex.id, { onSuccess: () => setConfirmDeleteId(null) });
    } else {
      setConfirmDeleteId(ex.id);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Biblioteca de ejercicios</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los ejercicios reutilizables en todas las rutinas.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo ejercicio
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
            {search
              ? `Sin resultados para "${search}"`
              : "La biblioteca está vacía. Crea tu primer ejercicio."}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(ex => (
              <div
                key={ex.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border bg-secondary/5 hover:bg-secondary/10"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{ex.name}</p>
                    {ex.hasWeight && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        Lleva peso
                      </span>
                    )}
                  </div>
                  {ex.notes && (
                    <NotesDisplay text={ex.notes} className="text-muted-foreground mt-0.5" />
                  )}
                  {ex.usageCount > 0 && (
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Usado en {ex.usageCount} {ex.usageCount === 1 ? "bloque" : "bloques"}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => { setConfirmDeleteId(null); setEditingEx(ex); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {confirmDeleteId === ex.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs px-2"
                        disabled={deleteEx.isPending}
                        onClick={() => handleDelete(ex)}
                      >
                        {deleteEx.isPending
                          ? "..."
                          : ex.usageCount > 0
                            ? `Eliminar (${ex.usageCount} usos)`
                            : "Confirmar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs px-2"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                      onClick={() => setConfirmDeleteId(ex.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {confirmDeleteId !== null && (() => {
              const ex = filtered.find(e => e.id === confirmDeleteId);
              return ex && ex.usageCount > 0 ? (
                <p className="text-xs text-orange-400 px-1">
                  ⚠️ Este ejercicio está asignado a {ex.usageCount}{" "}
                  {ex.usageCount === 1 ? "bloque" : "bloques"}. Al eliminarlo se quitará
                  de todas las rutinas donde aparece.
                </p>
              ) : null;
            })()}
          </div>
        )}
      </div>

      <CreateExerciseDialog open={showCreate} onOpenChange={setShowCreate} />

      {editingEx && (
        <EditExerciseDialog
          exercise={editingEx}
          open={!!editingEx}
          onOpenChange={v => { if (!v) setEditingEx(null); }}
        />
      )}
    </AdminLayout>
  );
}
