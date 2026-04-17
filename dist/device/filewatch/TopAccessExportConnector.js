"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopAccessExportConnector = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chokidar_1 = __importDefault(require("chokidar"));
const topaccessExportParser_1 = require("../../parsing/topaccessExportParser");
const GenericTcpUnlockAdapter_1 = require("../generic/GenericTcpUnlockAdapter");
const ExternalCommandUnlockAdapter_1 = require("../external/ExternalCommandUnlockAdapter");
class TopAccessExportConnector {
    config;
    watcher = null;
    offset = 0;
    eventHandler = null;
    started = false;
    lastReadAt = null;
    lastEventAt = null;
    constructor(config) {
        this.config = config;
    }
    onEvent(handler) {
        this.eventHandler = handler;
    }
    async start() {
        const filePath = path_1.default.resolve(this.config.device.fileWatch.path);
        if (!fs_1.default.existsSync(filePath)) {
            fs_1.default.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
            fs_1.default.writeFileSync(filePath, "", this.config.device.fileWatch.encoding);
        }
        const stat = fs_1.default.statSync(filePath);
        this.offset = this.config.device.fileWatch.ignoreInitial ? stat.size : 0;
        this.watcher = chokidar_1.default.watch(filePath, { ignoreInitial: false, awaitWriteFinish: { stabilityThreshold: this.config.device.fileWatch.debounceMs } });
        this.watcher.on("change", async () => { await this.readNewLines(); });
        this.started = true;
    }
    async stop() {
        await this.watcher?.close();
        this.started = false;
    }
    async unlock(reason) {
        if (this.config.device.unlock.method === "generic-tcp") {
            return new GenericTcpUnlockAdapter_1.GenericTcpUnlockAdapter(this.config).unlock();
        }
        return new ExternalCommandUnlockAdapter_1.ExternalCommandUnlockAdapter(this.config).unlock(reason);
    }
    getStatus() {
        return {
            mode: "file-watch",
            started: this.started,
            filePath: path_1.default.resolve(this.config.device.fileWatch.path),
            offset: this.offset,
            lastReadAt: this.lastReadAt,
            lastEventAt: this.lastEventAt
        };
    }
    async readNewLines() {
        const filePath = path_1.default.resolve(this.config.device.fileWatch.path);
        const fd = fs_1.default.openSync(filePath, "r");
        try {
            const stats = fs_1.default.fstatSync(fd);
            if (stats.size < this.offset)
                this.offset = 0;
            if (stats.size === this.offset)
                return;
            const length = stats.size - this.offset;
            const buffer = Buffer.alloc(length);
            fs_1.default.readSync(fd, buffer, 0, length, this.offset);
            this.offset = stats.size;
            this.lastReadAt = new Date().toISOString();
            const content = buffer.toString(this.config.device.fileWatch.encoding);
            const lines = content.split(/\r?\n/).filter(Boolean);
            for (const line of lines) {
                const parsed = (0, topaccessExportParser_1.parseTopAccessExportLine)(line, "file-watch");
                if (parsed && this.eventHandler) {
                    this.lastEventAt = new Date().toISOString();
                    await this.eventHandler(parsed);
                }
            }
        }
        finally {
            fs_1.default.closeSync(fd);
        }
    }
}
exports.TopAccessExportConnector = TopAccessExportConnector;
