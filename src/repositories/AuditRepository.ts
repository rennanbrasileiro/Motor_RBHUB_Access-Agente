import Database from "better-sqlite3";
import { nowIso } from "../utils/time";

export class AuditRepository {
  constructor(private readonly db: Database.Database) {}

  add(level: string, message: string, payload?: unknown): void {
    this.db.prepare(`INSERT INTO audit_logs (level, message, payload_json, created_at) VALUES (?, ?, ?, ?)`)
      .run(level, message, payload ? JSON.stringify(payload) : null, nowIso());
  }

  recent(limit = 200): Array<{ level: string; message: string; payload?: any; createdAt: string }> {
    const rows = this.db.prepare(`SELECT level, message, payload_json, created_at FROM audit_logs ORDER BY id DESC LIMIT ?`).all(limit) as Array<{ level: string; message: string; payload_json?: string; created_at: string }>;
    return rows.map(r => ({ level: r.level, message: r.message, payload: r.payload_json ? JSON.parse(r.payload_json) : undefined, createdAt: r.created_at }));
  }
}
