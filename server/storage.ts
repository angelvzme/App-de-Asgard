import {
  members, checkIns,
  type Member, type InsertMember,
  type CheckIn, type CreateMemberRequest, type UpdateMemberRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getMembers(): Promise<Member[]>;
  getMember(id: number): Promise<Member | undefined>;
  getMemberByMemberId(memberId: string): Promise<Member | undefined>;
  createMember(member: CreateMemberRequest): Promise<Member>;
  updateMember(id: number, updates: UpdateMemberRequest): Promise<Member>;
  addSessions(id: number, sessions: number): Promise<Member>;
  deleteMember(id: number): Promise<void>;

  getCheckIns(): Promise<(CheckIn & { member: Member })[]>;
  getMemberCheckIns(memberDbId: number): Promise<CheckIn[]>;
  createCheckIn(memberId: number): Promise<CheckIn>;
}

export class DatabaseStorage implements IStorage {
  async getMembers(): Promise<Member[]> {
    return await db.select().from(members).orderBy(desc(members.createdAt));
  }

  async getMember(id: number): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  }

  async getMemberByMemberId(memberId: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.memberId, memberId));
    return member;
  }

  async createMember(insertMember: CreateMemberRequest): Promise<Member> {
    const { initialSessions, ...data } = insertMember;
    const sessions = initialSessions || 0;

    const [member] = await db
      .insert(members)
      .values({ ...data, totalSessions: sessions, remainingSessions: sessions })
      .returning();
    return member;
  }

  async updateMember(id: number, updates: UpdateMemberRequest): Promise<Member> {
    const { initialSessions, ...data } = updates as any;
    const [updated] = await db.update(members).set(data).where(eq(members.id, id)).returning();
    return updated;
  }

  async addSessions(id: number, sessionsToAdd: number): Promise<Member> {
    const [updated] = await db
      .update(members)
      .set({
        totalSessions: sql`${members.totalSessions} + ${sessionsToAdd}`,
        remainingSessions: sql`${members.remainingSessions} + ${sessionsToAdd}`,
      })
      .where(eq(members.id, id))
      .returning();
    return updated;
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

    return rows.map((row) => ({ ...row.checkIn, member: row.member }));
  }

  async getMemberCheckIns(memberDbId: number): Promise<CheckIn[]> {
    return await db
      .select()
      .from(checkIns)
      .where(eq(checkIns.memberId, memberDbId))
      .orderBy(desc(checkIns.checkInTime))
      .limit(50);
  }

  async createCheckIn(memberId: number): Promise<CheckIn> {
    const [checkIn] = await db.insert(checkIns).values({ memberId }).returning();

    await db
      .update(members)
      .set({ remainingSessions: sql`${members.remainingSessions} - 1` })
      .where(eq(members.id, memberId));

    return checkIn;
  }
}

export const storage = new DatabaseStorage();
