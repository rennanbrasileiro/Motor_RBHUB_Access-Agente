import Database from "better-sqlite3";

export class CommandRepository {
  constructor(private readonly db: Database.Database) {}

  received(commandId: string, payload: unknown, receivedAt: string): void {
    this.db.prepare(`
      INSERT INTO commands (command_id, payload_json, status, received_at)
      VALUES (?, ?, 'pending', ?)
      ON CONFLICT(command_id) DO NOTHING
    `).run(commandId, JSON.stringify(payload), receivedAt);
  }

  executed(commandId: string, executedAt: string): void {
    this.db.prepare(`UPDATE commands SET status='executed', executed_at=? WHERE command_id=?`).run(executedAt, commandId);
  }

  failed(commandId: string, errorMessage: string): void {
    this.db.prepare(`UPDATE commands SET status='failed', error_message=? WHERE command_id=?`).run(errorMessage, commandId);
  }

  recent(limit = 50): Array<{ commandId: string; status: string; receivedAt: string; executedAt?: string; payload: any }> {
    const rows = this.db.prepare(`
      SELECT command_id, status, received_at, executed_at, payload_json
      FROM commands ORDER BY id DESC LIMIT ?
    `).all(limit) as Array<{ command_id: string; status: string; received_at: string; executed_at?: string; payload_json: string }>;
    return rows.map(r => ({
      commandId: r.command_id,
      status: r.status,
      receivedAt: r.received_at,
      executedAt: r.executed_at,
      payload: JSON.parse(r.payload_json)
    }));
  }
}
