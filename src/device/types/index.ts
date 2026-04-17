export type NormalizedAccessEvent = {
  rawLine?: string;
  source: string;
  cardNumber?: string;
  badgeCode?: string;
  employeeName?: string;
  eventType: "entry" | "exit" | "denied" | "turnstile" | "unknown";
  accessGranted?: boolean;
  deviceName?: string;
  deviceIp?: string;
  deviceId?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};

export type ValidationRequest = {
  deviceId: string;
  credentialCode?: string;
  cardNumber?: string;
  eventType: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};

export type ValidationResponse = {
  allow: boolean;
  reason: string;
  commandId?: string;
  cacheTtlSeconds?: number;
};

export interface DeviceConnector {
  start(): Promise<void>;
  stop(): Promise<void>;
  onEvent(handler: (event: NormalizedAccessEvent) => Promise<void>): void;
  unlock(reason?: string): Promise<{ ok: boolean; detail: string }>;
  getStatus(): Record<string, unknown>;
}
