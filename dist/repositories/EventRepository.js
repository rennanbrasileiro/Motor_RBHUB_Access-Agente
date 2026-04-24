"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRepository = void 0;
const time_1 = require("../utils/time");
class EventRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    save(eventKey, event, status) {
        const now = (0, time_1.nowIso)();
        this.db.prepare(`
      INSERT INTO local_events (event_key, payload_json, source, cloud_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(event_key) DO UPDATE SET payload_json=excluded.payload_json, cloud_status=excluded.cloud_status, updated_at=excluded.updated_at
    `).run(eventKey, JSON.stringify(event), event.source, status, now, now);
    }
    recent(limit = 50) {
        const rows = this.db.prepare(`
      SELECT event_key, payload_json, source, cloud_status, created_at
      FROM local_events
      ORDER BY id DESC LIMIT ?
    `).all(limit);
        return rows.map(r => ({
            eventKey: r.event_key,
            event: JSON.parse(r.payload_json),
            source: r.source,
            cloudStatus: r.cloud_status,
            createdAt: r.created_at
        }));
    }
}
exports.EventRepository = EventRepository;
