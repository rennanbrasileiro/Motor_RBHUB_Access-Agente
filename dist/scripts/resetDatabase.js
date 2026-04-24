"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const loadConfig_1 = require("../config/loadConfig");
const config = (0, loadConfig_1.loadConfig)();
const dbPath = path_1.default.resolve(config.storage.databasePath);
if (fs_1.default.existsSync(dbPath)) {
    fs_1.default.rmSync(dbPath);
    console.log(`Banco removido: ${dbPath}`);
}
else {
    console.log(`Banco não encontrado: ${dbPath}`);
}
