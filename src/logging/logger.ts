import fs from "fs";
import path from "path";
import winston from "winston";
import type { AppConfig } from "../config/schema";

let logger: winston.Logger | null = null;

export function createLogger(config: AppConfig): winston.Logger {
  if (logger) return logger;
  fs.mkdirSync(path.resolve(config.storage.logsPath), { recursive: true });

  logger = winston.createLogger({
    level: config.agent.logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({ format: winston.format.simple() }),
      new winston.transports.File({
        filename: path.resolve(config.storage.logsPath, 'agent.log'),
        maxsize: parseSize(config.storage.maxLogSize),
        maxFiles: config.storage.maxLogFiles
      })
    ]
  });

  return logger;
}

function parseSize(value: string): number {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^(\d+)([kmg])?$/);
  if (!match) return 20 * 1024 * 1024;
  const size = Number(match[1]);
  const unit = match[2];
  if (unit === 'k') return size * 1024;
  if (unit === 'm') return size * 1024 * 1024;
  if (unit === 'g') return size * 1024 * 1024 * 1024;
  return size;
}
