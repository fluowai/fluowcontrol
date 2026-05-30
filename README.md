# Fluow Control Center 360

Painel central de gestão e observabilidade da FluowAI — o cérebro operacional da empresa.

## Stack

**Frontend:** React 19, Vite, Tailwind v4, Lucide Icons, Socket.IO Client  
**Backend:** Node.js, Express, TypeScript, Prisma ORM  
**Banco:** PostgreSQL + Supabase Realtime  
**Cache/Fila:** Redis + BullMQ  
**Infra:** Docker Compose, Portainer  
**Storage:** MinIO  
**IA:** Google Gemini API

## Arquitetura

```
fluowcontrol/
├── server.ts              # Entry point (Express + Vite + WebSocket)
├── prisma/
│   ├── schema.prisma      # Schema completo do banco
│   └── migrations/        # SQL migration de referência
├── server/
│   ├── api/
│   │   ├── middleware/     # auth (JWT), rbac, validation (Zod)
│   │   └── routes/         # 15 módulos de API REST
│   ├── services/           # docker, minio, postgres, supabase, portainer, whatsapp, notifications, cache
│   ├── workers/            # metrics-worker, alert-worker
│   ├── agent/              # Fluow Docker Agent (servidor autônomo)
│   ├── realtime/           # Socket.IO para dados ao vivo
│   ├── types/              # Tipos compartilhados
│   └── seed.ts             # Popula banco com dados iniciais
├── src/                    # Frontend React
│   ├── api.ts              # Cliente HTTP para todas as APIs
│   └── components/         # 13 módulos de UI
├── docker-compose.yml      # Infra completa (postgres, redis, minio, agent, workers)
├── Dockerfile              # Build do control-center
├── Dockerfile.agent        # Build do fluow-agent
└── Dockerfile.worker       # Build dos workers
```

## Serviços

### control-center-api (porta 3000)
API principal com 15 módulos:

| Módulo | Endpoints | Descrição |
|--------|-----------|----------|
| Auth | `/api/auth/*` | Login JWT, registro, perfil |
| Organizations | `/api/organizations/*` | CRUD clientes + visão 360 |
| Products | `/api/products/*` | Produtos FluowAI |
| Workspaces | `/api/workspaces/*` | Workspaces Docker por cliente |
| Tickets | `/api/tickets/*` | Helpdesk omnichannel |
| WhatsApp | `/api/whatsapp/*` | Instâncias, status, QR Code |
| Financeiro | `/api/financeiro/*` | Assinaturas, faturas, MRR/ARR |
| Infrastructure | `/api/infra/*` | Docker, Postgres, Supabase |
| Storage | `/api/storage/*` | MinIO buckets e arquivos |
| Users | `/api/users/*` | Equipe interna e permissões |
| Audit | `/api/audit/*` | Trilha de auditoria |
| Alerts | `/api/alerts/*` | Alertas operacionais |
| Events | `/api/events/*` | Ingestão de eventos dos produtos |
| Metrics | `/api/metrics/*` | Dashboard consolidado |
| Dashboard | `/api/dashboard/*` | KPIs, timeline, próximos vencimentos |
| AI | `/api/ai/chat` | Fluow AI Copilot (Gemini) |

### fluow-agent (porta 3001)
Coleta dados do servidor Docker:
- Containers (listar, logs, restart, stop, start)
- Host metrics (CPU, RAM, disco, uptime)
- Redes e volumes Docker
- Protegido por API Key

### metrics-worker
Coleta métricas em intervalos:
- 10s: status containers
- 30s: CPU/RAM servidor
- 1min: PostgreSQL e Supabase
- 5min: MinIO buckets
- 15min: billing/uso por cliente

### alert-worker
Gera alertas automáticos:
- Container caiu, CPU >85%, RAM >85%, disco >80%
- Instância WhatsApp desconectada, QR pendente
- Banco >80%, queries lentas, deadlock
- Bucket >80%, cliente acima do limite
- Assinaturas vencendo, tickets sem resposta

## Banco de Dados

Schema `control_center` com 20 tabelas principais:

- organizations, products, workspaces, services
- docker_containers, infrastructure_metrics
- postgres_metrics, supabase_metrics
- minio_buckets, whatsapp_instances
- api_health_checks, usage_events, alerts
- support_tickets, support_messages
- subscriptions, invoices, users
- audit_logs, notifications, portainer_connections
- knowledge_articles

## RBAC

| Role | Acesso |
|------|--------|
| owner | Total |
| admin | Total exceto config críticas |
| infra | Docker, Supabase, MinIO, logs |
| suporte | Clientes, tickets, WhatsApp, KB |
| financeiro | Assinaturas, faturas, clientes |
| viewer | Somente leitura |

## Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 3. Iniciar infraestrutura (PostgreSQL, Redis, MinIO)
docker compose up -d postgres redis minio

# 4. Gerar Prisma Client e criar tabelas
npx prisma generate
npx prisma db push

# 5. Popular banco com dados iniciais
npm run db:seed

# 6. Iniciar desenvolvimento
npm run dev
# Acessar http://localhost:3000
```

## Docker Compose (produção)

```bash
docker compose up -d
```

Isso inicia: postgres, redis, minio, control-center, fluow-agent, metrics-worker, alert-worker

## Eventos dos Produtos

Todos os produtos enviam eventos para `POST /api/events`:

```json
{
  "organization_id": "uuid",
  "product_slug": "nexus",
  "event_type": "automation",
  "event_name": "automation_failed",
  "severity": "error",
  "payload": { "message": "Erro ao enviar WhatsApp" }
}
```

## Health Check

Cada produto deve expor `GET /health`:

```json
{
  "status": "ok",
  "product": "nexus",
  "version": "1.0.0",
  "database": "ok",
  "queue": "ok",
  "uptime": 123456
}
```
