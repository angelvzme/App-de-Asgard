import { members, checkIns, type Member, type CheckIn, type CreateMemberRequest, type UpdateMemberRequest } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export class DatabaseStorage {
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
    const [m] = await db.insert(members).values({
      ...data,
      totalSessions: sessions,
      remainingSessions: sessions,
    }).returning();
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
    await db.delete(members).where(eq(members.id, id));
  }

  async getCheckIns(): Promise<(CheckIn & { member: Member })[]> {
    const rows = await db
      .select({ checkIn: checkIns, member: members })
      .from(checkIns)
      .innerJoin(members, eq(checkIns.memberId, members.id))
      .orderBy(desc(checkIns.checkInTime))
      .limit(100);
    return rows.map(r => ({ ...r.checkIn, member: r.member }));
  }

  async getMemberCheckIns(memberDbId: number): Promise<CheckIn[]> {
    return db.select().from(checkIns)
      .where(eq(checkIns.memberId, memberDbId))
      .orderBy(desc(checkIns.checkInTime))
      .limit(50);
  }

  async createCheckIn(memberId: number): Promise<CheckIn> {
    const [checkIn] = await db.insert(checkIns).values({ memberId }).returning();
    await db.update(members).set({
      remainingSessions: sql`${members.remainingSessions} - 1`,
    }).where(eq(members.id, memberId));
    return checkIn;
  }
}

export const storage = new DatabaseStorage();
