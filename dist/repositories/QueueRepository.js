"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueRepository = void 0;
const time_1 = require("../utils/time");
class QueueRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    upsert(eventKey, payload) {
        const now = (0, time_1.nowIso)();
        this.db.prepare(`
      INSERT INTO queue_events (event_key, payload_json, status, retries, created_at, updated_at)
      VALUES (?, ?, 'pending', 0, ?, ?)
      ON CONFLICT(event_key) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at
    `).run(eventKey, JSON.stringify(payload), now, now);
    }
    markSent(eventKey) {
        this.db.prepare(`UPDATE queue_events SET status='sent', updated_at=? WHERE event_key=?`).run((0, time_1.nowIso)(), eventKey);
    }
    markFailed(eventKey, errorMessage, delayMs) {
        const nextRetryAt = new Date(Date.now() + delayMs).toISOString();
        this.db.prepare(`
      UPDATE queue_events
      SET status='pending', retries=retries+1, last_error=?, next_retry_at=?, updated_at=?
      WHERE event_key=?
    `).run(errorMessage, nextRetryAt, (0, time_1.nowIso)(), eventKey);
    }
    pending(limit = 100) {
        const rows = this.db.prepare(`
      SELECT event_key, payload_json, retries
      FROM queue_events
      WHERE status='pending' AND (next_retry_at IS NULL OR next_retry_at <= ?)
      ORDER BY id ASC
      LIMIT ?
    `).all((0, time_1.nowIso)(), limit);
        return rows.map(r => ({ eventKey: r.event_key, payload: JSON.parse(r.payload_json), retries: r.retries }));
    }
    stats() {
        const pending = this.db.prepare(`SELECT COUNT(*) as c FROM queue_events WHERE status='pending'`).get();
        const sent = this.db.prepare(`SELECT COUNT(*) as c FROM queue_events WHERE status='sent'`).get();
        return { pending: pending.c, sent: sent.c };
    }
}
exports.QueueRepository = QueueRepository;
