"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandPoller = void 0;
class CommandPoller {
    apiClient;
    commandRepository;
    auditRepository;
    connector;
    intervalMs;
    timer = null;
    running = false;
    constructor(apiClient, commandRepository, auditRepository, connector, intervalMs) {
        this.apiClient = apiClient;
        this.commandRepository = commandRepository;
        this.auditRepository = auditRepository;
        this.connector = connector;
        this.intervalMs = intervalMs;
    }
    start() {
        if (this.timer)
            return;
        this.timer = setInterval(() => void this.poll(), this.intervalMs);
    }
    stop() {
        if (this.timer)
            clearInterval(this.timer);
        this.timer = null;
    }
    async poll() {
        if (this.running)
            return;
        this.running = true;
        try {
            const commands = await this.apiClient.fetchPendingCommands();
            for (const command of commands) {
                const commandId = String(command.id ?? command.commandId ?? cryptoRandom());
                this.commandRepository.received(commandId, command, new Date().toISOString());
                try {
                    if (command.type === "unlock") {
                        const result = await this.connector.unlock("cloud-command");
                        if (!result.ok)
                            throw new Error(result.detail);
                    }
                    this.commandRepository.executed(commandId, new Date().toISOString());
                    await this.apiClient.ackCommand(commandId, { status: "executed" });
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    this.commandRepository.failed(commandId, message);
                    this.auditRepository.add("error", "Falha ao executar comando remoto", { commandId, message, command });
                    await this.apiClient.ackCommand(commandId, { status: "failed", errorMessage: message });
                }
            }
        }
        catch {
            // polling silencioso
        }
        finally {
            this.running = false;
        }
    }
}
exports.CommandPoller = CommandPoller;
function cryptoRandom() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
