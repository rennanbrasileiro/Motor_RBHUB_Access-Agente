"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditRepository = void 0;
const time_1 = require("../utils/time");
class AuditRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    add(level, message, payload) {
        this.db.prepare(`INSERT INTO audit_logs (level, message, payload_json, created_at) VALUES (?, ?, ?, ?)`)
            .run(level, message, payload ? JSON.stringify(payload) : null, (0, time_1.nowIso)());
    }
    recent(limit = 200) {
        const rows = this.db.prepare(`SELECT level, message, payload_json, created_at FROM audit_logs ORDER BY id DESC LIMIT ?`).all(limit);
        return rows.map(r => ({ level: r.level, message: r.message, payload: r.payload_json ? JSON.parse(r.payload_json) : undefined, createdAt: r.created_at }));
    }
}
exports.AuditRepository = AuditRepository;
