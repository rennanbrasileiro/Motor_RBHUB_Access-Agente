import { RBHubApiClient } from "../api/RBHubApiClient";
import { CommandRepository } from "../repositories/CommandRepository";
import { AuditRepository } from "../repositories/AuditRepository";
import type { DeviceConnector } from "../device/types";

export class CommandPoller {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly apiClient: RBHubApiClient,
    private readonly commandRepository: CommandRepository,
    private readonly auditRepository: AuditRepository,
    private readonly connector: DeviceConnector,
    private readonly intervalMs: number
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.poll(), this.intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async poll(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const commands = await this.apiClient.fetchPendingCommands();
      for (const command of commands) {
        const commandId = String(command.id ?? command.commandId ?? cryptoRandom());
        this.commandRepository.received(commandId, command, new Date().toISOString());
        try {
          if (command.type === "unlock") {
            const result = await this.connector.unlock("cloud-command");
            if (!result.ok) throw new Error(result.detail);
          }
          this.commandRepository.executed(commandId, new Date().toISOString());
          await this.apiClient.ackCommand(commandId, { status: "executed" });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.commandRepository.failed(commandId, message);
          this.auditRepository.add("error", "Falha ao executar comando remoto", { commandId, message, command });
          await this.apiClient.ackCommand(commandId, { status: "failed", errorMessage: message });
        }
      }
    } catch {
      // polling silencioso
    } finally {
      this.running = false;
    }
  }
}

function cryptoRandom(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
