import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

const dbPath =
  process.env.DATABASE_PATH ||
  (process.env.NODE_ENV === "production"
    ? "/data/asgard.db"
    : path.resolve(process.cwd(), "asgard.db"));
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
