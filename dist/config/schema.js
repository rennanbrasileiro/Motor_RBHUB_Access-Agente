"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfigSchema = void 0;
const zod_1 = require("zod");
exports.appConfigSchema = zod_1.z.object({
    cloud: zod_1.z.object({
        apiUrl: zod_1.z.string().url(),
        apiKey: zod_1.z.string().min(1),
        tenantId: zod_1.z.string().min(1),
        deviceId: zod_1.z.string().min(1),
        requestTimeoutMs: zod_1.z.number().int().positive().default(15000)
    }),
    agent: zod_1.z.object({
        name: zod_1.z.string().min(1),
        environment: zod_1.z.enum(["development", "staging", "production"]).default("production"),
        siteName: zod_1.z.string().min(1),
        httpPort: zod_1.z.number().int().min(1).max(65535),
        logLevel: zod_1.z.enum(["error", "warn", "info", "debug"]).default("info"),
        heartbeatIntervalMs: zod_1.z.number().int().positive(),
        syncIntervalMs: zod_1.z.number().int().positive(),
        commandPollIntervalMs: zod_1.z.number().int().positive(),
        clockDriftToleranceMs: zod_1.z.number().int().nonnegative(),
        offlineCacheDays: zod_1.z.number().int().positive(),
        enableLocalUi: zod_1.z.boolean().default(true)
    }),
    storage: zod_1.z.object({
        databasePath: zod_1.z.string().min(1),
        logsPath: zod_1.z.string().min(1),
        maxLogFiles: zod_1.z.number().int().positive(),
        maxLogSize: zod_1.z.string().min(1)
    }),
    device: zod_1.z.object({
        mode: zod_1.z.enum(["file-watch", "topdata-tcp"]),
        name: zod_1.z.string().min(1),
        ip: zod_1.z.string().min(1),
        port: zod_1.z.number().int().min(1).max(65535),
        cardDigits: zod_1.z.number().int().positive().default(14),
        timezone: zod_1.z.string().min(1),
        allowUnlockWithoutCloud: zod_1.z.boolean().default(false),
        unlock: zod_1.z.object({
            method: zod_1.z.enum(["generic-tcp", "external-command"]),
            tcpHexCommand: zod_1.z.string().default(""),
            externalCommand: zod_1.z.string().default(""),
            externalCommandArgs: zod_1.z.array(zod_1.z.string()).default([])
        }),
        fileWatch: zod_1.z.object({
            path: zod_1.z.string().min(1),
            encoding: zod_1.z.enum(["utf8", "latin1"]).default("latin1"),
            ignoreInitial: zod_1.z.boolean().default(false),
            debounceMs: zod_1.z.number().int().positive().default(300),
            parser: zod_1.z.enum(["topaccess-export"]).default("topaccess-export")
        })
    }),
    security: zod_1.z.object({
        localUiToken: zod_1.z.string().min(1),
        allowedCorsOrigin: zod_1.z.string().min(1)
    })
});
