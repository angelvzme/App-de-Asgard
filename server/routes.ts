import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertMemberSchema, kioskCheckInSchema, insertPaymentSchema,
  upsertWorkoutSchema, assignWorkoutSchema,
} from "@shared/schema";
import { checkMemberHandler, loginHandler, logoutHandler, meHandler, isAuthenticated, isAdmin } from "./auth";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ── Auth ──────────────────────────────────────────────────────────────────
  app.post("/api/auth/check", checkMemberHandler);
  app.post("/api/auth/login", loginHandler);
  app.post("/api/auth/logout", logoutHandler);
  app.get("/api/auth/me", meHandler);

  // ── Member self routes ────────────────────────────────────────────────────
  app.get("/api/me/full", isAuthenticated, async (req, res) => {
    const member = await storage.getMember(req.session.user!.id);
    if (!member) return res.status(404).json({ message: "No encontrado" });
    res.json(member);
  });
  app.get("/api/me/check-ins", isAuthenticated, async (req, res) => {
    res.json(await storage.getMemberCheckIns(req.session.user!.id));
  });
  app.get("/api/me/workout-today", isAuthenticated, async (req, res) => {
    const day = new Date().getDay();
    const workout = await storage.getWorkout(day);
    res.json(workout || null);
  });
  app.get("/api/me/workouts", isAuthenticated, async (req, res) => {
    const active = await storage.getMemberActiveWorkouts(req.session.user!.id);
    res.json(active.map(r => r.workout));
  });

  // Member self check-in (from dashboard)
  app.post("/api/me/check-in", isAuthenticated, async (req, res) => {
    try {
      const member = await storage.getMember(req.session.user!.id);
      if (!member) return res.status(404).json({ message: "Miembro no encontrado" });
      if (!member.active) return res.status(400).json({ message: "Membresía inactiva" });

      const isUnlimited = member.membershipType === "unlimited" || member.isSpecialUser;
      if (!isUnlimited && member.remainingSessions <= 0)
        return res.status(400).json({ message: "Sin sesiones disponibles. Renueva tu membresía." });

      // Enforce 6-hour cooldown
      const checkIns = await storage.getMemberCheckIns(member.id);
      if (checkIns.length > 0) {
        const last = new Date(checkIns[0].checkInTime).getTime();
        const elapsed = Date.now() - last;
        if (elapsed < 6 * 60 * 60 * 1000) {
          const remaining = Math.ceil((6 * 60 * 60 * 1000 - elapsed) / 60000);
          return res.status(429).json({ message: `Ya hiciste check-in. Puedes volver a hacerlo en ${remaining} min.` });
        }
      }

      await storage.createCheckIn(member.id, isUnlimited);
      const updated = await storage.getMember(member.id);
      res.json({ success: true, remainingSessions: updated!.remainingSessions, isUnlimited });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error interno" });
    }
  });

  // ── Kiosk check-in (public) ───────────────────────────────────────────────
  app.post("/api/check-ins", async (req, res) => {
    try {
      const { memberId } = kioskCheckInSchema.parse(req.body);
      const member = await storage.getMemberByMemberId(memberId);
      if (!member) return res.status(404).json({ message: "ID de Miembro no encontrado" });
      if (!member.active) return res.status(400).json({ message: "La membresía está inactiva" });

      const isUnlimited = member.membershipType === "unlimited" || member.isSpecialUser;
      if (!isUnlimited && member.remainingSessions <= 0)
        return res.status(400).json({ message: "Sin sesiones disponibles. Por favor renueva tu membresía." });

      const lastSessionWarning = !isUnlimited && member.remainingSessions === 1;
      await storage.createCheckIn(member.id, isUnlimited);
      const updated = await storage.getMember(member.id);

      res.json({
        success: true, message: "¡Registro de entrada exitoso!",
        isUnlimited, lastSessionWarning,
        remainingSessions: updated!.remainingSessions,
        member: updated!,
      });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error(err);
      res.status(500).json({ message: "Error interno" });
    }
  });

  // ── Admin — Members ───────────────────────────────────────────────────────
  app.get("/api/members", isAuthenticated, isAdmin, async (_req, res) => res.json(await storage.getMembers()));
  app.get("/api/members/:id", isAuthenticated, isAdmin, async (req, res) => {
    const m = await storage.getMember(Number(req.params.id));
    if (!m) return res.status(404).json({ message: "No encontrado" });
    res.json(m);
  });
  app.post("/api/members", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = insertMemberSchema.parse(req.body);
      if (await storage.getMemberByMemberId(input.memberId))
        return res.status(400).json({ message: "El ID de miembro ya existe" });
      res.status(201).json(await storage.createMember(input));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error interno" });
    }
  });
  app.put("/api/members/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = insertMemberSchema.partial()
        .extend({ remainingSessions: z.number().int().min(0).optional() })
        .parse(req.body);
      const member = await storage.getMember(id);
      if (!member) return res.status(404).json({ message: "No encontrado" });
      if (input.memberId && input.memberId !== member.memberId) {
        if (await storage.getMemberByMemberId(input.memberId))
          return res.status(400).json({ message: "ID ya en uso" });
      }
      res.json(await storage.updateMember(id, input));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error interno" });
    }
  });
  app.post("/api/members/:id/sessions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { sessions } = z.object({ sessions: z.number().int().positive() }).parse(req.body);
      const m = await storage.getMember(Number(req.params.id));
      if (!m) return res.status(404).json({ message: "No encontrado" });
      res.json(await storage.addSessions(m.id, sessions));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error interno" });
    }
  });
  app.delete("/api/members/:id", isAuthenticated, isAdmin, async (req, res) => {
    const m = await storage.getMember(Number(req.params.id));
    if (!m) return res.status(404).json({ message: "No encontrado" });
    await storage.deleteMember(m.id);
    res.status(204).send();
  });

  // Admin — assign personalized workout to a member
  app.post("/api/members/:id/workouts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const memberId = Number(req.params.id);
      const m = await storage.getMember(memberId);
      if (!m) return res.status(404).json({ message: "Miembro no encontrado" });
      const input = assignWorkoutSchema.parse(req.body);
      const mw = await storage.createPersonalizedWorkout(memberId, input);
      res.status(201).json(mw);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error interno" });
    }
  });
  app.get("/api/members/:id/workouts", isAuthenticated, isAdmin, async (req, res) => {
    const active = await storage.getMemberActiveWorkouts(Number(req.params.id));
    res.json(active.map(r => r.workout));
  });

  // ── Admin — Check-ins ─────────────────────────────────────────────────────
  app.get("/api/check-ins", isAuthenticated, isAdmin, async (_req, res) => res.json(await storage.getCheckIns()));

  // ── Admin — Payments ──────────────────────────────────────────────────────
  app.post("/api/payments", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = insertPaymentSchema.parse(req.body);
      res.status(201).json(await storage.createPayment(input));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error interno" });
    }
  });
  app.get("/api/payments", isAuthenticated, isAdmin, async (_req, res) => res.json(await storage.getPayments()));
  app.get("/api/members/:id/payments", isAuthenticated, isAdmin, async (req, res) => {
    res.json(await storage.getMemberPayments(Number(req.params.id)));
  });

  // ── Workouts (weekly, readable by authenticated, writable by admin) ────────
  app.get("/api/workouts", isAuthenticated, async (_req, res) => res.json(await storage.getAllWorkouts()));
  app.get("/api/workouts/day/:day", isAuthenticated, async (req, res) => {
    const w = await storage.getWorkout(Number(req.params.day));
    res.json(w || null);
  });
  app.put("/api/workouts/day/:day", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const day = Number(req.params.day);
      const input = upsertWorkoutSchema.parse(req.body);
      res.json(await storage.upsertWorkout(day, input));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error interno" });
    }
  });
  app.delete("/api/workouts/day/:day", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteWorkout(Number(req.params.day));
    res.status(204).send();
  });

  return httpServer;
}
