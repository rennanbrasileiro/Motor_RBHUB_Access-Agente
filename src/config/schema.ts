import { z } from "zod";

export const appConfigSchema = z.object({
  cloud: z.object({
    apiUrl: z.string().url(),
    apiKey: z.string().min(1),
    tenantId: z.string().min(1),
    deviceId: z.string().min(1),
    requestTimeoutMs: z.number().int().positive().default(15000)
  }),
  agent: z.object({
    name: z.string().min(1),
    environment: z.enum(["development", "staging", "production"]).default("production"),
    siteName: z.string().min(1),
    httpPort: z.number().int().min(1).max(65535),
    logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),
    heartbeatIntervalMs: z.number().int().positive(),
    syncIntervalMs: z.number().int().positive(),
    commandPollIntervalMs: z.number().int().positive(),
    clockDriftToleranceMs: z.number().int().nonnegative(),
    offlineCacheDays: z.number().int().positive(),
    enableLocalUi: z.boolean().default(true)
  }),
  storage: z.object({
    databasePath: z.string().min(1),
    logsPath: z.string().min(1),
    maxLogFiles: z.number().int().positive(),
    maxLogSize: z.string().min(1)
  }),
  device: z.object({
    mode: z.enum(["file-watch", "topdata-tcp"]),
    name: z.string().min(1),
    ip: z.string().min(1),
    port: z.number().int().min(1).max(65535),
    cardDigits: z.number().int().positive().default(14),
    timezone: z.string().min(1),
    allowUnlockWithoutCloud: z.boolean().default(false),
    unlock: z.object({
      method: z.enum(["generic-tcp", "external-command"]),
      tcpHexCommand: z.string().default(""),
      externalCommand: z.string().default(""),
      externalCommandArgs: z.array(z.string()).default([])
    }),
    fileWatch: z.object({
      path: z.string().min(1),
      encoding: z.enum(["utf8", "latin1"]).default("latin1"),
      ignoreInitial: z.boolean().default(false),
      debounceMs: z.number().int().positive().default(300),
      parser: z.enum(["topaccess-export"]).default("topaccess-export")
    })
  }),
  security: z.object({
    localUiToken: z.string().min(1),
    allowedCorsOrigin: z.string().min(1)
  })
});

export type AppConfig = z.infer<typeof appConfigSchema>;
