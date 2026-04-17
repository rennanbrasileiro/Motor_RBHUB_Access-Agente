"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const schema_1 = require("./schema");
dotenv_1.default.config();
function resolveConfigPath() {
    const envPath = process.env.RBHUB_CONFIG_PATH;
    if (envPath) {
        return path_1.default.resolve(envPath);
    }
    return path_1.default.resolve(process.cwd(), "config", "default.config.json");
}
function loadConfig() {
    const configPath = resolveConfigPath();
    if (!fs_1.default.existsSync(configPath)) {
        throw new Error(`Arquivo de configuração não encontrado: ${configPath}`);
    }
    const parsed = JSON.parse(fs_1.default.readFileSync(configPath, "utf8"));
    const result = schema_1.appConfigSchema.safeParse(parsed);
    if (!result.success) {
        throw new Error(`Configuração inválida:\n${result.error.issues.map(i => `- ${i.path.join('.')}: ${i.message}`).join('\n')}`);
    }
    return result.data;
}
