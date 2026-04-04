import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  memberId: text("member_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  totalSessions: integer("total_sessions").notNull().default(0),
  remainingSessions: integer("remaining_sessions").notNull().default(0),
  active: boolean("active").notNull().default(true),
  membershipType: text("membership_type").notNull().default("sessions"),
  expiresAt: timestamp("expires_at"),
  lastPaymentDate: timestamp("last_payment_date"),
  birthDate: text("birth_date"),
  notes: text("notes"),
  isSpecialUser: boolean("is_special_user").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const checkIns = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  checkInTime: timestamp("check_in_time").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  amount: integer("amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  sessions: integer("sessions"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Exercise = {
  name: string;
  sets: number;
  reps: string;
  duration: string;
  notes: string;
};

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull().unique(),
  title: text("title").notNull(),
  exercises: json("exercises").$type<Exercise[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const membersRelations = relations(members, ({ many }) => ({
  checkIns: many(checkIns),
  payments: many(payments),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  member: one(members, { fields: [checkIns.memberId], references: [members.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  member: one(members, { fields: [payments.memberId], references: [members.id] }),
}));

// Schemas
export const insertMemberSchema = createInsertSchema(members).omit({
  id: true, createdAt: true, totalSessions: true, remainingSessions: true,
}).extend({
  initialSessions: z.number().min(0).optional(),
});

export const kioskCheckInSchema = z.object({
  memberId: z.string().min(1),
});

export const insertPaymentSchema = z.object({
  memberId: z.number().int().positive(),
  amount: z.number().int().positive(),
  paymentMethod: z.enum(["Efectivo", "Transferencia", "Tarjeta", "Terminal"]),
  sessions: z.number().int().positive().optional(),
  note: z.string().optional(),
});

export const upsertWorkoutSchema = z.object({
  title: z.string().min(1),
  exercises: z.array(z.object({
    name: z.string(),
    sets: z.number(),
    reps: z.string(),
    duration: z.string(),
    notes: z.string(),
  })),
});

// Types
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type CheckIn = typeof checkIns.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type CreateMemberRequest = InsertMember;
export type UpdateMemberRequest = Partial<InsertMember>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type UpsertWorkout = z.infer<typeof upsertWorkoutSchema>;
