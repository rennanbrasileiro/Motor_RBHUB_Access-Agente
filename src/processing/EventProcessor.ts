import crypto from "crypto";
import { RBHubApiClient } from "../api/RBHubApiClient";
import { DeviceConnector, NormalizedAccessEvent, ValidationRequest } from "../device/types";
import { EventRepository } from "../repositories/EventRepository";
import { QueueRepository } from "../repositories/QueueRepository";
import { AuditRepository } from "../repositories/AuditRepository";
import { nowIso } from "../utils/time";
import winston from "winston";

export class EventProcessor {
  constructor(
    private readonly apiClient: RBHubApiClient,
    private readonly connector: DeviceConnector,
    private readonly eventRepository: EventRepository,
    private readonly queueRepository: QueueRepository,
    private readonly auditRepository: AuditRepository,
    private readonly logger: winston.Logger,
    private readonly deviceId: string
  ) {}

  async process(event: NormalizedAccessEvent): Promise<void> {
    const eventKey = this.computeEventKey(event);
    this.eventRepository.save(eventKey, event, "pending");

    const validationPayload: ValidationRequest = {
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
        const unlockResult = await this.connector.unlock(decision.reason);
        this.logger.info("Acesso liberado", { eventKey, unlockResult, event });
        this.auditRepository.add("info", "Acesso liberado", { eventKey, unlockResult, event, decision });
      } else {
        this.logger.warn("Acesso negado", { eventKey, reason: decision.reason, event });
        this.auditRepository.add("warn", "Acesso negado", { eventKey, reason: decision.reason, event });
      }
      await this.apiClient.postAccessEvent(event);
      this.eventRepository.save(eventKey, event, "sent");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Falha ao processar evento; adicionando à fila", { eventKey, message, event });
      this.auditRepository.add("error", "Evento enfileirado por falha no cloud", { eventKey, message, event });
      this.queueRepository.upsert(eventKey, { event, validationPayload, queuedAt: nowIso() });
      this.eventRepository.save(eventKey, event, "queued");
    }
  }

  private computeEventKey(event: NormalizedAccessEvent): string {
    return crypto.createHash("sha1").update(JSON.stringify(event)).digest("hex");
  }
}
