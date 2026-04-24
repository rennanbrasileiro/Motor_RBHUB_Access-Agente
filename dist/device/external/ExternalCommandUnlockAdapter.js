"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalCommandUnlockAdapter = void 0;
const child_process_1 = require("child_process");
class ExternalCommandUnlockAdapter {
    config;
    constructor(config) {
        this.config = config;
    }
    async unlock(reason) {
        const command = this.config.device.unlock.externalCommand;
        const args = [...this.config.device.unlock.externalCommandArgs, reason ?? "unlock"];
        if (!command) {
            return { ok: false, detail: "externalCommand não configurado" };
        }
        return new Promise((resolve) => {
            const child = (0, child_process_1.spawn)(command, args, { shell: true, windowsHide: true });
            let stderr = "";
            child.stderr.on("data", chunk => { stderr += chunk.toString(); });
            child.on("exit", code => {
                resolve(code === 0
                    ? { ok: true, detail: `Comando executado com sucesso: ${command}` }
                    : { ok: false, detail: `Comando retornou código ${code}. ${stderr}`.trim() });
            });
            child.on("error", err => resolve({ ok: false, detail: err.message }));
        });
    }
}
exports.ExternalCommandUnlockAdapter = ExternalCommandUnlockAdapter;
