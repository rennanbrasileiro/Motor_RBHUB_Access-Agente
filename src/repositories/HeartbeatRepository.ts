import Database from "better-sqlite3";

export class HeartbeatRepository {
  constructor(private readonly db: Database.Database) {}

  add(sentAt: string, status: string, responseJson?: unknown, errorMessage?: string): void {
    this.db.prepare(`
      INSERT INTO heartbeats (sent_at, status, response_json, error_message)
      VALUES (?, ?, ?, ?)
    `).run(sentAt, status, responseJson ? JSON.stringify(responseJson) : null, errorMessage ?? null);
  }

  latest(): { sentAt: string; status: string; errorMessage?: string } | null {
    const row = this.db.prepare(`SELECT sent_at, status, error_message FROM heartbeats ORDER BY id DESC LIMIT 1`).get() as { sent_at: string; status: string; error_message?: string } | undefined;
    if (!row) return null;
    return { sentAt: row.sent_at, status: row.status, errorMessage: row.error_message };
  }
}
