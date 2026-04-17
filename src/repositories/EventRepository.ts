import Database from "better-sqlite3";
import { nowIso } from "../utils/time";
import { NormalizedAccessEvent } from "../device/types";

export class EventRepository {
  constructor(private readonly db: Database.Database) {}

  save(eventKey: string, event: NormalizedAccessEvent, status: string): void {
    const now = nowIso();
    this.db.prepare(`
      INSERT INTO local_events (event_key, payload_json, source, cloud_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(event_key) DO UPDATE SET payload_json=excluded.payload_json, cloud_status=excluded.cloud_status, updated_at=excluded.updated_at
    `).run(eventKey, JSON.stringify(event), event.source, status, now, now);
  }

  recent(limit = 50): Array<{ eventKey: string; event: any; source: string; cloudStatus: string; createdAt: string }> {
    const rows = this.db.prepare(`
      SELECT event_key, payload_json, source, cloud_status, created_at
      FROM local_events
      ORDER BY id DESC LIMIT ?
    `).all(limit) as Array<{ event_key: string; payload_json: string; source: string; cloud_status: string; created_at: string }>;
    return rows.map(r => ({
      eventKey: r.event_key,
      event: JSON.parse(r.payload_json),
      source: r.source,
      cloudStatus: r.cloud_status,
      createdAt: r.created_at
    }));
  }
}
