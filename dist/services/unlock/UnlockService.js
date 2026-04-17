"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnlockService = void 0;

const GenericTcpUnlockStrategy_1 = require("./strategies/GenericTcpUnlockStrategy");
const ExternalCommandUnlockStrategy_1 = require("./strategies/ExternalCommandUnlockStrategy");
const SdkBridgeUnlockStrategy_1 = require("./strategies/SdkBridgeUnlockStrategy");
const NoopUnlockStrategy_1 = require("./strategies/NoopUnlockStrategy");

class UnlockService {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.strategy = this.createStrategy();
    }

    createStrategy() {
        const method = this.config?.device?.unlock?.method || "noop";

        switch (method) {
            case "generic-tcp":
                return new GenericTcpUnlockStrategy_1.GenericTcpUnlockStrategy(this.config, this.logger);
            case "external-command":
                return new ExternalCommandUnlockStrategy_1.ExternalCommandUnlockStrategy(this.config, this.logger);
            case "sdk-bridge":
                return new SdkBridgeUnlockStrategy_1.SdkBridgeUnlockStrategy(this.config, this.logger);
            case "noop":
            default:
                return new NoopUnlockStrategy_1.NoopUnlockStrategy(this.config, this.logger);
        }
    }

    async unlock(context = {}) {
        try {
            const result = await this.strategy.unlock(context);

            if (result?.ok) {
                this.logger?.info?.("Unlock executado com sucesso", {
                    method: this.config?.device?.unlock?.method,
                    result
                });
            } else {
                this.logger?.warn?.("Unlock executado com falha", {
                    method: this.config?.device?.unlock?.method,
                    result
                });
            }

            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);

            this.logger?.error?.("Erro no UnlockService", {
                method: this.config?.device?.unlock?.method,
                message
            });

            return {
                ok: false,
                detail: message
            };
        }
    }
}

exports.UnlockService = UnlockService;