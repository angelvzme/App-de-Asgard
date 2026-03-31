import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { LogOut, Dumbbell, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import gymLogo from "@assets/Dise#U00f1o_sin_t#U00edtulo_(1)_1773984151411.png";
import type { CheckIn } from "@shared/schema";

function useMyCheckIns() {
  return useQuery<CheckIn[]>({
    queryKey: ["/api/me/check-ins"],
    queryFn: () =>
      fetch("/api/me/check-ins", { credentials: "include" }).then((r) => r.json()),
  });
}

function useMyProfile() {
  return useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () =>
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
  });
}

export default function MemberDashboard() {
  const { user, logout, isLoggingOut } = useAuth();
  const { data: checkIns, isLoading } = useMyCheckIns();

  // Fetch full member data to get session counts
  const { data: memberData } = useQuery({
    queryKey: ["/api/me/profile"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      return res.json();
    },
  });

  // Get remaining sessions from the session user (refreshed on login)
  // We'll use a dedicated route for full member info
  const { data: fullMember } = useQuery({
    queryKey: ["/api/me/full"],
    queryFn: async () => {
      const res = await fetch("/api/me/full", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const remainingSessions = fullMember?.remainingSessions ?? 0;
  const totalSessions = fullMember?.totalSessions ?? 0;
  const progressPct = totalSessions > 0 ? Math.round((remainingSessions / totalSessions) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={gymLogo}
              alt="Asgard"
              className="h-8 w-auto drop-shadow-[0_0_6px_rgba(220,38,38,0.4)]"
            />
            <span className="font-display text-xl font-bold tracking-tighter">ASGARD</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-white"
            onClick={() => logout()}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Salir
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-foreground">
            Hola, {user?.firstName} 👋
          </h1>
          <p className="text-muted-foreground text-sm">Miembro #{user?.memberId}</p>
        </motion.div>

        {/* Sessions Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Mis Sesiones</h2>
          </div>

          <div className="text-center py-4">
            <div className="text-7xl font-black text-foreground mb-1">
              {fullMember ? remainingSessions : (
                <div className="animate-pulse bg-secondary rounded-lg h-20 w-24 mx-auto" />
              )}
            </div>
            <p className="text-muted-foreground text-sm">sesiones disponibles</p>
          </div>

          {/* Progress Bar */}
          {fullMember && totalSessions > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Usadas: {totalSessions - remainingSessions}</span>
                <span>Total comprado: {totalSessions}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    progressPct > 30 ? "bg-primary" : "bg-red-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
              {remainingSessions <= 3 && remainingSessions > 0 && (
                <p className="text-xs text-red-400 text-center font-medium">
                  ⚠️ Pocas sesiones restantes. ¡Renueva tu membresía!
                </p>
              )}
              {remainingSessions === 0 && (
                <p className="text-xs text-red-400 text-center font-medium">
                  Sin sesiones disponibles. Contacta al gimnasio para recargar.
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Stats Row */}
        {fullMember && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{totalSessions}</div>
              <div className="text-xs text-muted-foreground">Total comprado</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {totalSessions - remainingSessions}
              </div>
              <div className="text-xs text-muted-foreground">Entrenado</div>
            </div>
          </motion.div>
        )}

        {/* Check-in History */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Historial de Entradas</h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-secondary/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !checkIns || checkIns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aún no tienes entrenamientos registrados.</p>
              <p className="text-xs mt-1">¡Empieza hoy!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checkIns.slice(0, 10).map((checkIn, index) => (
                <motion.div
                  key={checkIn.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(checkIn.checkInTime), "EEEE, d MMMM", { locale: es })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(checkIn.checkInTime), "h:mm a")}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(checkIn.checkInTime), { addSuffix: true, locale: es })}
                  </span>
                </motion.div>
              ))}
              {checkIns.length > 10 && (
                <p className="text-xs text-center text-muted-foreground pt-2">
                  Mostrando los últimos 10 de {checkIns.length} entrenamientos
                </p>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
