"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoopUnlockStrategy = void 0;

class NoopUnlockStrategy {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }

    async unlock(context = {}) {
        return {
            ok: false,
            detail: "Unlock desabilitado ou método não configurado",
            method: "noop"
        };
    }
}

exports.NoopUnlockStrategy = NoopUnlockStrategy;