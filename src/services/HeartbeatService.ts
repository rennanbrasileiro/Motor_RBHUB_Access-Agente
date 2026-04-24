import { RBHubApiClient } from "../api/RBHubApiClient";
import { HeartbeatRepository } from "../repositories/HeartbeatRepository";
import { AuditRepository } from "../repositories/AuditRepository";
import type { AppConfig } from "../config/schema";
import type { DeviceConnector } from "../device/types";

export class HeartbeatService {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly config: AppConfig,
    private readonly apiClient: RBHubApiClient,
    private readonly heartbeatRepository: HeartbeatRepository,
    private readonly auditRepository: AuditRepository,
    private readonly connector: DeviceConnector
  ) {}

  start(): void {
    if (this.timer) return;
    void this.send();
    this.timer = setInterval(() => void this.send(), this.config.agent.heartbeatIntervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async send(): Promise<void> {
    const sentAt = new Date().toISOString();
    const payload = {
      deviceId: this.config.cloud.deviceId,
      tenantId: this.config.cloud.tenantId,
      sentAt,
      mode: this.config.device.mode,
      siteName: this.config.agent.siteName,
      status: this.connector.getStatus()
    };
    try {
      const response = await this.apiClient.heartbeat(payload);
      this.heartbeatRepository.add(sentAt, "ok", response);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.heartbeatRepository.add(sentAt, "error", undefined, message);
      this.auditRepository.add("error", "Falha no heartbeat", { message });
    }
  }
}
