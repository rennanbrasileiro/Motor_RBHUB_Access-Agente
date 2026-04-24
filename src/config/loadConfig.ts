import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { appConfigSchema, AppConfig } from "./schema";

dotenv.config();

function resolveConfigPath(): string {
  const envPath = process.env.RBHUB_CONFIG_PATH;
  if (envPath) {
    return path.resolve(envPath);
  }
  return path.resolve(process.cwd(), "config", "default.config.json");
}

export function loadConfig(): AppConfig {
  const configPath = resolveConfigPath();
  if (!fs.existsSync(configPath)) {
    throw new Error(`Arquivo de configuração não encontrado: ${configPath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const result = appConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Configuração inválida:\n${result.error.issues.map(i => `- ${i.path.join('.')}: ${i.message}`).join('\n')}`);
  }
  return result.data;
}
