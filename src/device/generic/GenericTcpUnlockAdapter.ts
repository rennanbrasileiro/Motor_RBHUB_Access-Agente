import net from "net";
import type { AppConfig } from "../../config/schema";

export class GenericTcpUnlockAdapter {
  constructor(private readonly config: AppConfig) {}

  async unlock(): Promise<{ ok: boolean; detail: string }> {
    const hex = this.config.device.unlock.tcpHexCommand.replace(/\s+/g, "");
    if (!hex) {
      return { ok: false, detail: "tcpHexCommand não configurado" };
    }
    const buffer = Buffer.from(hex, "hex");
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const cleanup = () => {
        socket.removeAllListeners();
        socket.destroy();
      };
      socket.setTimeout(5000);
      socket.once("connect", () => {
        socket.write(buffer, (err) => {
          cleanup();
          if (err) return resolve({ ok: false, detail: err.message });
          resolve({ ok: true, detail: `Comando TCP enviado para ${this.config.device.ip}:${this.config.device.port}` });
        });
      });
      socket.once("timeout", () => {
        cleanup();
        resolve({ ok: false, detail: "Timeout ao enviar comando TCP" });
      });
      socket.once("error", (err) => {
        cleanup();
        resolve({ ok: false, detail: err.message });
      });
      socket.connect(this.config.device.port, this.config.device.ip);
    });
  }
}
