import { storage } from "./storage";
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  // Create tables if they don't exist (SQLite DDL)
  db.run(sql`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      total_sessions INTEGER NOT NULL DEFAULT 0,
      remaining_sessions INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS check_ins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      check_in_time INTEGER NOT NULL
    )
  `);

  // Create admin members 1001 and 1002 if they don't exist
  const adminSeeds = [
    { memberId: "1001", firstName: "Admin", lastName: "Asgard" },
    { memberId: "1002", firstName: "Maestro", lastName: "Asgard" },
  ];

  for (const admin of adminSeeds) {
    const existing = await storage.getMemberByMemberId(admin.memberId);
    if (!existing) {
      await storage.createMember({
        memberId: admin.memberId,
        firstName: admin.firstName,
        lastName: admin.lastName,
        active: true,
        initialSessions: 0,
      });
      console.log(`[seed] Created master member ${admin.memberId}`);
    }
  }

  console.log("[seed] Database ready.");
}
