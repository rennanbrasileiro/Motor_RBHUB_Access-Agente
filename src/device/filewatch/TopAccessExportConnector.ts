import fs from "fs";
import path from "path";
import chokidar, { FSWatcher } from "chokidar";
import type { AppConfig } from "../../config/schema";
import { parseTopAccessExportLine } from "../../parsing/topaccessExportParser";
import { DeviceConnector, NormalizedAccessEvent } from "../types";
import { GenericTcpUnlockAdapter } from "../generic/GenericTcpUnlockAdapter";
import { ExternalCommandUnlockAdapter } from "../external/ExternalCommandUnlockAdapter";

export class TopAccessExportConnector implements DeviceConnector {
  private watcher: FSWatcher | null = null;
  private offset = 0;
  private eventHandler: ((event: NormalizedAccessEvent) => Promise<void>) | null = null;
  private started = false;
  private lastReadAt: string | null = null;
  private lastEventAt: string | null = null;

  constructor(private readonly config: AppConfig) {}

  onEvent(handler: (event: NormalizedAccessEvent) => Promise<void>): void {
    this.eventHandler = handler;
  }

  async start(): Promise<void> {
    const filePath = path.resolve(this.config.device.fileWatch.path);
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, "", this.config.device.fileWatch.encoding);
    }
    const stat = fs.statSync(filePath);
    this.offset = this.config.device.fileWatch.ignoreInitial ? stat.size : 0;

    this.watcher = chokidar.watch(filePath, { ignoreInitial: false, awaitWriteFinish: { stabilityThreshold: this.config.device.fileWatch.debounceMs } });
    this.watcher.on("change", async () => { await this.readNewLines(); });
    this.started = true;
  }

  async stop(): Promise<void> {
    await this.watcher?.close();
    this.started = false;
  }

  async unlock(reason?: string): Promise<{ ok: boolean; detail: string }> {
    if (this.config.device.unlock.method === "generic-tcp") {
      return new GenericTcpUnlockAdapter(this.config).unlock();
    }
    return new ExternalCommandUnlockAdapter(this.config).unlock(reason);
  }

  getStatus(): Record<string, unknown> {
    return {
      mode: "file-watch",
      started: this.started,
      filePath: path.resolve(this.config.device.fileWatch.path),
      offset: this.offset,
      lastReadAt: this.lastReadAt,
      lastEventAt: this.lastEventAt
    };
  }

  private async readNewLines(): Promise<void> {
    const filePath = path.resolve(this.config.device.fileWatch.path);
    const fd = fs.openSync(filePath, "r");
    try {
      const stats = fs.fstatSync(fd);
      if (stats.size < this.offset) this.offset = 0;
      if (stats.size === this.offset) return;
      const length = stats.size - this.offset;
      const buffer = Buffer.alloc(length);
      fs.readSync(fd, buffer, 0, length, this.offset);
      this.offset = stats.size;
      this.lastReadAt = new Date().toISOString();
      const content = buffer.toString(this.config.device.fileWatch.encoding);
      const lines = content.split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        const parsed = parseTopAccessExportLine(line, "file-watch");
        if (parsed && this.eventHandler) {
          this.lastEventAt = new Date().toISOString();
          await this.eventHandler(parsed);
        }
      }
    } finally {
      fs.closeSync(fd);
    }
  }
}
