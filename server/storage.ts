import {
  members, checkIns, payments, workouts, workoutBlocks, workoutExercises, exercises, memberWorkouts,
  type Member, type CheckIn, type Payment, type Workout, type MemberWorkout,
  type LibraryExercise, type LibraryExerciseWithUsage,
  type WorkoutFull, type WorkoutBlockItem, type WorkoutExerciseItem,
  type CreateMemberRequest, type UpdateMemberRequest, type InsertPayment,
  type UpsertWorkout, type AssignWorkout, type InsertExercise,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, gt, and, isNotNull, inArray, asc } from "drizzle-orm";

export class DatabaseStorage {
  // ── Members ──────────────────────────────────────────────────────────────
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
    // collect personalized workout IDs before deleting memberWorkouts
    const mws = await db.select().from(memberWorkouts).where(eq(memberWorkouts.memberId, id));
    await db.delete(memberWorkouts).where(eq(memberWorkouts.memberId, id));
    // delete personalized workouts (cascade handles blocks+exercises)
    for (const mw of mws) {
      await db.delete(workouts).where(eq(workouts.id, mw.workoutId));
    }
    await db.delete(members).where(eq(members.id, id));
  }
  async getNextMemberId(): Promise<string> {
    const all = await db.select({ memberId: members.memberId }).from(members);
    const numericIds = all.map(m => parseInt(m.memberId, 10)).filter(n => !isNaN(n));
    if (numericIds.length === 0) return "1001";
    return String(Math.max(...numericIds) + 1);
  }

  // ── Check-ins ─────────────────────────────────────────────────────────────
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
      await db.update(members)
        .set({ remainingSessions: sql`${members.remainingSessions} - 1` })
        .where(eq(members.id, memberId));
    }
    return checkIn;
  }

  // ── Payments ──────────────────────────────────────────────────────────────
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

  // ── Exercise Library ───────────────────────────────────────────────────────
  async getExercises(): Promise<LibraryExerciseWithUsage[]> {
    const exList = await db.select().from(exercises).orderBy(asc(exercises.name));
    if (exList.length === 0) return [];
    // get usage counts
    const counts = await db.execute(sql`
      SELECT exercise_id, COUNT(*)::int AS cnt FROM workout_exercises GROUP BY exercise_id
    `);
    const countMap = new Map<number, number>(
      (counts as any[]).map((r: any) => [Number(r.exercise_id), Number(r.cnt)])
    );
    return exList.map(e => ({ ...e, usageCount: countMap.get(e.id) ?? 0 }));
  }

  async getRecentExercises(): Promise<LibraryExercise[]> {
    const rows = await db.execute(sql`
      SELECT DISTINCT ON (exercise_id) exercise_id, created_at
      FROM workout_exercises
      ORDER BY exercise_id, created_at DESC
    `);
    const withDates = (rows as any[]).map((r: any) => ({
      id: Number(r.exercise_id),
      createdAt: new Date(r.created_at),
    }));
    const sorted = withDates
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map(r => r.id);
    if (sorted.length === 0) return [];
    const exList = await db.select().from(exercises).where(inArray(exercises.id, sorted));
    return sorted.map(id => exList.find(e => e.id === id)!).filter(Boolean);
  }

  async getTodayCheckIns(): Promise<(CheckIn & { member: Member })[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const rows = await db.select({ checkIn: checkIns, member: members })
      .from(checkIns).innerJoin(members, eq(checkIns.memberId, members.id))
      .where(and(
        sql`${checkIns.checkInTime} >= ${start}`,
        sql`${checkIns.checkInTime} <= ${end}`,
      ))
      .orderBy(desc(checkIns.checkInTime));
    return rows.map(r => ({ ...r.checkIn, member: r.member }));
  }

  async createExercise(data: InsertExercise): Promise<LibraryExercise> {
    const now = new Date();
    const [ex] = await db.insert(exercises).values({
      name: data.name,
      notes: data.notes ?? null,
      hasWeight: data.hasWeight ?? false,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return ex;
  }

  async updateExercise(id: number, data: Partial<InsertExercise>): Promise<LibraryExercise> {
    const [ex] = await db.update(exercises)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(exercises.id, id))
      .returning();
    return ex;
  }

  async deleteExercise(id: number): Promise<void> {
    // workout_exercises cascade from exercises FK
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  // ── Workout Hydration ──────────────────────────────────────────────────────
  async hydrateWorkout(w: Workout): Promise<WorkoutFull> {
    // Single JOIN query: blocks + exercises + exercise library data
    const rows = await db.execute(sql`
      SELECT
        wb.id AS block_id, wb.title AS block_title, wb."order" AS block_order,
        we.id AS we_id, we.exercise_id, we.sets, we.reps, we.duration, we.weight_lbs, we."order" AS we_order,
        e.name AS ex_name, e.notes AS ex_notes, e.has_weight AS ex_has_weight
      FROM workout_blocks wb
      LEFT JOIN workout_exercises we ON we.workout_block_id = wb.id
      LEFT JOIN exercises e ON e.id = we.exercise_id
      WHERE wb.workout_id = ${w.id}
      ORDER BY wb."order" ASC, we."order" ASC
    `);

    const blockMap = new Map<number, WorkoutBlockItem>();
    for (const row of rows as any[]) {
      const blockId = Number(row.block_id);
      if (!blockMap.has(blockId)) {
        blockMap.set(blockId, {
          id: blockId,
          title: row.block_title ?? "",
          order: Number(row.block_order ?? 0),
          exercises: [],
        });
      }
      if (row.we_id != null && row.exercise_id != null) {
        blockMap.get(blockId)!.exercises.push({
          id: Number(row.we_id),
          exerciseId: Number(row.exercise_id),
          name: row.ex_name ?? "",
          notes: row.ex_notes ?? null,
          hasWeight: row.ex_has_weight === true || row.ex_has_weight === 't',
          sets: row.sets != null ? Number(row.sets) : null,
          reps: row.reps ?? null,
          duration: row.duration ?? null,
          weightLbs: row.weight_lbs != null ? Number(row.weight_lbs) : null,
          order: Number(row.we_order ?? 0),
        });
      }
    }

    return {
      id: w.id,
      dayOfWeek: w.dayOfWeek,
      title: w.title,
      isPersonalized: w.isPersonalized,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      blocks: Array.from(blockMap.values()).sort((a, b) => a.order - b.order),
    };
  }

  async saveBlocksForWorkout(workoutId: number, blocks: UpsertWorkout["blocks"]): Promise<void> {
    // Delete existing blocks (cascade deletes workout_exercises)
    await db.delete(workoutBlocks).where(eq(workoutBlocks.workoutId, workoutId));
    // Insert new blocks + exercises
    for (let bi = 0; bi < blocks.length; bi++) {
      const block = blocks[bi];
      const [b] = await db.insert(workoutBlocks)
        .values({ workoutId, title: block.title, order: bi })
        .returning();
      for (let ei = 0; ei < block.exercises.length; ei++) {
        const ex = block.exercises[ei];
        await db.insert(workoutExercises).values({
          workoutBlockId: b.id,
          exerciseId: ex.exerciseId,
          sets: ex.sets ?? null,
          reps: ex.reps ?? null,
          duration: ex.duration ?? null,
          weightLbs: (ex as any).weightLbs ?? null,
          order: ei,
        });
      }
    }
  }

  // ── Weekly Workouts ───────────────────────────────────────────────────────
  async getAllWorkouts(): Promise<WorkoutFull[]> {
    const ws = await db.select().from(workouts)
      .where(and(eq(workouts.isPersonalized, false), isNotNull(workouts.dayOfWeek)))
      .orderBy(workouts.dayOfWeek);
    return Promise.all(ws.map(w => this.hydrateWorkout(w)));
  }

  async getWorkout(dayOfWeek: number): Promise<WorkoutFull | undefined> {
    const [w] = await db.select().from(workouts).where(
      and(eq(workouts.dayOfWeek, dayOfWeek), eq(workouts.isPersonalized, false))
    );
    if (!w) return undefined;
    return this.hydrateWorkout(w);
  }

  async upsertWorkout(dayOfWeek: number, data: UpsertWorkout): Promise<WorkoutFull> {
    const existing = await db.select().from(workouts).where(
      and(eq(workouts.dayOfWeek, dayOfWeek), eq(workouts.isPersonalized, false))
    );
    let workoutId: number;
    if (existing.length > 0) {
      await db.update(workouts)
        .set({ title: data.title, updatedAt: new Date() })
        .where(eq(workouts.id, existing[0].id));
      workoutId = existing[0].id;
    } else {
      const [w] = await db.insert(workouts)
        .values({ dayOfWeek, title: data.title, isPersonalized: false })
        .returning();
      workoutId = w.id;
    }
    await this.saveBlocksForWorkout(workoutId, data.blocks);
    const [w] = await db.select().from(workouts).where(eq(workouts.id, workoutId));
    return this.hydrateWorkout(w);
  }

  async deleteWorkout(dayOfWeek: number): Promise<void> {
    // workout_blocks cascade from workouts FK
    await db.delete(workouts).where(
      and(eq(workouts.dayOfWeek, dayOfWeek), eq(workouts.isPersonalized, false))
    );
  }

  // ── Personalized Workouts ─────────────────────────────────────────────────
  async createPersonalizedWorkout(memberId: number, data: AssignWorkout): Promise<MemberWorkout> {
    const [workout] = await db.insert(workouts).values({
      title: data.title,
      isPersonalized: true,
      dayOfWeek: null,
    }).returning();

    await this.saveBlocksForWorkout(workout.id, data.blocks);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const [mw] = await db.insert(memberWorkouts).values({
      memberId,
      workoutId: workout.id,
      assignedAt: now,
      expiresAt,
    }).returning();
    return mw;
  }

  async getMemberActiveWorkouts(memberId: number): Promise<(MemberWorkout & { workout: WorkoutFull })[]> {
    const now = new Date();
    const rows = await db.select({ mw: memberWorkouts, workout: workouts })
      .from(memberWorkouts)
      .innerJoin(workouts, eq(memberWorkouts.workoutId, workouts.id))
      .where(and(
        eq(memberWorkouts.memberId, memberId),
        gt(memberWorkouts.expiresAt, now),
      ))
      .orderBy(desc(memberWorkouts.assignedAt));
    return Promise.all(rows.map(async r => ({
      ...r.mw,
      workout: await this.hydrateWorkout(r.workout),
    })));
  }

  async updatePersonalizedWorkout(memberWorkoutId: number, data: AssignWorkout): Promise<WorkoutFull> {
    const [mw] = await db.select().from(memberWorkouts).where(eq(memberWorkouts.id, memberWorkoutId));
    if (!mw) throw new Error("Asignación no encontrada");
    await db.update(workouts)
      .set({ title: data.title, updatedAt: new Date() })
      .where(and(eq(workouts.id, mw.workoutId), eq(workouts.isPersonalized, true)));
    await this.saveBlocksForWorkout(mw.workoutId, data.blocks);
    const [w] = await db.select().from(workouts).where(eq(workouts.id, mw.workoutId));
    return this.hydrateWorkout(w);
  }

  async deletePersonalizedWorkout(memberWorkoutId: number): Promise<void> {
    const [mw] = await db.select().from(memberWorkouts).where(eq(memberWorkouts.id, memberWorkoutId));
    if (!mw) return;
    await db.delete(memberWorkouts).where(eq(memberWorkouts.id, memberWorkoutId));
    await db.delete(workouts).where(and(eq(workouts.id, mw.workoutId), eq(workouts.isPersonalized, true)));
  }
}

export const storage = new DatabaseStorage();
