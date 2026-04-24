"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
class SyncService {
    apiClient;
    queueRepository;
    auditRepository;
    logger;
    intervalMs;
    timer = null;
    running = false;
    constructor(apiClient, queueRepository, auditRepository, logger, intervalMs) {
        this.apiClient = apiClient;
        this.queueRepository = queueRepository;
        this.auditRepository = auditRepository;
        this.logger = logger;
        this.intervalMs = intervalMs;
    }
    start() {
        if (this.timer)
            return;
        this.timer = setInterval(() => void this.flush(), this.intervalMs);
    }
    stop() {
        if (this.timer)
            clearInterval(this.timer);
        this.timer = null;
    }
    async flush() {
        if (this.running)
            return;
        this.running = true;
        try {
            const items = this.queueRepository.pending(100);
            for (const item of items) {
                try {
                    await this.apiClient.postAccessEvent(item.payload.event);
                    this.queueRepository.markSent(item.eventKey);
                    this.auditRepository.add("info", "Evento sincronizado", { eventKey: item.eventKey });
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    const delayMs = Math.min(60000, Math.max(5000, (item.retries + 1) * 5000));
                    this.queueRepository.markFailed(item.eventKey, message, delayMs);
                    this.logger.warn("Falha ao sincronizar evento", { eventKey: item.eventKey, message, delayMs });
                }
            }
        }
        finally {
            this.running = false;
        }
    }
}
exports.SyncService = SyncService;
