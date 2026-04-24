import { spawn } from "child_process";
import type { AppConfig } from "../../config/schema";

export class ExternalCommandUnlockAdapter {
  constructor(private readonly config: AppConfig) {}

  async unlock(reason?: string): Promise<{ ok: boolean; detail: string }> {
    const command = this.config.device.unlock.externalCommand;
    const args = [...this.config.device.unlock.externalCommandArgs, reason ?? "unlock"];
    if (!command) {
      return { ok: false, detail: "externalCommand não configurado" };
    }

    return new Promise((resolve) => {
      const child = spawn(command, args, { shell: true, windowsHide: true });
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
