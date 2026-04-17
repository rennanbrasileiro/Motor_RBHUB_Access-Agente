"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const winston_1 = __importDefault(require("winston"));
let logger = null;
function createLogger(config) {
    if (logger)
        return logger;
    fs_1.default.mkdirSync(path_1.default.resolve(config.storage.logsPath), { recursive: true });
    logger = winston_1.default.createLogger({
        level: config.agent.logLevel,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
        transports: [
            new winston_1.default.transports.Console({ format: winston_1.default.format.simple() }),
            new winston_1.default.transports.File({
                filename: path_1.default.resolve(config.storage.logsPath, 'agent.log'),
                maxsize: parseSize(config.storage.maxLogSize),
                maxFiles: config.storage.maxLogFiles
            })
        ]
    });
    return logger;
}
function parseSize(value) {
    const normalized = value.trim().toLowerCase();
    const match = normalized.match(/^(\d+)([kmg])?$/);
    if (!match)
        return 20 * 1024 * 1024;
    const size = Number(match[1]);
    const unit = match[2];
    if (unit === 'k')
        return size * 1024;
    if (unit === 'm')
        return size * 1024 * 1024;
    if (unit === 'g')
        return size * 1024 * 1024 * 1024;
    return size;
}
