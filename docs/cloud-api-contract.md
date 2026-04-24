# RBHub Access Cloud - contrato esperado pelo Agent

## Headers enviados pelo Agent
- `x-api-key`
- `x-device-id`
- `x-tenant-id`

## Endpoints esperados

### POST /api/integration/devices/register
Request:
```json
{
  "deviceId": "gateway-rec-01",
  "tenantId": "tenant-001",
  "siteName": "Recepcao Principal",
  "mode": "file-watch"
}
```

### POST /api/integration/devices/heartbeat
Request:
```json
{
  "deviceId": "gateway-rec-01",
  "tenantId": "tenant-001",
  "sentAt": "2026-04-13T20:00:00.000Z",
  "mode": "file-watch",
  "siteName": "Recepcao Principal",
  "status": {
    "mode": "file-watch",
    "started": true
  }
}
```

### POST /api/integration/validate-access
Request:
```json
{
  "deviceId": "gateway-rec-01",
  "credentialCode": "41597300163175",
  "cardNumber": "41597300163175",
  "eventType": "entry",
  "occurredAt": "2026-04-13T15:21:00.000Z",
  "metadata": {}
}
```
Response:
```json
{
  "allow": true,
  "reason": "Regra permitida"
}
```

### POST /api/integration/access-events
Request: o `NormalizedAccessEvent` enviado pelo Agent.

### GET /api/integration/device-command/:deviceId
Response:
```json
{
  "commands": [
    { "id": "cmd-001", "type": "unlock" }
  ]
}
```

### POST /api/integration/device-command/ack
Request:
```json
{
  "commandId": "cmd-001",
  "status": "executed"
}
```
