import { useState } from "react";
import { useAllWorkouts, useUpsertWorkout, useDeleteWorkout } from "@/hooks/use-members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, Moon, ChevronDown, ChevronUp } from "lucide-react";
import AdminLayout from "@/components/layout-admin";
import type { WorkoutBlock, Exercise, Workout } from "@shared/schema";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function emptyExercise(): Exercise { return { name: "", sets: 3, reps: "10", duration: "", notes: "" }; }
function emptyBlock(): WorkoutBlock { return { title: "", exercises: [emptyExercise()] }; }

// ── Block Editor ──────────────────────────────────────────────────────────────
function BlockEditor({
  block, index, onChange, onRemove,
}: {
  block: WorkoutBlock;
  index: number;
  onChange: (b: WorkoutBlock) => void;
  onRemove: () => void;
}) {
  const setTitle = (t: string) => onChange({ ...block, title: t });
  const setEx = (i: number, k: keyof Exercise, v: any) =>
    onChange({ ...block, exercises: block.exercises.map((e, idx) => idx === i ? { ...e, [k]: v } : e) });
  const addEx = () => onChange({ ...block, exercises: [...block.exercises, emptyExercise()] });
  const removeEx = (i: number) => onChange({ ...block, exercises: block.exercises.filter((_, idx) => idx !== i) });

  return (
    <div className="bg-secondary/10 border border-border rounded-2xl p-5 space-y-4">
      {/* Block header */}
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bloque {index + 1} — Título</Label>
          <Input
            placeholder='Ej: "Rutina A", "Para principiantes", "Variante con peso"'
            value={block.title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-300 self-end" onClick={onRemove} title="Eliminar bloque">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        {block.exercises.map((ex, i) => (
          <div key={i} className="bg-card border border-border/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Ejercicio {i + 1}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300"
                onClick={() => removeEx(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nombre</Label>
              <Input placeholder="Press de banca, Sentadilla…" value={ex.name} onChange={e => setEx(i, "name", e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Series</Label>
                <Input type="number" min={0} value={ex.sets} onChange={e => setEx(i, "sets", Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Reps / AMRAP</Label>
                <Input placeholder="10 / al fallo" value={ex.reps} onChange={e => setEx(i, "reps", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duración</Label>
                <Input placeholder="45 seg" value={ex.duration} onChange={e => setEx(i, "duration", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notas (opcional)</Label>
              <Input placeholder="Opcional" value={ex.notes} onChange={e => setEx(i, "notes", e.target.value)} />
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full border-dashed" onClick={addEx}>
          <Plus className="h-4 w-4 mr-1" /> Agregar ejercicio
        </Button>
      </div>
    </div>
  );
}

// ── Day Editor ────────────────────────────────────────────────────────────────
function DayEditor({ day, workout }: { day: number; workout?: Workout }) {
  const [title, setTitle] = useState(workout?.title || "");
  const [blocks, setBlocks] = useState<WorkoutBlock[]>((workout?.blocks as WorkoutBlock[]) || []);
  const upsert = useUpsertWorkout();
  const deleteW = useDeleteWorkout();

  const addBlock = () => setBlocks(prev => [...prev, emptyBlock()]);
  const updateBlock = (i: number, b: WorkoutBlock) => setBlocks(prev => prev.map((bl, idx) => idx === i ? b : bl));
  const removeBlock = (i: number) => setBlocks(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!title.trim()) return;
    upsert.mutate({ day, data: { title, blocks } });
  };

  const handleRest = () => {
    deleteW.mutate(day, {
      onSuccess: () => { setTitle(""); setBlocks([]); },
    });
  };

  return (
    <div className="space-y-6">
      {/* Day title */}
      <div className="space-y-2">
        <Label className="text-sm">Título del día</Label>
        <Input
          placeholder="Ej: Día de Pierna, Espalda y Bíceps…"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="text-lg"
        />
      </div>

      {/* Blocks */}
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

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={upsert.isPending || !title.trim()}
          className="flex-1"
        >
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WorkoutsPage() {
  const { data: workouts, isLoading } = useAllWorkouts();
  const workoutByDay = (day: number) => workouts?.find(w => w.dayOfWeek === day);
  const today = new Date().getDay();

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Rutinas de la Semana</h1>
        <p className="text-muted-foreground mt-1">Configura el entrenamiento de cada día. Los miembros lo verán en su dashboard.</p>
      </div>

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
    </AdminLayout>
  );
}
