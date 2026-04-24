# RBHub Access Agent

Serviço local Windows para conectar dispositivos físicos de controle de acesso ao **RBHub Access Cloud**.

## O que este pacote já entrega

- Serviço local em Node.js + TypeScript
- Banco local SQLite
- Fila offline com retry e backoff
- Heartbeat para o cloud
- Polling de comandos pendentes
- Painel local HTTP para diagnóstico e configuração
- Conector por observação de arquivo/exportação (`file-watch`)
- Adaptador de liberação por TCP genérico (`generic-tcp`)
- Adaptador de liberação por comando externo (`external-command`)
- Arquitetura pluggable para evoluir conector Topdata dedicado sem refatorar o core

## Limitação honesta

A liberação física 100% garantida depende do método real aceito pelo equipamento no ambiente do cliente. Como você quer uma solução nova e independente do legado, o projeto já isola esse ponto no módulo de `unlock`. Assim, o core do produto não depende do TopAcesso. O que muda entre instalações é apenas o adaptador de liberação.

## Requisitos

- Windows 10/11 ou Windows Server
- Node.js 20+ (para desenvolvimento)
- Para empacotar em EXE: `npm run package:win`

## Estrutura

- `src/main.ts`: bootstrap
- `src/core/App.ts`: orquestra todos os serviços
- `src/device/`: conectores do dispositivo
- `src/api/`: cliente do RBHub Access Cloud
- `src/storage/`: SQLite e migrações
- `src/server/`: painel local HTTP
- `src/installer/`: scripts para instalar/desinstalar como serviço Windows

## Instalação rápida (desenvolvimento)

```bash
npm install
copy .env.example .env
npm run build
npm start
```

Abra: `http://localhost:3001`

## Empacotamento para Windows

```bash
npm install
npm run package:win
```

Isso gera o binário em `release/`.

## Instalação como serviço Windows

Depois de gerar `dist/`:

```bash
npm run service:install
```

Para remover:

```bash
npm run service:uninstall
```

## Fluxo operacional

1. O conector local captura um evento (arquivo, TCP, outro adaptador)
2. O EventProcessor normaliza o evento
3. O ApiClient pergunta ao RBHub Access se o acesso deve ser liberado
4. Em caso positivo, o `unlock adapter` executa a liberação
5. Se o cloud estiver indisponível, o evento entra na fila local
6. O SyncService reenvia depois

## Endpoints locais

- `GET /health`
- `GET /api/status`
- `GET /api/events/recent`
- `GET /api/queue`
- `GET /api/logs`
- `POST /api/unlock/test`
- `POST /api/config/reload`
- `POST /api/device/event` (injeção manual para testes)

## Modos de dispositivo

### `file-watch`
Monitora um arquivo TXT/CSV exportado por um software local.

### `topdata-tcp`
Mantém conexão TCP com o IP/porta configurados, útil para diagnóstico e evolução posterior.

## Métodos de unlock

### `generic-tcp`
Envia bytes hexadecimais configurados no arquivo de configuração.

### `external-command`
Executa um EXE/script externo. Ideal para plugar um bridge nativo sem mudar o core.

## Próxima evolução natural

- Bridge nativa do fabricante, se necessária
- Mobile credential
- Biometria/facial integrada
- Cache local de credenciais com decisão offline
