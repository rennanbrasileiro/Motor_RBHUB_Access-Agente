"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeartbeatRepository = void 0;
class HeartbeatRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    add(sentAt, status, responseJson, errorMessage) {
        this.db.prepare(`
      INSERT INTO heartbeats (sent_at, status, response_json, error_message)
      VALUES (?, ?, ?, ?)
    `).run(sentAt, status, responseJson ? JSON.stringify(responseJson) : null, errorMessage ?? null);
    }
    latest() {
        const row = this.db.prepare(`SELECT sent_at, status, error_message FROM heartbeats ORDER BY id DESC LIMIT 1`).get();
        if (!row)
            return null;
        return { sentAt: row.sent_at, status: row.status, errorMessage: row.error_message };
    }
}
exports.HeartbeatRepository = HeartbeatRepository;
