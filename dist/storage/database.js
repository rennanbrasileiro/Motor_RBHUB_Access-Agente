"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabase = createDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const files_1 = require("../utils/files");
const migrations_1 = require("./migrations");
function createDatabase(config) {
    const dbPath = path_1.default.resolve(config.storage.databasePath);
    (0, files_1.ensureParentDir)(dbPath);
    const db = new better_sqlite3_1.default(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    (0, migrations_1.runMigrations)(db);
    return db;
}
