"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopDataTcpConnector = void 0;
const net_1 = __importDefault(require("net"));
const GenericTcpUnlockAdapter_1 = require("../generic/GenericTcpUnlockAdapter");
const ExternalCommandUnlockAdapter_1 = require("../external/ExternalCommandUnlockAdapter");
class TopDataTcpConnector {
    config;
    socket = null;
    eventHandler = null;
    connected = false;
    lastMessageAt = null;
    reconnectTimer = null;
    constructor(config) {
        this.config = config;
    }
    onEvent(handler) {
        this.eventHandler = handler;
    }
    async start() {
        this.connect();
    }
    async stop() {
        this.reconnectTimer && clearTimeout(this.reconnectTimer);
        this.socket?.destroy();
    }
    async unlock(reason) {
        if (this.config.device.unlock.method === "generic-tcp") {
            return new GenericTcpUnlockAdapter_1.GenericTcpUnlockAdapter(this.config).unlock();
        }
        return new ExternalCommandUnlockAdapter_1.ExternalCommandUnlockAdapter(this.config).unlock(reason);
    }
    getStatus() {
        return {
            mode: "topdata-tcp",
            connected: this.connected,
            ip: this.config.device.ip,
            port: this.config.device.port,
            lastMessageAt: this.lastMessageAt
        };
    }
    connect() {
        this.socket = new net_1.default.Socket();
        this.socket.setKeepAlive(true);
        this.socket.once("connect", () => {
            this.connected = true;
        });
        this.socket.on("data", async (buffer) => {
            this.lastMessageAt = new Date().toISOString();
            const event = {
                source: "topdata-tcp",
                eventType: "unknown",
                occurredAt: this.lastMessageAt,
                metadata: {
                    hex: buffer.toString("hex"),
                    ascii: buffer.toString("latin1")
                }
            };
            if (this.eventHandler)
                await this.eventHandler(event);
        });
        this.socket.once("close", () => {
            this.connected = false;
            this.scheduleReconnect();
        });
        this.socket.once("error", () => {
            this.connected = false;
            this.scheduleReconnect();
        });
        this.socket.connect(this.config.device.port, this.config.device.ip);
    }
    scheduleReconnect() {
        if (this.reconnectTimer)
            return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, 5000);
    }
}
exports.TopDataTcpConnector = TopDataTcpConnector;
