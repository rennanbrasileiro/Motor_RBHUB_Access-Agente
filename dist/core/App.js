"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const logger_1 = require("../logging/logger");
const DeviceConnectorFactory_1 = require("../device/DeviceConnectorFactory");
const RBHubApiClient_1 = require("../api/RBHubApiClient");
const QueueRepository_1 = require("../repositories/QueueRepository");
const EventRepository_1 = require("../repositories/EventRepository");
const HeartbeatRepository_1 = require("../repositories/HeartbeatRepository");
const CommandRepository_1 = require("../repositories/CommandRepository");
const AuditRepository_1 = require("../repositories/AuditRepository");
const EventProcessor_1 = require("../processing/EventProcessor");
const SyncService_1 = require("../queue/SyncService");
const HeartbeatService_1 = require("../services/HeartbeatService");
const CommandPoller_1 = require("../commands/CommandPoller");
const httpServer_1 = require("../server/httpServer");
class App {
    config;
    logger;
    connector;
    apiClient;
    queueRepository;
    eventRepository;
    heartbeatRepository;
    commandRepository;
    auditRepository;
    eventProcessor;
    syncService;
    heartbeatService;
    commandPoller;
    constructor(config, db) {
        this.config = config;
        this.logger = (0, logger_1.createLogger)(config);
        this.connector = (0, DeviceConnectorFactory_1.createDeviceConnector)(config);
        this.apiClient = new RBHubApiClient_1.RBHubApiClient(config);
        this.queueRepository = new QueueRepository_1.QueueRepository(db);
        this.eventRepository = new EventRepository_1.EventRepository(db);
        this.heartbeatRepository = new HeartbeatRepository_1.HeartbeatRepository(db);
        this.commandRepository = new CommandRepository_1.CommandRepository(db);
        this.auditRepository = new AuditRepository_1.AuditRepository(db);
        this.eventProcessor = new EventProcessor_1.EventProcessor(this.apiClient, this.connector, this.eventRepository, this.queueRepository, this.auditRepository, this.logger, this.config.cloud.deviceId);
        this.syncService = new SyncService_1.SyncService(this.apiClient, this.queueRepository, this.auditRepository, this.logger, this.config.agent.syncIntervalMs);
        this.heartbeatService = new HeartbeatService_1.HeartbeatService(this.config, this.apiClient, this.heartbeatRepository, this.auditRepository, this.connector);
        this.commandPoller = new CommandPoller_1.CommandPoller(this.apiClient, this.commandRepository, this.auditRepository, this.connector, this.config.agent.commandPollIntervalMs);
    }
    async start() {
        this.logger.info("Iniciando RBHub Access Agent", { config: this.config.agent, cloud: { apiUrl: this.config.cloud.apiUrl, tenantId: this.config.cloud.tenantId, deviceId: this.config.cloud.deviceId } });
        this.connector.onEvent(async (event) => {
            await this.eventProcessor.process(event);
        });
        await this.connector.start();
        this.syncService.start();
        this.heartbeatService.start();
        this.commandPoller.start();
        if (this.config.agent.enableLocalUi) {
            await (0, httpServer_1.startHttpServer)({
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
    async stop() {
        this.syncService.stop();
        this.heartbeatService.stop();
        this.commandPoller.stop();
        await this.connector.stop();
    }
}
exports.App = App;
