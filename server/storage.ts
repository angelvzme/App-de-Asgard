import { members, checkIns, payments, workouts, type Member, type CheckIn, type Payment, type Workout, type CreateMemberRequest, type UpdateMemberRequest, type InsertPayment, type UpsertWorkout } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export class DatabaseStorage {
  // Members
  async getMembers(): Promise<Member[]> {
    return db.select().from(members).orderBy(desc(members.createdAt));
  }
  async getMember(id: number): Promise<Member | undefined> {
    const [m] = await db.select().from(members).where(eq(members.id, id));
    return m;
  }
  async getMemberByMemberId(memberId: string): Promise<Member | undefined> {
    const [m] = await db.select().from(members).where(eq(members.memberId, memberId));
    return m;
  }
  async createMember(input: CreateMemberRequest): Promise<Member> {
    const { initialSessions, ...data } = input;
    const sessions = initialSessions ?? 0;
    const [m] = await db.insert(members).values({ ...data, totalSessions: sessions, remainingSessions: sessions }).returning();
    return m;
  }
  async updateMember(id: number, updates: UpdateMemberRequest): Promise<Member> {
    const { initialSessions, ...data } = updates as any;
    const [m] = await db.update(members).set(data).where(eq(members.id, id)).returning();
    return m;
  }
  async addSessions(id: number, sessionsToAdd: number): Promise<Member> {
    const [m] = await db.update(members).set({
      totalSessions: sql`${members.totalSessions} + ${sessionsToAdd}`,
      remainingSessions: sql`${members.remainingSessions} + ${sessionsToAdd}`,
    }).where(eq(members.id, id)).returning();
    return m;
  }
  async deleteMember(id: number): Promise<void> {
    await db.delete(checkIns).where(eq(checkIns.memberId, id));
    await db.delete(payments).where(eq(payments.memberId, id));
    await db.delete(members).where(eq(members.id, id));
  }

  // Check-ins
  async getCheckIns(): Promise<(CheckIn & { member: Member })[]> {
    const rows = await db.select({ checkIn: checkIns, member: members })
      .from(checkIns).innerJoin(members, eq(checkIns.memberId, members.id))
      .orderBy(desc(checkIns.checkInTime)).limit(100);
    return rows.map(r => ({ ...r.checkIn, member: r.member }));
  }
  async getMemberCheckIns(memberDbId: number): Promise<CheckIn[]> {
    return db.select().from(checkIns).where(eq(checkIns.memberId, memberDbId))
      .orderBy(desc(checkIns.checkInTime)).limit(100);
  }
  async createCheckIn(memberId: number, isUnlimited: boolean): Promise<CheckIn> {
    const [checkIn] = await db.insert(checkIns).values({ memberId }).returning();
    if (!isUnlimited) {
      await db.update(members).set({ remainingSessions: sql`${members.remainingSessions} - 1` }).where(eq(members.id, memberId));
    }
    return checkIn;
  }

  // Payments
  async createPayment(input: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(input).returning();
    if (input.sessions) {
      await db.update(members).set({
        totalSessions: sql`${members.totalSessions} + ${input.sessions}`,
        remainingSessions: sql`${members.remainingSessions} + ${input.sessions}`,
        lastPaymentDate: new Date(),
      }).where(eq(members.id, input.memberId));
    } else {
      await db.update(members).set({ lastPaymentDate: new Date() }).where(eq(members.id, input.memberId));
    }
    return payment;
  }
  async getPayments(): Promise<(Payment & { member: Member })[]> {
    const rows = await db.select({ payment: payments, member: members })
      .from(payments).innerJoin(members, eq(payments.memberId, members.id))
      .orderBy(desc(payments.createdAt)).limit(200);
    return rows.map(r => ({ ...r.payment, member: r.member }));
  }
  async getMemberPayments(memberDbId: number): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.memberId, memberDbId))
      .orderBy(desc(payments.createdAt));
  }

  // Workouts
  async getAllWorkouts(): Promise<Workout[]> {
    return db.select().from(workouts).orderBy(workouts.dayOfWeek);
  }
  async getWorkout(dayOfWeek: number): Promise<Workout | undefined> {
    const [w] = await db.select().from(workouts).where(eq(workouts.dayOfWeek, dayOfWeek));
    return w;
  }
  async upsertWorkout(dayOfWeek: number, data: UpsertWorkout): Promise<Workout> {
    const existing = await this.getWorkout(dayOfWeek);
    if (existing) {
      const [w] = await db.update(workouts).set({ ...data, updatedAt: new Date() }).where(eq(workouts.dayOfWeek, dayOfWeek)).returning();
      return w;
    } else {
      const [w] = await db.insert(workouts).values({ dayOfWeek, ...data }).returning();
      return w;
    }
  }
  async deleteWorkout(dayOfWeek: number): Promise<void> {
    await db.delete(workouts).where(eq(workouts.dayOfWeek, dayOfWeek));
  }
}

export const storage = new DatabaseStorage();
