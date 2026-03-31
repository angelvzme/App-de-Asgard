import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { CreateMemberRequest, UpdateMemberRequest, CheckInResponse } from "@shared/schema";

// === Members Hooks ===

export function useMembers() {
  return useQuery({
    queryKey: [api.members.list.path],
    queryFn: async () => {
      const res = await fetch(api.members.list.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch members");
      return api.members.list.responses[200].parse(await res.json());
    },
  });
}

export function useMember(id: number) {
  return useQuery({
    queryKey: [api.members.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.members.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch member");
      return api.members.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateMemberRequest) => {
      const res = await fetch(api.members.create.path, {
        method: api.members.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create member");
      }
      return api.members.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.members.list.path] });
      toast({ title: "Éxito", description: "Miembro creado correctamente" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateMemberRequest) => {
      const url = buildUrl(api.members.update.path, { id });
      const res = await fetch(url, {
        method: api.members.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al actualizar miembro");
      return api.members.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.members.list.path] });
      toast({ title: "Éxito", description: "Miembro actualizado" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddSessions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, sessions }: { id: number; sessions: number }) => {
      const url = buildUrl(api.members.addSessions.path, { id });
      const res = await fetch(url, {
        method: api.members.addSessions.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al agregar sesiones");
      return api.members.addSessions.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.members.list.path] });
      toast({ title: "Éxito", description: "Sesiones agregadas correctamente" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.members.delete.path, { id });
      const res = await fetch(url, { 
        method: api.members.delete.method,
        credentials: "include" 
      });

      if (!res.ok) throw new Error("Error al eliminar miembro");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.members.list.path] });
      toast({ title: "Éxito", description: "Miembro eliminado" });
    },
  });
}


// === Check-In Hooks ===

export function useCheckIns() {
  return useQuery({
    queryKey: [api.checkIns.list.path],
    queryFn: async () => {
      const res = await fetch(api.checkIns.list.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch check-ins");
      return api.checkIns.list.responses[200].parse(await res.json());
    },
  });
}

export function useKioskCheckIn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(api.checkIns.create.path, {
        method: api.checkIns.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 || res.status === 404) {
          throw new Error(data.message || "Check-in failed");
        }
        throw new Error("System error");
      }
      
      return api.checkIns.create.responses[200].parse(data);
    },
    onSuccess: () => {
      // Invalidate both lists so admin dashboard updates in real-time if open
      queryClient.invalidateQueries({ queryKey: [api.checkIns.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.members.list.path] });
    },
  });
}
