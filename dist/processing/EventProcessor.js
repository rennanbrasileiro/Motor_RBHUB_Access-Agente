"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventProcessor = void 0;

const crypto_1 = __importDefault(require("crypto"));
const time_1 = require("../utils/time");
const UnlockService_1 = require("../services/unlock/UnlockService");

class EventProcessor {
    apiClient;
    connector;
    eventRepository;
    queueRepository;
    auditRepository;
    logger;
    deviceId;
    unlockService;

    constructor(apiClient, connector, eventRepository, queueRepository, auditRepository, logger, deviceId) {
        this.apiClient = apiClient;
        this.connector = connector;
        this.eventRepository = eventRepository;
        this.queueRepository = queueRepository;
        this.auditRepository = auditRepository;
        this.logger = logger;
        this.deviceId = deviceId;

        // =========================================================
        // ⚠️ IMPORTANTE:
        // Aqui estamos reaproveitando o config que já existe no connector.
        // Se no futuro o connector não expuser config, isso pode precisar
        // ser ajustado no bootstrap.
        // =========================================================
        const config = connector?.config || connector?._config || null;
        this.unlockService = new UnlockService_1.UnlockService(config, logger);
    }

    async process(event) {
        const eventKey = this.computeEventKey(event);
        this.eventRepository.save(eventKey, event, "pending");

        const validationPayload = {
            deviceId: this.deviceId,
            credentialCode: event.badgeCode,
            cardNumber: event.cardNumber,
            eventType: event.eventType,
            occurredAt: event.occurredAt,
            metadata: event.metadata
        };

        try {
            const decision = await this.apiClient.validateAccess(validationPayload);

            if (decision.allow) {
                const unlockResult = await this.unlockService.unlock({
                    reason: decision.reason,
                    personId: decision.personId || null,
                    credentialId: decision.credentialId || null,
                    deviceId: decision.deviceId || this.deviceId,
                    accessRuleId: decision.accessRuleId || null,
                    event
                });

                this.logger.info("Acesso liberado", {
                    eventKey,
                    unlockResult,
                    event,
                    decision
                });

                this.auditRepository.add("info", "Acesso liberado", {
                    eventKey,
                    unlockResult,
                    event,
                    decision
                });
            } else {
                this.logger.warn("Acesso negado", {
                    eventKey,
                    reason: decision.reason,
                    event
                });

                this.auditRepository.add("warn", "Acesso negado", {
                    eventKey,
                    reason: decision.reason,
                    event
                });
            }

            await this.apiClient.postAccessEvent(event);
            this.eventRepository.save(eventKey, event, "sent");

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);

            this.logger.error("Falha ao processar evento; adicionando à fila", {
                eventKey,
                message,
                event
            });

            this.auditRepository.add("error", "Evento enfileirado por falha no cloud", {
                eventKey,
                message,
                event
            });

            this.queueRepository.upsert(eventKey, {
                event,
                validationPayload,
                queuedAt: (0, time_1.nowIso)()
            });

            this.eventRepository.save(eventKey, event, "queued");
        }
    }

    computeEventKey(event) {
        return crypto_1.default
            .createHash("sha1")
            .update(JSON.stringify(event))
            .digest("hex");
    }
}

exports.EventProcessor = EventProcessor;