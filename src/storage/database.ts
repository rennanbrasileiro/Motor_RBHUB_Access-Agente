import Database from "better-sqlite3";
import path from "path";
import type { AppConfig } from "../config/schema";
import { ensureParentDir } from "../utils/files";
import { runMigrations } from "./migrations";

export function createDatabase(config: AppConfig): Database.Database {
  const dbPath = path.resolve(config.storage.databasePath);
  ensureParentDir(dbPath);
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  return db;
}
