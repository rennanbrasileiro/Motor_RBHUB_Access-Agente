import { RBHubApiClient } from "../api/RBHubApiClient";
import { QueueRepository } from "../repositories/QueueRepository";
import { AuditRepository } from "../repositories/AuditRepository";
import winston from "winston";

export class SyncService {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly apiClient: RBHubApiClient,
    private readonly queueRepository: QueueRepository,
    private readonly auditRepository: AuditRepository,
    private readonly logger: winston.Logger,
    private readonly intervalMs: number
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.flush(), this.intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async flush(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const items = this.queueRepository.pending(100);
      for (const item of items) {
        try {
          await this.apiClient.postAccessEvent(item.payload.event);
          this.queueRepository.markSent(item.eventKey);
          this.auditRepository.add("info", "Evento sincronizado", { eventKey: item.eventKey });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const delayMs = Math.min(60000, Math.max(5000, (item.retries + 1) * 5000));
          this.queueRepository.markFailed(item.eventKey, message, delayMs);
          this.logger.warn("Falha ao sincronizar evento", { eventKey: item.eventKey, message, delayMs });
        }
      }
    } finally {
      this.running = false;
    }
  }
}
