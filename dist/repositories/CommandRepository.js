"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRepository = void 0;
class CommandRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    received(commandId, payload, receivedAt) {
        this.db.prepare(`
      INSERT INTO commands (command_id, payload_json, status, received_at)
      VALUES (?, ?, 'pending', ?)
      ON CONFLICT(command_id) DO NOTHING
    `).run(commandId, JSON.stringify(payload), receivedAt);
    }
    executed(commandId, executedAt) {
        this.db.prepare(`UPDATE commands SET status='executed', executed_at=? WHERE command_id=?`).run(executedAt, commandId);
    }
    failed(commandId, errorMessage) {
        this.db.prepare(`UPDATE commands SET status='failed', error_message=? WHERE command_id=?`).run(errorMessage, commandId);
    }
    recent(limit = 50) {
        const rows = this.db.prepare(`
      SELECT command_id, status, received_at, executed_at, payload_json
      FROM commands ORDER BY id DESC LIMIT ?
    `).all(limit);
        return rows.map(r => ({
            commandId: r.command_id,
            status: r.status,
            receivedAt: r.received_at,
            executedAt: r.executed_at,
            payload: JSON.parse(r.payload_json)
        }));
    }
}
exports.CommandRepository = CommandRepository;
