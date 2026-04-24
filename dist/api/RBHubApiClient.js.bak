"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBHubApiClient = void 0;

const axios_1 = __importDefault(require("axios"));
const https_proxy_agent_1 = require("https-proxy-agent");

class RBHubApiClient {
    config;
    http;

    constructor(config) {
        this.config = config;

        // =========================================================
        // 🔧 CONFIGURAÇÃO DE PROXY (PADRÃO FINAL)
        // =========================================================

        // ✔ Usa proxy do config (produção)
        const useProxy = !!config?.network?.useProxy;
        const proxyUrl = config?.network?.proxyUrl || "";

        // 🔥 DEBUG FORÇADO (SEFAZ / AMBIENTE BLOQUEADO)
        // 👉 USAR SOMENTE SE DER PROBLEMA DE REDE
        // 👉 DEPOIS REMOVER
        const FORCE_PROXY = true; 
        const FORCE_PROXY_URL = "http://tmws.sefaz.pe.gov.br:8080";

        const axiosConfig = {
            baseURL: config.cloud.apiUrl,
            timeout: config.cloud.requestTimeoutMs,

            headers: {
                "x-api-key": config.cloud.apiKey,
                "x-device-id": config.cloud.deviceId,
                "x-tenant-id": config.cloud.tenantId,
                "Content-Type": "application/json"
            }
        };

        // =========================================================
        // 🌐 DECISÃO FINAL DE PROXY
        // =========================================================

        if (FORCE_PROXY) {
            console.log("[RBHUB] 🔥 FORÇANDO PROXY:", FORCE_PROXY_URL);

            axiosConfig.httpsAgent = new https_proxy_agent_1.HttpsProxyAgent(FORCE_PROXY_URL);
            axiosConfig.proxy = false;

        } else if (useProxy && proxyUrl) {
            console.log("[RBHUB] 🌐 PROXY CONFIG:", proxyUrl);

            axiosConfig.httpsAgent = new https_proxy_agent_1.HttpsProxyAgent(proxyUrl);
            axiosConfig.proxy = false;

        } else {
            console.log("[RBHUB] 🚀 SEM PROXY (CONEXÃO DIRETA)");
        }

        this.http = axios_1.default.create(axiosConfig);
    }

    async registerDevice(payload) {
        const response = await this.http.post("/devices/register", payload);
        return response.data ?? { ok: true };
    }

    async heartbeat(payload) {
        try {
            const response = await this.http.post("/devices/heartbeat", payload);
            return response.data ?? { ok: true };

        } catch (error) {
            console.error("❌ ERRO REAL HEARTBEAT:",
                error?.response?.data ||
                error?.code ||
                error?.message ||
                error
            );
            throw error;
        }
    }

    async postAccessEvent(event) {
        const payload = {
            device_id: this.config.cloud.deviceId,
            tenant_id: this.config.cloud.tenantId,
            raw_line: event.rawLine,
            source: event.source,
            card_number: event.cardNumber,
            badge_code: event.badgeCode,
            employee_name: event.employeeName,
            event_type: event.eventType,
            method: "card",
            access_granted: event.accessGranted,
            occurred_at: event.occurredAt,
            metadata: event.metadata
        };

        try {
            const response = await this.http.post("/access-events", payload);
            return response.data ?? { ok: true };

        } catch (error) {
            console.error("❌ ERRO REAL EVENT:",
                error?.response?.data ||
                error?.code ||
                error?.message ||
                error
            );
            throw error;
        }
    }

    async validateAccess(event) {
        const payload = {
            device_id: this.config.cloud.deviceId,
            tenant_id: this.config.cloud.tenantId,

            credential_code: event.badgeCode || event.cardNumber || null,
            card_number: event.cardNumber || event.badgeCode || null,
            code: event.badgeCode || event.cardNumber || null,

            method: "card",
            event_type: event.eventType || "entry",
            occurred_at: event.occurredAt,
            source: event.source,
            raw_line: event.rawLine,
            metadata: event.metadata || {}
        };

        try {
            const response = await this.http.post("/validate-access", payload);
            return response.data ?? { ok: true };

        } catch (error) {
            console.error("❌ ERRO REAL VALIDATE:",
                error?.response?.data ||
                error?.code ||
                error?.message ||
                error
            );
            throw error;
        }
    }

    async fetchPendingCommands() {
        const response = await this.http.get(`/device-commands?deviceId=${this.config.cloud.deviceId}`);
        return response.data?.commands ?? [];
    }

    async ackCommand(commandId, payload) {
        try {
            const response = await this.http.post("/device-commands/ack", {
                command_id: commandId,
                device_id: this.config.cloud.deviceId,
                tenant_id: this.config.cloud.tenantId,
                status: "executed",
                executed_at: new Date().toISOString(),
                result: payload || {}
            });

            return response.data ?? { ok: true };

        } catch (error) {
            console.error("❌ ERRO REAL ACK:",
                error?.response?.data ||
                error?.code ||
                error?.message ||
                error
            );
            throw error;
        }
    }
}

exports.RBHubApiClient = RBHubApiClient;