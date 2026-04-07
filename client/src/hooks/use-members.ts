import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Member, CheckIn, Payment, Workout, MemberWorkout, InsertPayment, UpsertWorkout, AssignWorkout } from "@shared/schema";

const json = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error en la solicitud");
  return data;
};

// Members
export function useMembers() {
  return useQuery<Member[]>({
    queryKey: ["/api/members"],
    queryFn: () => fetch("/api/members", { credentials: "include" }).then(json),
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: any) => fetch("/api/members", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(json),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/members"] }); toast({ title: "Miembro creado" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & any) => fetch(`/api/members/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(json),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/members"] }); toast({ title: "Miembro actualizado" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useAddSessions() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, sessions }: { id: number; sessions: number }) => fetch(`/api/members/${id}/sessions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessions }), credentials: "include",
    }).then(json),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/members"] }); toast({ title: "Sesiones agregadas" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: number) => fetch(`/api/members/${id}`, { method: "DELETE", credentials: "include" })
      .then(r => { if (!r.ok) throw new Error("Error al eliminar"); }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/members"] }); toast({ title: "Miembro eliminado" }); },
  });
}

// Check-ins
export function useCheckIns() {
  return useQuery<(CheckIn & { member: Member })[]>({
    queryKey: ["/api/check-ins"],
    queryFn: () => fetch("/api/check-ins", { credentials: "include" }).then(json),
  });
}

export function useMyCheckIns() {
  return useQuery<CheckIn[]>({
    queryKey: ["/api/me/check-ins"],
    queryFn: () => fetch("/api/me/check-ins", { credentials: "include" }).then(json),
  });
}

export function useKioskCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => fetch("/api/check-ins", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    }).then(json),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/check-ins"] });
      qc.invalidateQueries({ queryKey: ["/api/members"] });
    },
  });
}

// Member self check-in (from dashboard)
export function useMemberCheckIn() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => fetch("/api/me/check-in", {
      method: "POST", credentials: "include",
    }).then(json),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/me/check-ins"] });
      qc.invalidateQueries({ queryKey: ["/api/me/full"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// Payments
export function useCreatePayment() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: InsertPayment) => fetch("/api/payments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(json),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/members"] });
      qc.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Pago registrado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useMemberPayments(memberId: number) {
  return useQuery<Payment[]>({
    queryKey: [`/api/members/${memberId}/payments`],
    queryFn: () => fetch(`/api/members/${memberId}/payments`, { credentials: "include" }).then(json),
    enabled: !!memberId,
  });
}

// Weekly Workouts
export function useAllWorkouts() {
  return useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
    queryFn: () => fetch("/api/workouts", { credentials: "include" }).then(json),
  });
}

export function useWorkoutToday() {
  const day = new Date().getDay();
  return useQuery<Workout | null>({
    queryKey: ["/api/workouts/day", day],
    queryFn: () => fetch(`/api/workouts/day/${day}`, { credentials: "include" }).then(json),
  });
}

export function useUpsertWorkout() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ day, data }: { day: number; data: UpsertWorkout }) =>
      fetch(`/api/workouts/day/${day}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), credentials: "include",
      }).then(json),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({ title: "Rutina guardada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (day: number) => fetch(`/api/workouts/day/${day}`, {
      method: "DELETE", credentials: "include",
    }).then(r => { if (!r.ok) throw new Error("Error"); }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/workouts"] }),
  });
}

// Personalized Workouts
export function useMyPersonalWorkouts() {
  return useQuery<Workout[]>({
    queryKey: ["/api/me/workouts"],
    queryFn: () => fetch("/api/me/workouts", { credentials: "include" }).then(json),
  });
}

export function useAssignWorkout(memberId: number) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: AssignWorkout) => fetch(`/api/members/${memberId}/workouts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), credentials: "include",
    }).then(json),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/members/${memberId}/workouts`] });
      toast({ title: "Rutina asignada", description: "El miembro verá la rutina en su dashboard por 6 horas." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export type ActiveMemberWorkout = MemberWorkout & { workout: Workout };

export function useMemberActiveWorkouts(memberId: number, enabled = true) {
  return useQuery<ActiveMemberWorkout[]>({
    queryKey: [`/api/members/${memberId}/workouts`],
    queryFn: () => fetch(`/api/members/${memberId}/workouts`, { credentials: "include" }).then(json),
    enabled: enabled && !!memberId,
  });
}

export function useUpdateAssignedWorkout(memberId: number) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ memberWorkoutId, data }: { memberWorkoutId: number; data: AssignWorkout }) =>
      fetch(`/api/members/${memberId}/workouts/${memberWorkoutId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), credentials: "include",
      }).then(json),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/members/${memberId}/workouts`] });
      toast({ title: "Rutina actualizada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteAssignedWorkout(memberId: number) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (memberWorkoutId: number) =>
      fetch(`/api/members/${memberId}/workouts/${memberWorkoutId}`, {
        method: "DELETE", credentials: "include",
      }).then(r => { if (!r.ok) throw new Error("Error al eliminar"); }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/members/${memberId}/workouts`] });
      toast({ title: "Rutina eliminada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useNextMemberId(enabled = true) {
  return useQuery<{ nextId: string }>({
    queryKey: ["/api/members/next-id"],
    queryFn: () => fetch("/api/members/next-id", { credentials: "include" }).then(json),
    enabled,
    staleTime: 0,
  });
}

export function useCheckMemberId(memberId: string, enabled = true) {
  return useQuery<{ available: boolean }>({
    queryKey: ["/api/members/check-id", memberId],
    queryFn: () => fetch(`/api/members/check-id/${encodeURIComponent(memberId)}`, { credentials: "include" }).then(json),
    enabled: enabled && memberId.trim().length > 0,
    staleTime: 0,
  });
}
