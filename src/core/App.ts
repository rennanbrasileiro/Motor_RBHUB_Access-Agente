import type { AppConfig } from "../config/schema";
import Database from "better-sqlite3";
import { createLogger } from "../logging/logger";
import { createDeviceConnector } from "../device/DeviceConnectorFactory";
import { RBHubApiClient } from "../api/RBHubApiClient";
import { QueueRepository } from "../repositories/QueueRepository";
import { EventRepository } from "../repositories/EventRepository";
import { HeartbeatRepository } from "../repositories/HeartbeatRepository";
import { CommandRepository } from "../repositories/CommandRepository";
import { AuditRepository } from "../repositories/AuditRepository";
import { EventProcessor } from "../processing/EventProcessor";
import { SyncService } from "../queue/SyncService";
import { HeartbeatService } from "../services/HeartbeatService";
import { CommandPoller } from "../commands/CommandPoller";
import { startHttpServer } from "../server/httpServer";

export class App {
  private readonly logger;
  private readonly connector;
  private readonly apiClient;
  private readonly queueRepository;
  private readonly eventRepository;
  private readonly heartbeatRepository;
  private readonly commandRepository;
  private readonly auditRepository;
  private readonly eventProcessor;
  private readonly syncService;
  private readonly heartbeatService;
  private readonly commandPoller;

  constructor(private readonly config: AppConfig, db: Database.Database) {
    this.logger = createLogger(config);
    this.connector = createDeviceConnector(config);
    this.apiClient = new RBHubApiClient(config);
    this.queueRepository = new QueueRepository(db);
    this.eventRepository = new EventRepository(db);
    this.heartbeatRepository = new HeartbeatRepository(db);
    this.commandRepository = new CommandRepository(db);
    this.auditRepository = new AuditRepository(db);
    this.eventProcessor = new EventProcessor(
      this.apiClient,
      this.connector,
      this.eventRepository,
      this.queueRepository,
      this.auditRepository,
      this.logger,
      this.config.cloud.deviceId
    );
    this.syncService = new SyncService(this.apiClient, this.queueRepository, this.auditRepository, this.logger, this.config.agent.syncIntervalMs);
    this.heartbeatService = new HeartbeatService(this.config, this.apiClient, this.heartbeatRepository, this.auditRepository, this.connector);
    this.commandPoller = new CommandPoller(this.apiClient, this.commandRepository, this.auditRepository, this.connector, this.config.agent.commandPollIntervalMs);
  }

  async start(): Promise<void> {
    this.logger.info("Iniciando RBHub Access Agent", { config: this.config.agent, cloud: { apiUrl: this.config.cloud.apiUrl, tenantId: this.config.cloud.tenantId, deviceId: this.config.cloud.deviceId } });
    this.connector.onEvent(async (event) => {
      await this.eventProcessor.process(event);
    });
    await this.connector.start();
    this.syncService.start();
    this.heartbeatService.start();
    this.commandPoller.start();

    if (this.config.agent.enableLocalUi) {
      await startHttpServer({
        config: this.config,
        connector: this.connector,
        eventRepository: this.eventRepository,
        queueRepository: this.queueRepository,
        heartbeatRepository: this.heartbeatRepository,
        commandRepository: this.commandRepository,
        auditRepository: this.auditRepository,
        eventProcessor: this.eventProcessor
      });
    }
  }

  async stop(): Promise<void> {
    this.syncService.stop();
    this.heartbeatService.stop();
    this.commandPoller.stop();
    await this.connector.stop();
  }
}
