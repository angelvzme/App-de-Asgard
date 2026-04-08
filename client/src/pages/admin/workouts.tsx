import { useState, useEffect } from "react";
import {
  useAllWorkouts, useUpsertWorkout, useDeleteWorkout,
  useExercises, useUpdateExercise, useDeleteExercise, useCreateExercise,
} from "@/hooks/use-members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, Moon, Search, Pencil, Dumbbell, Clock, BookOpen } from "lucide-react";
import AdminLayout from "@/components/layout-admin";
import {
  ExercisePicker, ExerciseItem, renderNotesWithLinks,
  type LocalExercise,
} from "@/components/exercise-picker";
import type { WorkoutFull } from "@shared/schema";
import type { LibraryExerciseWithUsage } from "@shared/schema";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type LocalBlock = { title: string; exercises: LocalExercise[] };

function emptyLocalBlock(): LocalBlock { return { title: "", exercises: [] }; }

function localBlocksFromFull(workout: WorkoutFull | undefined): LocalBlock[] {
  if (!workout) return [];
  return workout.blocks.map(b => ({
    title: b.title,
    exercises: b.exercises.map(e => ({
      exerciseId: e.exerciseId,
      name: e.name,
      notes: e.notes,
      hasWeight: e.hasWeight,
      sets: e.sets ?? 3,
      reps: e.reps ?? "",
      duration: e.duration ?? "",
      weightLbs: e.weightLbs ?? null,
    })),
  }));
}

// ── Block Editor ──────────────────────────────────────────────────────────────
function BlockEditor({
  block, index, onChange, onRemove,
}: {
  block: LocalBlock;
  index: number;
  onChange: (b: LocalBlock) => void;
  onRemove: () => void;
}) {
  const updateEx = (i: number, updated: LocalExercise) =>
    onChange({ ...block, exercises: block.exercises.map((e, idx) => idx === i ? updated : e) });
  const removeEx = (i: number) =>
    onChange({ ...block, exercises: block.exercises.filter((_, idx) => idx !== i) });
  const addFromPicker = (ex: LocalExercise) =>
    onChange({ ...block, exercises: [...block.exercises, ex] });

  return (
    <div className="bg-secondary/10 border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bloque {index + 1} — Título</Label>
          <Input
            placeholder='Ej: "Rutina A", "Para principiantes"'
            value={block.title}
            onChange={e => onChange({ ...block, title: e.target.value })}
          />
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-300 self-end"
          onClick={onRemove} title="Eliminar bloque">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {block.exercises.map((ex, i) => (
          <ExerciseItem
            key={`${ex.exerciseId}-${i}`}
            exercise={ex}
            onChange={updated => updateEx(i, updated)}
            onRemove={() => removeEx(i)}
          />
        ))}
      </div>

      <ExercisePicker onExerciseAdded={addFromPicker} />
    </div>
  );
}

// ── Day Editor ────────────────────────────────────────────────────────────────
function DayEditor({ day, workout }: { day: number; workout?: WorkoutFull }) {
  const [title, setTitle] = useState(workout?.title || "");
  const [blocks, setBlocks] = useState<LocalBlock[]>(localBlocksFromFull(workout));
  const upsert = useUpsertWorkout();
  const deleteW = useDeleteWorkout();

  const addBlock = () => setBlocks(prev => [...prev, emptyLocalBlock()]);
  const updateBlock = (i: number, b: LocalBlock) => setBlocks(prev => prev.map((bl, idx) => idx === i ? b : bl));
  const removeBlock = (i: number) => setBlocks(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!title.trim()) return;
    const data = {
      title,
      blocks: blocks.map(b => ({
        title: b.title,
        exercises: b.exercises.map(e => ({
          exerciseId: e.exerciseId,
          sets: e.sets || null,
          reps: e.reps || null,
          duration: e.duration || null,
          weightLbs: e.weightLbs ?? null,
        })),
      })),
    };
    upsert.mutate({ day, data });
  };

  const handleRest = () => {
    deleteW.mutate(day, { onSuccess: () => { setTitle(""); setBlocks([]); } });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm">Título del día</Label>
        <Input
          placeholder="Ej: Día de Pierna, Espalda y Bíceps…"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="text-lg"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Bloques de entrenamiento ({blocks.length})</Label>
          <Button variant="outline" size="sm" onClick={addBlock}>
            <Plus className="h-4 w-4 mr-1" /> Agregar bloque
          </Button>
        </div>

        {blocks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
            <p className="mb-2">Sin bloques configurados.</p>
            <Button variant="ghost" size="sm" onClick={addBlock}>
              <Plus className="h-4 w-4 mr-1" /> Crear primer bloque
            </Button>
          </div>
        ) : (
          blocks.map((block, i) => (
            <BlockEditor
              key={i}
              index={i}
              block={block}
              onChange={b => updateBlock(i, b)}
              onRemove={() => removeBlock(i)}
            />
          ))
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={upsert.isPending || !title.trim()} className="flex-1">
          <Save className="mr-2 h-4 w-4" />
          {upsert.isPending ? "Guardando..." : "Guardar Rutina"}
        </Button>
        <Button variant="outline" onClick={handleRest} disabled={deleteW.isPending} className="text-muted-foreground">
          <Moon className="mr-2 h-4 w-4" /> Día de descanso
        </Button>
      </div>
    </div>
  );
}

// ── Shared exercise form fields (used by create + edit dialogs) ───────────────
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
        <Input value={name} onChange={e => onName(e.target.value)} placeholder="Ej: Sentadilla, Press de banca..." required />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">¿Lleva peso?</Label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onHasWeight(true)}
            className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm transition-all ${hasWeight ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/20 text-muted-foreground hover:border-border/80"}`}>
            <Dumbbell className="h-4 w-4" /> Sí, lleva peso
          </button>
          <button type="button" onClick={() => onHasWeight(false)}
            className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm transition-all ${!hasWeight ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/20 text-muted-foreground hover:border-border/80"}`}>
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
            <p className="text-xs leading-relaxed break-words">{renderNotesWithLinks(notes)}</p>
          </div>
        )}
      </div>
    </>
  );
}

// ── Create Library Exercise Dialog ────────────────────────────────────────────
function CreateLibraryExerciseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateExercise();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [hasWeight, setHasWeight] = useState(false);
  useEffect(() => { if (!open) { setName(""); setNotes(""); setHasWeight(false); } }, [open]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate({ name: name.trim(), notes: notes.trim() || null, hasWeight }, {
      onSuccess: () => onOpenChange(false),
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-card border-border">
        <DialogHeader><DialogTitle>Nuevo ejercicio</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <ExerciseFormFields name={name} onName={setName} notes={notes} onNotes={setNotes} hasWeight={hasWeight} onHasWeight={setHasWeight} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              {create.isPending ? "Guardando..." : "Crear ejercicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Exercise Dialog ──────────────────────────────────────────────────────
function EditExerciseDialog({
  exercise, open, onOpenChange,
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
    if (open) { setName(exercise.name); setNotes(exercise.notes ?? ""); setHasWeight(exercise.hasWeight); }
  }, [open, exercise]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({ id: exercise.id, name: name.trim(), notes: notes.trim() || null, hasWeight }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-card border-border">
        <DialogHeader><DialogTitle>Editar ejercicio</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <ExerciseFormFields name={name} onName={setName} notes={notes} onNotes={setNotes} hasWeight={hasWeight} onHasWeight={setHasWeight} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={update.isPending || !name.trim()}>
              {update.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Library Tab ───────────────────────────────────────────────────────────────
function ExerciseLibrary() {
  const { data: exerciseList, isLoading } = useExercises();
  const deleteEx = useDeleteExercise();
  const [search, setSearch] = useState("");
  const [editingEx, setEditingEx] = useState<LibraryExerciseWithUsage | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = (exerciseList || []).filter(e =>
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
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Biblioteca de ejercicios</h2>
          <p className="text-sm text-muted-foreground">Gestiona los ejercicios reutilizables en todas las rutinas.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nuevo ejercicio
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          {search ? `Sin resultados para "${search}"` : "La biblioteca está vacía. Crea tu primer ejercicio."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(ex => (
            <div key={ex.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border bg-secondary/5 hover:bg-secondary/10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{ex.name}</p>
                  {ex.hasWeight && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">con peso</span>
                  )}
                </div>
                {ex.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5 break-words">
                    {renderNotesWithLinks(ex.notes)}
                  </p>
                )}
                {ex.usageCount > 0 && (
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Usado en {ex.usageCount} {ex.usageCount === 1 ? "bloque" : "bloques"}
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                  onClick={() => { setConfirmDeleteId(null); setEditingEx(ex); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {confirmDeleteId === ex.id ? (
                  <div className="flex gap-1">
                    <Button size="sm" variant="destructive" className="h-7 text-xs px-2"
                      disabled={deleteEx.isPending} onClick={() => handleDelete(ex)}>
                      {deleteEx.isPending ? "..." : ex.usageCount > 0 ? `Eliminar (${ex.usageCount} usos)` : "Confirmar"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                      onClick={() => setConfirmDeleteId(null)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                    onClick={() => setConfirmDeleteId(ex.id)}>
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
                ⚠️ Este ejercicio está asignado a {ex.usageCount} {ex.usageCount === 1 ? "bloque" : "bloques"}. Al eliminarlo se quitará de todas las rutinas donde aparece.
              </p>
            ) : null;
          })()}
        </div>
      )}

      {editingEx && (
        <EditExerciseDialog
          exercise={editingEx}
          open={!!editingEx}
          onOpenChange={v => { if (!v) setEditingEx(null); }}
        />
      )}

      <CreateLibraryExerciseDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WorkoutsPage() {
  const { data: workouts, isLoading } = useAllWorkouts();
  const workoutByDay = (day: number) => workouts?.find(w => w.dayOfWeek === day);
  const today = new Date().getDay();

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Rutinas</h1>
        <p className="text-muted-foreground mt-1">Configura las rutinas semanales y gestiona la biblioteca de ejercicios.</p>
      </div>

      <Tabs defaultValue="semana">
        <TabsList className="mb-6">
          <TabsTrigger value="semana">Rutinas semanales</TabsTrigger>
          <TabsTrigger value="biblioteca">
            <BookOpen className="h-3.5 w-3.5 mr-1" />Biblioteca de ejercicios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="semana">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <Tabs defaultValue={String(today)}>
              <TabsList className="grid grid-cols-7 w-full mb-8 h-auto">
                {DAYS_SHORT.map((d, i) => (
                  <TabsTrigger key={i} value={String(i)} className="flex flex-col py-2 px-1 text-xs gap-1">
                    <span>{d}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${workoutByDay(i) ? "bg-primary" : "bg-border"}`} />
                  </TabsTrigger>
                ))}
              </TabsList>

              {DAYS.map((dayName, i) => (
                <TabsContent key={i} value={String(i)}>
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="text-xl font-bold">{dayName}</h2>
                      {i === today && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Hoy</span>}
                      {!workoutByDay(i) && (
                        <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">Día de descanso</span>
                      )}
                    </div>
                    <DayEditor
                      key={`${i}-${workoutByDay(i)?.updatedAt}`}
                      day={i}
                      workout={workoutByDay(i)}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="biblioteca">
          <ExerciseLibrary />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
