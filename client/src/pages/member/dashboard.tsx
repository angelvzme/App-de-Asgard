import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useMyCheckIns, useWorkoutToday } from "@/hooks/use-members";
import { format, subDays, isSameDay, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { LogOut, Dumbbell, Clock, TrendingUp, CheckCircle2, Flame, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import gymLogo from "@assets/asgard-logo.png";
import type { CheckIn, Member, Workout } from "@shared/schema";

function useMyProfile() {
  return useQuery<Member>({
    queryKey: ["/api/me/full"],
    queryFn: () => fetch("/api/me/full", { credentials: "include" }).then(r => r.json()),
  });
}

function calcStreak(checkIns: CheckIn[]): number {
  if (!checkIns.length) return 0;
  const days = [...new Set(checkIns.map(c => format(new Date(c.checkInTime), "yyyy-MM-dd")))].sort().reverse();
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (const day of days) {
    const d = new Date(day);
    const diff = Math.round((cursor.getTime() - d.getTime()) / 86400000);
    if (diff === 0 || diff === 1) { streak++; cursor = d; }
    else break;
  }
  return streak;
}

function AttendanceChart({ checkIns }: { checkIns: CheckIn[] }) {
  const days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i));
  const data = days.map(d => ({
    date: format(d, "d"),
    label: format(d, "d MMM", { locale: es }),
    count: checkIns.filter(c => isSameDay(new Date(c.checkInTime), d)).length,
  }));
  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} barSize={8}>
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280" }} tickLine={false} axisLine={false} interval={4} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
          formatter={(v: any) => [v ? `${v} visita${v > 1 ? "s" : ""}` : "Sin visita", ""]}
          labelFormatter={(l) => data.find(d => d.date === l)?.label || l}
        />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.count > 0 ? "hsl(var(--primary))" : "rgba(255,255,255,0.08)"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function WorkoutCard({ workout }: { workout: Workout | null | undefined }) {
  if (workout === undefined) return <div className="h-32 animate-pulse bg-secondary/50 rounded-xl" />;
  if (!workout) return (
    <div className="text-center py-8 text-muted-foreground">
      <span className="text-4xl">💪</span>
      <p className="mt-2 text-sm font-medium">Día de descanso</p>
      <p className="text-xs mt-1">Descansa y recupera. ¡Mañana más fuerte!</p>
    </div>
  );
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-foreground">{workout.title}</h3>
      {workout.exercises && workout.exercises.length > 0 ? (
        <div className="space-y-2">
          {workout.exercises.map((ex, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
              <span className="text-xs text-muted-foreground font-mono w-5 pt-0.5">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{ex.name}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ex.sets > 0 && <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded">{ex.sets} series</span>}
                  {ex.reps && <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded">{ex.reps} reps</span>}
                  {ex.duration && <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded">{ex.duration}</span>}
                </div>
                {ex.notes && <p className="text-xs text-muted-foreground mt-1">{ex.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground">No hay ejercicios configurados.</p>}
    </div>
  );
}

export default function MemberDashboard() {
  const { user, logout, isLoggingOut } = useAuth();
  const { data: member } = useMyProfile();
  const { data: checkIns, isLoading: checkInsLoading } = useMyCheckIns();
  const { data: todayWorkout } = useWorkoutToday();

  const isUnlimited = member?.isSpecialUser || member?.membershipType === "unlimited";
  const remainingSessions = member?.remainingSessions ?? 0;
  const totalSessions = member?.totalSessions ?? 0;
  const progressPct = totalSessions > 0 ? Math.round((remainingSessions / totalSessions) * 100) : 0;
  const streak = checkIns ? calcStreak(checkIns) : 0;
  const totalVisits = checkIns?.length ?? 0;

  const todayName = format(new Date(), "EEEE", { locale: es });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={gymLogo} alt="Asgard" className="h-8 w-auto drop-shadow-[0_0_6px_rgba(220,38,38,0.4)]" />
            <span className="font-display text-xl font-bold tracking-tighter">ASGARD</span>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white" onClick={() => logout()} disabled={isLoggingOut}>
            <LogOut className="h-4 w-4 mr-1" />Salir
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Hola, {user?.firstName} 👋</h1>
          <p className="text-muted-foreground text-sm capitalize">{todayName} · Miembro #{user?.memberId}</p>
        </motion.div>

        {/* Sessions + Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3">
          <div className="col-span-1 bg-card border border-border rounded-2xl p-4 text-center">
            <Dumbbell className="h-5 w-5 text-primary mx-auto mb-2" />
            {!member ? <div className="h-8 w-12 bg-secondary animate-pulse rounded mx-auto" /> : (
              <div className="text-3xl font-black text-foreground">{isUnlimited ? "∞" : remainingSessions}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">Sesiones</div>
          </div>
          <div className="col-span-1 bg-card border border-border rounded-2xl p-4 text-center">
            <Flame className="h-5 w-5 text-orange-400 mx-auto mb-2" />
            <div className="text-3xl font-black text-foreground">{streak}</div>
            <div className="text-xs text-muted-foreground mt-1">Racha días</div>
          </div>
          <div className="col-span-1 bg-card border border-border rounded-2xl p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <div className="text-3xl font-black text-foreground">{totalVisits}</div>
            <div className="text-xs text-muted-foreground mt-1">Total visitas</div>
          </div>
        </motion.div>

        {/* Session progress bar */}
        {!isUnlimited && member && totalSessions > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="bg-card border border-border rounded-2xl p-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Usadas: {totalSessions - remainingSessions}</span>
              <span>Total: {totalSessions}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div className={`h-full rounded-full ${progressPct > 30 ? "bg-primary" : "bg-red-500"}`}
                initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.8 }} />
            </div>
            {remainingSessions <= 3 && remainingSessions > 0 && (
              <p className="text-xs text-orange-400 mt-2 text-center font-medium">⚠️ Quedan pocas sesiones. ¡Renueva pronto!</p>
            )}
            {remainingSessions === 0 && (
              <p className="text-xs text-red-400 mt-2 text-center font-medium">Sin sesiones disponibles. Contacta al gimnasio.</p>
            )}
          </motion.div>
        )}

        {/* Attendance chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Asistencia — últimos 30 días</h2>
          </div>
          {checkInsLoading ? <div className="h-24 animate-pulse bg-secondary/50 rounded" /> :
            checkIns ? <AttendanceChart checkIns={checkIns} /> : null}
        </motion.div>

        {/* Today's workout */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Mi entrenamiento de hoy</h2>
          </div>
          <WorkoutCard workout={todayWorkout} />
        </motion.div>

        {/* Check-in history */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Historial de entradas</h2>
          </div>
          {checkInsLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-secondary/50 rounded-lg animate-pulse" />)}</div>
          ) : !checkIns?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Aún no tienes entrenamientos registrados.</div>
          ) : (
            <div className="space-y-2">
              {checkIns.slice(0, 15).map((c, i) => (
                <div key={c.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    <p className="text-sm font-medium capitalize">
                      {format(new Date(c.checkInTime), "EEEE, d 'de' MMMM", { locale: es })} · {format(new Date(c.checkInTime), "h:mm a")}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.checkInTime), { addSuffix: true, locale: es })}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
