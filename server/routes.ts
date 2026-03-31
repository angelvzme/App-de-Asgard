import type { Express, Request } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import {
  checkMemberHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  isAuthenticated,
  isAdmin,
} from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === Auth Routes ===
  app.post(api.auth.check.path, checkMemberHandler);
  app.post(api.auth.login.path, loginHandler);
  app.post(api.auth.logout.path, logoutHandler);
  app.get(api.auth.me.path, meHandler);

  // === Member Self Routes (any logged-in member) ===

  // Get own check-in history
  app.get(api.checkIns.myCheckIns.path, isAuthenticated, async (req, res) => {
    const user = req.session.user!;
    const myCheckIns = await storage.getMemberCheckIns(user.id);
    res.json(myCheckIns);
  });

  // Get own full profile (sessions info)
  app.get("/api/me/full", isAuthenticated, async (req, res) => {
    const user = req.session.user!;
    const member = await storage.getMember(user.id);
    if (!member) return res.status(404).json({ message: "Miembro no encontrado" });
    res.json(member);
  });

  // === Protected Admin Routes ===

  app.get(api.members.list.path, isAuthenticated, isAdmin, async (req, res) => {
    const allMembers = await storage.getMembers();
    res.json(allMembers);
  });

  app.get(api.members.get.path, isAuthenticated, isAdmin, async (req, res) => {
    const member = await storage.getMember(Number(req.params.id));
    if (!member) return res.status(404).json({ message: "Miembro no encontrado" });
    res.json(member);
  });

  app.post(api.members.create.path, isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = api.members.create.input.parse(req.body);
      const existing = await storage.getMemberByMemberId(input.memberId);
      if (existing) return res.status(400).json({ message: "El ID de miembro ya existe" });

      const member = await storage.createMember(input);
      res.status(201).json(member);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      res.status(500).json({ message: "Error interno" });
    }
  });

  app.put(api.members.update.path, isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.members.update.input.parse(req.body);

      const member = await storage.getMember(id);
      if (!member) return res.status(404).json({ message: "Miembro no encontrado" });

      if (input.memberId && input.memberId !== member.memberId) {
        const existing = await storage.getMemberByMemberId(input.memberId);
        if (existing) return res.status(400).json({ message: "El ID de miembro ya está en uso" });
      }

      const updated = await storage.updateMember(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error interno" });
    }
  });

  app.post(api.members.addSessions.path, isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { sessions } = z.object({ sessions: z.number().int().positive() }).parse(req.body);
      const member = await storage.getMember(id);
      if (!member) return res.status(404).json({ message: "Miembro no encontrado" });
      const updated = await storage.addSessions(id, sessions);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error interno" });
    }
  });

  app.delete(api.members.delete.path, isAuthenticated, isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const member = await storage.getMember(id);
    if (!member) return res.status(404).json({ message: "Miembro no encontrado" });
    await storage.deleteMember(id);
    res.status(204).send();
  });

  app.get(api.checkIns.list.path, isAuthenticated, isAdmin, async (req, res) => {
    const allCheckIns = await storage.getCheckIns();
    res.json(allCheckIns);
  });

  return httpServer;
}
