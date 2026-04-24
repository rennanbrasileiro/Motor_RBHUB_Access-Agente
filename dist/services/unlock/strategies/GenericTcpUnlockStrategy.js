"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericTcpUnlockStrategy = void 0;

const net = require("net");

class GenericTcpUnlockStrategy {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }

    hexToBuffer(hex) {
        const clean = (hex || "").replace(/\s+/g, "").trim();

        if (!clean) {
            throw new Error("tcpHexCommand não configurado");
        }

        if (clean.length % 2 !== 0) {
            throw new Error("tcpHexCommand inválido: número ímpar de caracteres");
        }

        if (!/^[0-9a-fA-F]+$/.test(clean)) {
            throw new Error("tcpHexCommand inválido: contém caracteres não hexadecimais");
        }

        return Buffer.from(clean, "hex");
    }

    async unlock(context = {}) {
        const ip = this.config?.device?.ip;
        const port = this.config?.device?.port;
        const timeoutMs = this.config?.device?.unlock?.timeoutMs || 5000;
        const tcpHexCommand = this.config?.device?.unlock?.tcpHexCommand || "";

        if (!ip) {
            return { ok: false, detail: "IP do dispositivo não configurado" };
        }

        if (!port) {
            return { ok: false, detail: "Porta do dispositivo não configurada" };
        }

        let payload;
        try {
            payload = this.hexToBuffer(tcpHexCommand);
        } catch (error) {
            return {
                ok: false,
                detail: error instanceof Error ? error.message : String(error)
            };
        }

        return new Promise((resolve) => {
            const socket = new net.Socket();
            let finished = false;

            const finalize = (result) => {
                if (finished) return;
                finished = true;

                try { socket.destroy(); } catch (_) {}

                resolve(result);
            };

            socket.setTimeout(timeoutMs);

            socket.on("connect", () => {
                try {
                    socket.write(payload, (err) => {
                        if (err) {
                            return finalize({
                                ok: false,
                                detail: `Falha ao escrever no socket: ${err.message}`
                            });
                        }

                        finalize({
                            ok: true,
                            detail: "Comando TCP enviado com sucesso",
                            method: "generic-tcp",
                            ip,
                            port
                        });
                    });
                } catch (error) {
                    finalize({
                        ok: false,
                        detail: error instanceof Error ? error.message : String(error)
                    });
                }
            });

            socket.on("timeout", () => {
                finalize({
                    ok: false,
                    detail: `Timeout ao conectar/enviar para ${ip}:${port}`
                });
            });

            socket.on("error", (error) => {
                finalize({
                    ok: false,
                    detail: `Erro TCP em ${ip}:${port}: ${error.message}`
                });
            });

            try {
                socket.connect(port, ip);
            } catch (error) {
                finalize({
                    ok: false,
                    detail: error instanceof Error ? error.message : String(error)
                });
            }
        });
    }
}

exports.GenericTcpUnlockStrategy = GenericTcpUnlockStrategy;