import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

const ADMIN_IDS = ["1001", "1002"];
const ADMIN_PASSWORD = "asgard2026";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      memberId: string;
      firstName: string;
      lastName: string;
      role: "admin" | "member";
    };
  }
}

// Step 1: Check if a member ID exists and if it needs a password
export async function checkMemberHandler(req: Request, res: Response) {
  const { memberId } = req.body;

  if (!memberId || typeof memberId !== "string") {
    return res.status(400).json({ message: "ID de miembro requerido" });
  }

  const member = await storage.getMemberByMemberId(memberId.trim());

  if (!member) {
    return res.status(404).json({ message: "ID de miembro no encontrado" });
  }

  if (!member.active) {
    return res.status(400).json({ message: "Esta membresía está inactiva" });
  }

  res.json({
    requiresPassword: ADMIN_IDS.includes(memberId.trim()),
    firstName: member.firstName,
  });
}

// Step 2: Full login
export async function loginHandler(req: Request, res: Response) {
  const { memberId, password } = req.body;

  if (!memberId || typeof memberId !== "string") {
    return res.status(400).json({ message: "ID de miembro requerido" });
  }

  const member = await storage.getMemberByMemberId(memberId.trim());

  if (!member) {
    return res.status(404).json({ message: "ID de miembro no encontrado" });
  }

  if (!member.active) {
    return res.status(400).json({ message: "Esta membresía está inactiva" });
  }

  const isAdmin = ADMIN_IDS.includes(memberId.trim());

  if (isAdmin) {
    if (!password || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        message: "Contraseña incorrecta",
        requiresPassword: true,
      });
    }
  }

  req.session.user = {
    id: member.id,
    memberId: member.memberId,
    firstName: member.firstName,
    lastName: member.lastName,
    role: isAdmin ? "admin" : "member",
  };

  res.json(req.session.user);
}

export function logoutHandler(req: Request, res: Response) {
  req.session.destroy(() => {
    res.json({ success: true });
  });
}

export function meHandler(req: Request, res: Response) {
  if (!req.session.user) {
    return res.status(401).json({ message: "No autenticado" });
  }
  res.json(req.session.user);
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: "No autenticado" });
  }
  next();
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Acceso denegado" });
  }
  next();
}
