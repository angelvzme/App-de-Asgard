import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: text("member_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  totalSessions: integer("total_sessions").notNull().default(0),
  remainingSessions: integer("remaining_sessions").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const checkIns = sqliteTable("check_ins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull(),
  checkInTime: integer("check_in_time", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// === RELATIONS ===

export const membersRelations = relations(members, ({ many }) => ({
  checkIns: many(checkIns),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  member: one(members, {
    fields: [checkIns.memberId],
    references: [members.id],
  }),
}));

// === SCHEMAS ===

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
  totalSessions: true,
  remainingSessions: true,
}).extend({
  initialSessions: z.number().min(0).optional(),
});

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
  checkInTime: true,
});

export const kioskCheckInSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
});

// === TYPES ===

export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type CheckIn = typeof checkIns.$inferSelect;

export type CreateMemberRequest = InsertMember;
export type UpdateMemberRequest = Partial<InsertMember>;

export type AddSessionsRequest = {
  sessions: number;
};

export type KioskCheckInRequest = z.infer<typeof kioskCheckInSchema>;

export type CheckInResponse = CheckIn & {
  member?: Member;
};
