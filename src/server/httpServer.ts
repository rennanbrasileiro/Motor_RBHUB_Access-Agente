import express from "express";
import type { AppConfig } from "../config/schema";
import { EventRepository } from "../repositories/EventRepository";
import { QueueRepository } from "../repositories/QueueRepository";
import { HeartbeatRepository } from "../repositories/HeartbeatRepository";
import { CommandRepository } from "../repositories/CommandRepository";
import { AuditRepository } from "../repositories/AuditRepository";
import type { DeviceConnector } from "../device/types";
import { EventProcessor } from "../processing/EventProcessor";
import path from "path";

export type HttpServerDeps = {
  config: AppConfig;
  connector: DeviceConnector;
  eventRepository: EventRepository;
  queueRepository: QueueRepository;
  heartbeatRepository: HeartbeatRepository;
  commandRepository: CommandRepository;
  auditRepository: AuditRepository;
  eventProcessor: EventProcessor;
};

export async function startHttpServer(deps: HttpServerDeps): Promise<void> {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

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

  const distStaticDir = path.resolve(__dirname, "static");
  const sourceStaticDir = path.resolve(process.cwd(), "src", "server", "static");
  app.use(express.static(require("fs").existsSync(distStaticDir) ? distStaticDir : sourceStaticDir));

  await new Promise<void>((resolve) => {
    app.listen(deps.config.agent.httpPort, () => resolve());
  });
}
