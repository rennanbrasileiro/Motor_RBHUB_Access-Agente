import Database from "better-sqlite3";
import { nowIso } from "../utils/time";

export class QueueRepository {
  constructor(private readonly db: Database.Database) {}

  upsert(eventKey: string, payload: unknown): void {
    const now = nowIso();
    this.db.prepare(`
      INSERT INTO queue_events (event_key, payload_json, status, retries, created_at, updated_at)
      VALUES (?, ?, 'pending', 0, ?, ?)
      ON CONFLICT(event_key) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at
    `).run(eventKey, JSON.stringify(payload), now, now);
  }

  markSent(eventKey: string): void {
    this.db.prepare(`UPDATE queue_events SET status='sent', updated_at=? WHERE event_key=?`).run(nowIso(), eventKey);
  }

  markFailed(eventKey: string, errorMessage: string, delayMs: number): void {
    const nextRetryAt = new Date(Date.now() + delayMs).toISOString();
    this.db.prepare(`
      UPDATE queue_events
      SET status='pending', retries=retries+1, last_error=?, next_retry_at=?, updated_at=?
      WHERE event_key=?
    `).run(errorMessage, nextRetryAt, nowIso(), eventKey);
  }

  pending(limit = 100): Array<{ eventKey: string; payload: any; retries: number }> {
    const rows = this.db.prepare(`
      SELECT event_key, payload_json, retries
      FROM queue_events
      WHERE status='pending' AND (next_retry_at IS NULL OR next_retry_at <= ?)
      ORDER BY id ASC
      LIMIT ?
    `).all(nowIso(), limit) as Array<{ event_key: string; payload_json: string; retries: number }>;
    return rows.map(r => ({ eventKey: r.event_key, payload: JSON.parse(r.payload_json), retries: r.retries }));
  }

  stats(): { pending: number; sent: number } {
    const pending = this.db.prepare(`SELECT COUNT(*) as c FROM queue_events WHERE status='pending'`).get() as { c: number };
    const sent = this.db.prepare(`SELECT COUNT(*) as c FROM queue_events WHERE status='sent'`).get() as { c: number };
    return { pending: pending.c, sent: sent.c };
  }
}
