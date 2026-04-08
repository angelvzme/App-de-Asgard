import { useState } from "react";
import { useMembers, useCheckIns, useTodayCheckIns } from "@/hooks/use-members";
import { Users, UserCheck, Activity, UserX } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import AdminLayout from "@/components/layout-admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ── Today's Check-ins Dialog ──────────────────────────────────────────────────
function TodayCheckInsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: todayCheckIns, isLoading } = useTodayCheckIns(open);

  const todayLabel = format(new Date(), "EEEE d 'de' MMMM", { locale: es });
  // Capitalize first letter
  const title = `Check-ins de hoy — ${todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-base">{title}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : !todayCheckIns || todayCheckIns.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">Sin entradas registradas hoy.</p>
          ) : (
            <div className="space-y-2">
              {todayCheckIns.map(c => {
                const isUnlimited = c.member.membershipType === "unlimited" || c.member.isSpecialUser;
                return (
                  <div key={c.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">
                          {c.member.firstName} {c.member.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(c.checkInTime), "h:mm a")}
                        </p>
                      </div>
                    </div>
                    {isUnlimited ? (
                      <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                        Ilimitada
                      </span>
                    ) : (
                      <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                        Regular
                      </span>
                    )}
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground text-center pt-2">
                {todayCheckIns.length} entrada{todayCheckIns.length !== 1 ? "s" : ""} — se actualiza cada 30 seg
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, trend, onClick }: any) {
  const base = "bg-card rounded-2xl p-6 border border-border shadow-sm";
  const interactive = onClick ? "cursor-pointer hover:border-primary/50 hover:bg-card/80 transition-colors" : "";
  return (
    <div className={`${base} ${interactive}`} onClick={onClick}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="flex items-baseline">
        <h2 className="text-3xl font-bold text-foreground">{value}</h2>
        {trend && <span className="ml-2 text-xs text-green-500 font-medium">{trend}</span>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: checkIns, isLoading: checkInsLoading } = useCheckIns();
  const [showTodayDialog, setShowTodayDialog] = useState(false);

  if (membersLoading || checkInsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  // Calculate stats
  const totalMembers = members?.length || 0;
  const activeMembers = members?.filter(m => m.active).length || 0;

  const today = new Date().toDateString();
  const checkInsToday = checkIns?.filter(c => new Date(c.checkInTime).toDateString() === today).length || 0;

  const inactiveMembers = members?.filter(m => !m.isSpecialUser && m.membershipType === "sessions" && m.remainingSessions === 0).length || 0;

  // Prepare chart data (Last 7 days check-ins)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return d;
  });

  const chartData = last7Days.map(date => {
    const dateStr = date.toDateString();
    const count = checkIns?.filter(c => new Date(c.checkInTime).toDateString() === dateStr).length || 0;
    return {
      name: format(date, 'EEE'),
      fullDate: format(date, 'MMM d'),
      checkins: count
    };
  });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Panel de Control</h1>
        <p className="text-muted-foreground mt-1">Bienvenido de nuevo al Centro de Comando de Asgard.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Miembros"
          value={totalMembers}
          icon={Users}
        />
        <StatCard
          title="Miembros Activos"
          value={activeMembers}
          icon={UserCheck}
        />
        <StatCard
          title="Entradas Hoy"
          value={checkInsToday}
          icon={Activity}
          trend="En vivo"
          onClick={() => setShowTodayDialog(true)}
        />
        <StatCard
          title="Miembros sin sesiones"
          value={inactiveMembers}
          icon={UserX}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="text-lg font-bold mb-6 font-display">Tráfico de Entradas (Últimos 7 Días)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar
                  dataKey="checkins"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-lg font-bold mb-6 font-display">Actividad Reciente</h3>
          <div className="overflow-y-auto flex-1 -mr-4 pr-4">
            <div className="space-y-6">
              {checkIns?.slice(0, 10).map((checkIn) => (
                <div key={checkIn.id} className="flex items-start">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary mr-4 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {checkIn.member.firstName} {checkIn.member.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ingresó a las {format(new Date(checkIn.checkInTime), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              {(!checkIns || checkIns.length === 0) && (
                <p className="text-sm text-muted-foreground italic">No hay entradas registradas aún.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <TodayCheckInsDialog open={showTodayDialog} onOpenChange={setShowTodayDialog} />
    </AdminLayout>
  );
}
