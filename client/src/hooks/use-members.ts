import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Member, CheckIn, Payment, Workout, InsertPayment, UpsertWorkout } from "@shared/schema";

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
    mutationFn: (data: any) => fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" }).then(json),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/members"] }); toast({ title: "Miembro creado" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & any) => fetch(`/api/members/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" }).then(json),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/members"] }); toast({ title: "Miembro actualizado" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useAddSessions() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, sessions }: { id: number; sessions: number }) => fetch(`/api/members/${id}/sessions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessions }), credentials: "include" }).then(json),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/members"] }); toast({ title: "Sesiones agregadas" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: number) => fetch(`/api/members/${id}`, { method: "DELETE", credentials: "include" }).then(r => { if (!r.ok) throw new Error("Error al eliminar"); }),
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
    mutationFn: (memberId: string) => fetch("/api/check-ins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId }) }).then(json),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/check-ins"] }); qc.invalidateQueries({ queryKey: ["/api/members"] }); },
  });
}

// Payments
export function useCreatePayment() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: InsertPayment) => fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" }).then(json),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/members"] }); qc.invalidateQueries({ queryKey: ["/api/payments"] }); toast({ title: "Pago registrado" }); },
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

// Workouts
export function useAllWorkouts() {
  return useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
    queryFn: () => fetch("/api/workouts", { credentials: "include" }).then(json),
  });
}

export function useWorkoutToday() {
  return useQuery<Workout | null>({
    queryKey: ["/api/me/workout-today"],
    queryFn: () => fetch("/api/me/workout-today", { credentials: "include" }).then(json),
  });
}

export function useUpsertWorkout() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ day, data }: { day: number; data: UpsertWorkout }) => fetch(`/api/workouts/${day}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" }).then(json),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/workouts"] }); toast({ title: "Rutina guardada" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (day: number) => fetch(`/api/workouts/${day}`, { method: "DELETE", credentials: "include" }).then(r => { if (!r.ok) throw new Error("Error"); }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/workouts"] }),
  });
}
