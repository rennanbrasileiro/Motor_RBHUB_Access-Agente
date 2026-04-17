import net from "net";
import type { AppConfig } from "../../config/schema";
import { DeviceConnector, NormalizedAccessEvent } from "../types";
import { GenericTcpUnlockAdapter } from "../generic/GenericTcpUnlockAdapter";
import { ExternalCommandUnlockAdapter } from "../external/ExternalCommandUnlockAdapter";

export class TopDataTcpConnector implements DeviceConnector {
  private socket: net.Socket | null = null;
  private eventHandler: ((event: NormalizedAccessEvent) => Promise<void>) | null = null;
  private connected = false;
  private lastMessageAt: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(private readonly config: AppConfig) {}

  onEvent(handler: (event: NormalizedAccessEvent) => Promise<void>): void {
    this.eventHandler = handler;
  }

  async start(): Promise<void> {
    this.connect();
  }

  async stop(): Promise<void> {
    this.reconnectTimer && clearTimeout(this.reconnectTimer);
    this.socket?.destroy();
  }

  async unlock(reason?: string): Promise<{ ok: boolean; detail: string }> {
    if (this.config.device.unlock.method === "generic-tcp") {
      return new GenericTcpUnlockAdapter(this.config).unlock();
    }
    return new ExternalCommandUnlockAdapter(this.config).unlock(reason);
  }

  getStatus(): Record<string, unknown> {
    return {
      mode: "topdata-tcp",
      connected: this.connected,
      ip: this.config.device.ip,
      port: this.config.device.port,
      lastMessageAt: this.lastMessageAt
    };
  }

  private connect(): void {
    this.socket = new net.Socket();
    this.socket.setKeepAlive(true);
    this.socket.once("connect", () => {
      this.connected = true;
    });
    this.socket.on("data", async (buffer) => {
      this.lastMessageAt = new Date().toISOString();
      const event: NormalizedAccessEvent = {
        source: "topdata-tcp",
        eventType: "unknown",
        occurredAt: this.lastMessageAt,
        metadata: {
          hex: buffer.toString("hex"),
          ascii: buffer.toString("latin1")
        }
      };
      if (this.eventHandler) await this.eventHandler(event);
    });
    this.socket.once("close", () => {
      this.connected = false;
      this.scheduleReconnect();
    });
    this.socket.once("error", () => {
      this.connected = false;
      this.scheduleReconnect();
    });
    this.socket.connect(this.config.device.port, this.config.device.ip);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }
}
