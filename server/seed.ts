import { db } from "./db";
import { sql } from "drizzle-orm";
import { members } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  // Create tables if they don't exist
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      member_id TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      total_sessions INTEGER NOT NULL DEFAULT 0,
      remaining_sessions INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS check_ins (
      id SERIAL PRIMARY KEY,
      member_id INTEGER NOT NULL,
      check_in_time TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create master admin members if they don't exist
  for (const admin of [
    { memberId: "1001", firstName: "Admin", lastName: "Asgard" },
    { memberId: "1002", firstName: "Maestro", lastName: "Asgard" },
  ]) {
    const [existing] = await db
      .select()
      .from(members)
      .where(eq(members.memberId, admin.memberId));

    if (!existing) {
      await db.insert(members).values({
        memberId: admin.memberId,
        firstName: admin.firstName,
        lastName: admin.lastName,
        active: true,
        totalSessions: 0,
        remainingSessions: 0,
      });
      console.log(`[seed] Created master member ${admin.memberId}`);
    }
  }

  console.log("[seed] Database ready.");
}
