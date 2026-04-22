import { db } from "./db";
import { sql } from "drizzle-orm";
import { members } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  // ── Core tables ──────────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY, member_id TEXT NOT NULL UNIQUE, first_name TEXT NOT NULL,
      last_name TEXT NOT NULL, email TEXT, phone TEXT,
      total_sessions INTEGER NOT NULL DEFAULT 0, remaining_sessions INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true, membership_type TEXT NOT NULL DEFAULT 'sessions',
      expires_at TIMESTAMP, last_payment_date TIMESTAMP, birth_date TEXT, notes TEXT,
      is_special_user BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS check_ins (
      id SERIAL PRIMARY KEY, member_id INTEGER NOT NULL, check_in_time TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY, member_id INTEGER NOT NULL, amount INTEGER NOT NULL,
      payment_method TEXT NOT NULL, sessions INTEGER, note TEXT, created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Exercise library
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS exercises (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      notes TEXT,
      has_weight BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // workouts: dayOfWeek nullable (personalized workouts have null), no UNIQUE constraint
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS workouts (
      id SERIAL PRIMARY KEY,
      day_of_week INTEGER,
      title TEXT NOT NULL,
      blocks JSON DEFAULT '[]',
      is_personalized BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Relational blocks table (replaces embedded JSON exercises)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS workout_blocks (
      id SERIAL PRIMARY KEY,
      workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '',
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Relational exercises-per-block table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS workout_exercises (
      id SERIAL PRIMARY KEY,
      workout_block_id INTEGER NOT NULL REFERENCES workout_blocks(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      sets INTEGER,
      reps TEXT,
      duration TEXT,
      weight_lbs INTEGER,
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS member_workouts (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL,
      workout_id INTEGER NOT NULL,
      assigned_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    )
  `);

  // Session store (connect-pg-simple) — must exist before first login
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS session (
      sid VARCHAR NOT NULL,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL,
      CONSTRAINT session_pkey PRIMARY KEY (sid)
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON session (expire)
  `);

  // ── Migrations for existing databases ─────────────────────────────────────
  const memberAlters = [
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS membership_type TEXT NOT NULL DEFAULT 'sessions'`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS birth_date TEXT`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS notes TEXT`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS is_special_user BOOLEAN NOT NULL DEFAULT false`,
  ];
  for (const alter of memberAlters) {
    await db.execute(sql.raw(alter));
  }

  const workoutAlters = [
    `ALTER TABLE workouts ADD COLUMN IF NOT EXISTS blocks JSON DEFAULT '[]'`,
    `ALTER TABLE workouts ADD COLUMN IF NOT EXISTS is_personalized BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE workouts ALTER COLUMN day_of_week DROP NOT NULL`,
    `ALTER TABLE workouts DROP CONSTRAINT IF EXISTS workouts_day_of_week_key`,
  ];
  for (const alter of workoutAlters) {
    try { await db.execute(sql.raw(alter)); } catch { /* ignore if already done */ }
  }

  const exerciseAlters = [
    `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS has_weight BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`,
    `UPDATE exercises SET updated_at = NOW() WHERE updated_at IS NULL`,
    `UPDATE exercises SET created_at = NOW() WHERE created_at IS NULL`,
    `ALTER TABLE exercises ALTER COLUMN updated_at SET DEFAULT NOW()`,
    `ALTER TABLE exercises ALTER COLUMN updated_at SET NOT NULL`,
    `ALTER TABLE exercises ALTER COLUMN created_at SET DEFAULT NOW()`,
    `ALTER TABLE exercises ALTER COLUMN created_at SET NOT NULL`,
  ];
  for (const alter of exerciseAlters) {
    try { await db.execute(sql.raw(alter)); } catch { /* ignore if already done */ }
  }

  const workoutAlters2 = [
    `ALTER TABLE workouts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
  ];
  for (const alter of workoutAlters2) {
    try { await db.execute(sql.raw(alter)); } catch { /* ignore if already done */ }
  }

  const workoutExercisesAlters = [
    `ALTER TABLE workout_exercises ADD COLUMN IF NOT EXISTS weight_lbs INTEGER`,
    `ALTER TABLE workout_exercises ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0`,
  ];
  for (const alter of workoutExercisesAlters) {
    try { await db.execute(sql.raw(alter)); } catch { /* ignore if already done */ }
  }

  const workoutBlocksAlters = [
    `ALTER TABLE workout_blocks ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0`,
  ];
  for (const alter of workoutBlocksAlters) {
    try { await db.execute(sql.raw(alter)); } catch { /* ignore if already done */ }
  }

  // ── Seed admin members ────────────────────────────────────────────────────
  for (const admin of [
    { memberId: "1001", firstName: "Admin", lastName: "Asgard" },
    { memberId: "1002", firstName: "Maestro", lastName: "Asgard" },
    { memberId: "1003", firstName: "Admin", lastName: "3" },
    { memberId: "1004", firstName: "Admin", lastName: "4" },
  ]) {
    const [existing] = await db.select().from(members).where(eq(members.memberId, admin.memberId));
    if (!existing) {
      await db.insert(members).values({
        memberId: admin.memberId, firstName: admin.firstName, lastName: admin.lastName,
        active: true, membershipType: "unlimited", isSpecialUser: true,
        totalSessions: 0, remainingSessions: 0,
      });
      console.log(`[seed] Created master member ${admin.memberId}`);
    } else {
      await db.update(members).set({ membershipType: "unlimited", isSpecialUser: true })
        .where(eq(members.memberId, admin.memberId));
    }
  }
  console.log("[seed] Database ready.");
}
