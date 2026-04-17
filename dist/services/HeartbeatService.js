"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeartbeatService = void 0;
class HeartbeatService {
    config;
    apiClient;
    heartbeatRepository;
    auditRepository;
    connector;
    timer = null;
    constructor(config, apiClient, heartbeatRepository, auditRepository, connector) {
        this.config = config;
        this.apiClient = apiClient;
        this.heartbeatRepository = heartbeatRepository;
        this.auditRepository = auditRepository;
        this.connector = connector;
    }
    start() {
        if (this.timer)
            return;
        void this.send();
        this.timer = setInterval(() => void this.send(), this.config.agent.heartbeatIntervalMs);
    }
    stop() {
        if (this.timer)
            clearInterval(this.timer);
        this.timer = null;
    }
    async send() {
        const sentAt = new Date().toISOString();
        const payload = {
            deviceId: this.config.cloud.deviceId,
            tenantId: this.config.cloud.tenantId,
            status: "online",
            timestamp: sentAt
        };
        try {
            const response = await this.apiClient.heartbeat(payload);
            this.heartbeatRepository.add(sentAt, "ok", response);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.heartbeatRepository.add(sentAt, "error", undefined, message);
            this.auditRepository.add("error", "Falha no heartbeat", { message });
        }
    }
}
exports.HeartbeatService = HeartbeatService;
