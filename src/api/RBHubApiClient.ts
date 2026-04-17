import axios, { AxiosInstance } from "axios";
import type { AppConfig } from "../config/schema";
import { NormalizedAccessEvent, ValidationRequest, ValidationResponse } from "../device/types";

export class RBHubApiClient {
  private readonly http: AxiosInstance;

  constructor(private readonly config: AppConfig) {
    this.http = axios.create({
      baseURL: config.cloud.apiUrl,
      timeout: config.cloud.requestTimeoutMs,
      headers: {
        "x-api-key": config.cloud.apiKey,
        "x-device-id": config.cloud.deviceId,
        "x-tenant-id": config.cloud.tenantId,
        "content-type": "application/json"
      }
    });
  }

  async registerDevice(payload: Record<string, unknown>): Promise<any> {
    const { data } = await this.http.post("/api/integration/devices/register", payload);
    return data;
  }

  async heartbeat(payload: Record<string, unknown>): Promise<any> {
    const { data } = await this.http.post("/api/integration/devices/heartbeat", payload);
    return data;
  }

  async postAccessEvent(event: NormalizedAccessEvent): Promise<any> {
    const { data } = await this.http.post("/api/integration/access-events", event);
    return data;
  }

  async validateAccess(payload: ValidationRequest): Promise<ValidationResponse> {
    const { data } = await this.http.post("/api/integration/validate-access", payload);
    return data;
  }

  async fetchPendingCommands(): Promise<any[]> {
    const { data } = await this.http.get(`/api/integration/device-command/${this.config.cloud.deviceId}`);
    return data?.commands ?? [];
  }

  async ackCommand(commandId: string, payload: Record<string, unknown>): Promise<any> {
    const { data } = await this.http.post("/api/integration/device-command/ack", { commandId, ...payload });
    return data;
  }
}
