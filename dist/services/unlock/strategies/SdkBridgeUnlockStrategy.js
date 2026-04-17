"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SdkBridgeUnlockStrategy = void 0;

const child_process = require("child_process");

class SdkBridgeUnlockStrategy {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }

    async unlock(context = {}) {
        const bridgePath = this.config?.device?.unlock?.bridgeCommand || "";
        const bridgeArgs = Array.isArray(this.config?.device?.unlock?.bridgeArgs)
            ? [...this.config.device.unlock.bridgeArgs]
            : [];
        const timeoutMs = this.config?.device?.unlock?.timeoutMs || 15000;

        if (!bridgePath) {
            return { ok: false, detail: "bridgeCommand não configurado para sdk-bridge" };
        }

        return new Promise((resolve) => {
            try {
                const payload = Buffer.from(JSON.stringify({
                    action: "unlock",
                    device: {
                        id: this.config?.cloud?.deviceId || "",
                        ip: this.config?.device?.ip || "",
                        port: this.config?.device?.port || ""
                    },
                    context
                }), "utf8");

                const child = child_process.spawn(bridgePath, bridgeArgs, {
                    windowsHide: true,
                    shell: true
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
                        detail: `Timeout no sdk-bridge (${timeoutMs} ms)`,
                        stdout,
                        stderr,
                        method: "sdk-bridge"
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
                        detail: `Erro no sdk-bridge: ${error.message}`,
                        stdout,
                        stderr,
                        method: "sdk-bridge"
                    });
                });

                child.on("close", (code) => {
                    clearTimeout(timer);

                    if (code === 0) {
                        return finalize({
                            ok: true,
                            detail: "sdk-bridge executado com sucesso",
                            stdout: stdout.trim(),
                            stderr: stderr.trim(),
                            exitCode: code,
                            method: "sdk-bridge"
                        });
                    }

                    finalize({
                        ok: false,
                        detail: `sdk-bridge retornou código ${code}`,
                        stdout: stdout.trim(),
                        stderr: stderr.trim(),
                        exitCode: code,
                        method: "sdk-bridge"
                    });
                });

                child.stdin?.write(payload);
                child.stdin?.end();
            } catch (error) {
                resolve({
                    ok: false,
                    detail: error instanceof Error ? error.message : String(error),
                    method: "sdk-bridge"
                });
            }
        });
    }
}

exports.SdkBridgeUnlockStrategy = SdkBridgeUnlockStrategy;