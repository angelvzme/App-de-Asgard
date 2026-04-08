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

// ── Exercise Library ───────────────────────────────────────────────────────────
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  notes: text("notes"),
  hasWeight: boolean("has_weight").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Workouts ───────────────────────────────────────────────────────────────────
// weekly (dayOfWeek not null) or personalized (dayOfWeek null, isPersonalized true)
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week"),
  title: text("title").notNull(),
  blocks: json("blocks").$type<any[]>().default([]), // kept for DB compat, not used by app
  isPersonalized: boolean("is_personalized").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workoutBlocks = pgTable("workout_blocks", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  title: text("title").notNull().default(""),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: serial("id").primaryKey(),
  workoutBlockId: integer("workout_block_id").notNull(),
  exerciseId: integer("exercise_id").notNull(),
  sets: integer("sets"),
  reps: text("reps"),
  duration: text("duration"),
  weightLbs: integer("weight_lbs"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const memberWorkouts = pgTable("member_workouts", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  workoutId: integer("workout_id").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// ── Relations ──────────────────────────────────────────────────────────────────
export const membersRelations = relations(members, ({ many }) => ({
  checkIns: many(checkIns),
  payments: many(payments),
  memberWorkouts: many(memberWorkouts),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  member: one(members, { fields: [checkIns.memberId], references: [members.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  member: one(members, { fields: [payments.memberId], references: [members.id] }),
}));

export const exercisesRelations = relations(exercises, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const workoutsRelations = relations(workouts, ({ many }) => ({
  memberWorkouts: many(memberWorkouts),
  workoutBlocks: many(workoutBlocks),
}));

export const workoutBlocksRelations = relations(workoutBlocks, ({ one, many }) => ({
  workout: one(workouts, { fields: [workoutBlocks.workoutId], references: [workouts.id] }),
  exercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one }) => ({
  block: one(workoutBlocks, { fields: [workoutExercises.workoutBlockId], references: [workoutBlocks.id] }),
  exercise: one(exercises, { fields: [workoutExercises.exerciseId], references: [exercises.id] }),
}));

export const memberWorkoutsRelations = relations(memberWorkouts, ({ one }) => ({
  member: one(members, { fields: [memberWorkouts.memberId], references: [members.id] }),
  workout: one(workouts, { fields: [memberWorkouts.workoutId], references: [workouts.id] }),
}));

// ── Zod Schemas ────────────────────────────────────────────────────────────────
export const insertMemberSchema = createInsertSchema(members).omit({
  id: true, createdAt: true, totalSessions: true, remainingSessions: true,
}).extend({
  firstName: z.string().optional().default(""),
  lastName: z.string().optional().default(""),
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

export const insertExerciseSchema = z.object({
  name: z.string().min(1),
  notes: z.string().nullable().optional(),
  hasWeight: z.boolean().optional().default(false),
});

export const upsertBlockExerciseSchema = z.object({
  exerciseId: z.number().int().positive(),
  sets: z.number().int().nullable().optional(),
  reps: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  weightLbs: z.number().int().nullable().optional(),
});

export const upsertBlockSchema = z.object({
  title: z.string(),
  exercises: z.array(upsertBlockExerciseSchema),
});

export const upsertWorkoutSchema = z.object({
  title: z.string().min(1),
  blocks: z.array(upsertBlockSchema),
});

export const assignWorkoutSchema = upsertWorkoutSchema;

// ── DB Row Types ───────────────────────────────────────────────────────────────
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type CheckIn = typeof checkIns.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type WorkoutBlock = typeof workoutBlocks.$inferSelect;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type MemberWorkout = typeof memberWorkouts.$inferSelect;
export type LibraryExercise = typeof exercises.$inferSelect;
export type LibraryExerciseWithUsage = LibraryExercise & { usageCount: number };

export type CreateMemberRequest = InsertMember;
export type UpdateMemberRequest = Partial<InsertMember>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type UpsertBlockExercise = z.infer<typeof upsertBlockExerciseSchema>;
export type UpsertBlock = z.infer<typeof upsertBlockSchema>;
export type UpsertWorkout = z.infer<typeof upsertWorkoutSchema>;
export type AssignWorkout = z.infer<typeof assignWorkoutSchema>;

// ── Composed API Response Types ────────────────────────────────────────────────
export type WorkoutExerciseItem = {
  id: number;
  exerciseId: number;
  name: string;
  notes: string | null;
  hasWeight: boolean;
  sets: number | null;
  reps: string | null;
  duration: string | null;
  weightLbs: number | null;
  order: number;
};

export type WorkoutBlockItem = {
  id: number;
  title: string;
  order: number;
  exercises: WorkoutExerciseItem[];
};

export type WorkoutFull = {
  id: number;
  dayOfWeek: number | null;
  title: string;
  isPersonalized: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  blocks: WorkoutBlockItem[];
};
