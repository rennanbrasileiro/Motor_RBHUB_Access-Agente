"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startHttpServer = startHttpServer;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
async function startHttpServer(deps) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json({ limit: "1mb" }));
    app.get("/health", (_req, res) => {
        res.json({ ok: true, time: new Date().toISOString() });
    });
    app.get("/api/status", (_req, res) => {
        res.json({
            agent: {
                name: deps.config.agent.name,
                environment: deps.config.agent.environment,
                siteName: deps.config.agent.siteName,
                deviceId: deps.config.cloud.deviceId,
                tenantId: deps.config.cloud.tenantId
            },
            device: deps.connector.getStatus(),
            queue: deps.queueRepository.stats(),
            heartbeat: deps.heartbeatRepository.latest(),
            commands: deps.commandRepository.recent(10)
        });
    });
    app.get("/api/events/recent", (_req, res) => {
        res.json({ items: deps.eventRepository.recent(100) });
    });
    app.get("/api/queue", (_req, res) => {
        res.json({ stats: deps.queueRepository.stats() });
    });
    app.get("/api/logs", (_req, res) => {
        res.json({ items: deps.auditRepository.recent(200) });
    });
    app.post("/api/unlock/test", async (req, res) => {
        const result = await deps.connector.unlock(req.body?.reason ?? "manual-test");
        res.status(result.ok ? 200 : 500).json(result);
    });
    app.post("/api/device/event", async (req, res) => {
        await deps.eventProcessor.process(req.body);
        res.json({ ok: true });
    });
    app.post("/api/config/reload", (_req, res) => {
        res.json({ ok: true, message: "Reinicie o serviço para aplicar alterações de configuração." });
    });
    const distStaticDir = path_1.default.resolve(__dirname, "static");
    const sourceStaticDir = path_1.default.resolve(process.cwd(), "src", "server", "static");
    app.use(express_1.default.static(require("fs").existsSync(distStaticDir) ? distStaticDir : sourceStaticDir));
    await new Promise((resolve) => {
        app.listen(deps.config.agent.httpPort, () => resolve());
    });
}
