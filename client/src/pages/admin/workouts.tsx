import { useState } from "react";
import { useAllWorkouts, useUpsertWorkout, useDeleteWorkout } from "@/hooks/use-members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, Moon } from "lucide-react";
import AdminLayout from "@/components/layout-admin";
import type { Exercise, Workout } from "@shared/schema";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function emptyExercise(): Exercise { return { name: "", sets: 3, reps: "10", duration: "", notes: "" }; }

function DayEditor({ day, workout, onSave, onRest }: { day: number; workout?: Workout; onSave: (d: number, t: string, e: Exercise[]) => void; onRest: (d: number) => void }) {
  const [title, setTitle] = useState(workout?.title || "");
  const [exercises, setExercises] = useState<Exercise[]>(workout?.exercises || []);
  const upsert = useUpsertWorkout();
  const deleteW = useDeleteWorkout();

  const addEx = () => setExercises(prev => [...prev, emptyExercise()]);
  const removeEx = (i: number) => setExercises(prev => prev.filter((_, idx) => idx !== i));
  const setEx = (i: number, k: keyof Exercise, v: any) => setExercises(prev => prev.map((e, idx) => idx === i ? { ...e, [k]: v } : e));

  const handleSave = () => {
    if (!title.trim()) return;
    upsert.mutate({ day, data: { title, exercises } });
  };

  const handleRest = () => {
    deleteW.mutate(day);
    setTitle(""); setExercises([]);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Título del día</Label>
        <Input placeholder={`Ej: Día de Pecho y Tríceps`} value={title} onChange={e => setTitle(e.target.value)} className="text-lg" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Ejercicios ({exercises.length})</Label>
          <Button variant="outline" size="sm" onClick={addEx}><Plus className="h-4 w-4 mr-1" />Agregar</Button>
        </div>

        {exercises.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
            <p>Sin ejercicios todavía.</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={addEx}><Plus className="h-4 w-4 mr-1" />Agregar ejercicio</Button>
          </div>
        ) : exercises.map((ex, i) => (
          <div key={i} className="bg-secondary/20 border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ejercicio {i + 1}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => removeEx(i)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-1"><Label className="text-xs">Nombre</Label><Input placeholder="Press de banca" value={ex.name} onChange={e => setEx(i, "name", e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1"><Label className="text-xs">Series</Label><Input type="number" value={ex.sets} onChange={e => setEx(i, "sets", Number(e.target.value))} /></div>
              <div className="space-y-1"><Label className="text-xs">Reps / Tiempo</Label><Input placeholder="10 / AMRAP" value={ex.reps} onChange={e => setEx(i, "reps", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Duración</Label><Input placeholder="60s descanso" value={ex.duration} onChange={e => setEx(i, "duration", e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Notas</Label><Input placeholder="Opcional" value={ex.notes} onChange={e => setEx(i, "notes", e.target.value)} /></div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={upsert.isPending || !title.trim()} className="flex-1">
          <Save className="mr-2 h-4 w-4" />{upsert.isPending ? "Guardando..." : "Guardar Rutina"}
        </Button>
        <Button variant="outline" onClick={handleRest} className="text-muted-foreground">
          <Moon className="mr-2 h-4 w-4" />Día de descanso
        </Button>
      </div>
    </div>
  );
}

export default function WorkoutsPage() {
  const { data: workouts, isLoading } = useAllWorkouts();
  const workoutByDay = (day: number) => workouts?.find(w => w.dayOfWeek === day);
  const today = new Date().getDay();
  const upsert = useUpsertWorkout();
  const deleteW = useDeleteWorkout();

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Rutinas de la Semana</h1>
        <p className="text-muted-foreground mt-1">Configura el entrenamiento de cada día. Los miembros lo verán en su dashboard.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>
      ) : (
        <Tabs defaultValue={String(today)}>
          <TabsList className="grid grid-cols-7 w-full mb-8 h-auto">
            {DAYS_SHORT.map((d, i) => (
              <TabsTrigger key={i} value={String(i)} className="flex flex-col py-2 px-1 text-xs gap-1">
                <span>{d}</span>
                {workoutByDay(i) ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-border" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {DAYS.map((dayName, i) => (
            <TabsContent key={i} value={String(i)}>
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-xl font-bold">{dayName}</h2>
                  {i === today && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Hoy</span>}
                  {!workoutByDay(i) && <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">Día de descanso</span>}
                </div>
                <DayEditor
                  key={`${i}-${workoutByDay(i)?.updatedAt}`}
                  day={i}
                  workout={workoutByDay(i)}
                  onSave={(d, t, e) => upsert.mutate({ day: d, data: { title: t, exercises: e } })}
                  onRest={(d) => deleteW.mutate(d)}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </AdminLayout>
  );
}
