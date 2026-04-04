import { db } from "./db";
import { sql } from "drizzle-orm";
import { members } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  // Create tables
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
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS workouts (
      id SERIAL PRIMARY KEY, day_of_week INTEGER NOT NULL UNIQUE, title TEXT NOT NULL,
      exercises JSON DEFAULT '[]', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Add missing columns to members if upgrading
  const alterCols = [
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS membership_type TEXT NOT NULL DEFAULT 'sessions'`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS birth_date TEXT`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS notes TEXT`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS is_special_user BOOLEAN NOT NULL DEFAULT false`,
  ];
  for (const alter of alterCols) {
    await db.execute(sql.raw(alter));
  }

  // Seed admin members 1001 and 1002
  for (const admin of [
    { memberId: "1001", firstName: "Admin", lastName: "Asgard" },
    { memberId: "1002", firstName: "Maestro", lastName: "Asgard" },
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
      await db.update(members).set({ membershipType: "unlimited", isSpecialUser: true }).where(eq(members.memberId, admin.memberId));
    }
  }
  console.log("[seed] Database ready.");
}
