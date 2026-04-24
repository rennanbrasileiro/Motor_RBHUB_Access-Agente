"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalCommandUnlockStrategy = void 0;

const child_process = require("child_process");

class ExternalCommandUnlockStrategy {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }

    async unlock(context = {}) {
        const command = this.config?.device?.unlock?.externalCommand || "";
        const args = Array.isArray(this.config?.device?.unlock?.externalCommandArgs)
            ? [...this.config.device.unlock.externalCommandArgs]
            : [];
        const timeoutMs = this.config?.device?.unlock?.timeoutMs || 10000;

        if (!command) {
            return { ok: false, detail: "externalCommand não configurado" };
        }

        return new Promise((resolve) => {
            try {
                const child = child_process.spawn(command, args, {
                    windowsHide: true,
                    shell: true,
                    env: {
                        ...process.env,
                        RBHUB_DEVICE_ID: this.config?.cloud?.deviceId || "",
                        RBHUB_TENANT_ID: this.config?.cloud?.tenantId || "",
                        RBHUB_CONTEXT: JSON.stringify(context || {})
                    }
                });

                let stdout = "";
                let stderr = "";
                let finished = false;

                const finalize = (result) => {
                    if (finished) return;
                    finished = true;
                    resolve(result);
                };

                const timer = setTimeout(() => {
                    try { child.kill(); } catch (_) {}
                    finalize({
                        ok: false,
                        detail: `Timeout no comando externo (${timeoutMs} ms)`,
                        stdout,
                        stderr
                    });
                }, timeoutMs);

                child.stdout?.on("data", (chunk) => {
                    stdout += String(chunk);
                });

                child.stderr?.on("data", (chunk) => {
                    stderr += String(chunk);
                });

                child.on("error", (error) => {
                    clearTimeout(timer);
                    finalize({
                        ok: false,
                        detail: `Erro ao executar comando externo: ${error.message}`,
                        stdout,
                        stderr
                    });
                });

                child.on("close", (code) => {
                    clearTimeout(timer);

                    if (code === 0) {
                        return finalize({
                            ok: true,
                            detail: "Comando externo executado com sucesso",
                            stdout: stdout.trim(),
                            stderr: stderr.trim(),
                            exitCode: code,
                            method: "external-command"
                        });
                    }

                    finalize({
                        ok: false,
                        detail: `Comando externo retornou código ${code}`,
                        stdout: stdout.trim(),
                        stderr: stderr.trim(),
                        exitCode: code,
                        method: "external-command"
                    });
                });
            } catch (error) {
                resolve({
                    ok: false,
                    detail: error instanceof Error ? error.message : String(error),
                    method: "external-command"
                });
            }
        });
    }
}

exports.ExternalCommandUnlockStrategy = ExternalCommandUnlockStrategy;