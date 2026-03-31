import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const checkIns = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  checkInTime: timestamp("check_in_time").defaultNow().notNull(),
});

export const membersRelations = relations(members, ({ many }) => ({
  checkIns: many(checkIns),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  member: one(members, {
    fields: [checkIns.memberId],
    references: [members.id],
  }),
}));

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
  totalSessions: true,
  remainingSessions: true,
}).extend({
  initialSessions: z.number().min(0).optional(),
});

export const kioskCheckInSchema = z.object({
  memberId: z.string().min(1),
});

export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type CheckIn = typeof checkIns.$inferSelect;
export type CreateMemberRequest = InsertMember;
export type UpdateMemberRequest = Partial<InsertMember>;
