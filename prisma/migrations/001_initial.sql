-- Fluow Control Center - Initial Schema
-- This SQL is a reference; use Prisma migrations for actual deployment

CREATE SCHEMA IF NOT EXISTS control_center;

-- Organizations (clients/companies)
CREATE TABLE control_center.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  document TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','trial','suspended','cancelled','overdue')),
  plan_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE control_center.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  public_url TEXT,
  admin_url TEXT,
  healthcheck_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspaces
CREATE TABLE control_center.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES control_center.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES control_center.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  public_url TEXT,
  admin_url TEXT,
  database_schema TEXT,
  minio_bucket TEXT,
  docker_stack TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','creating','deleting')),
  plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services
CREATE TABLE control_center.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES control_center.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('frontend','backend','worker','database','storage','whatsapp','api','queue','cache')),
  docker_container_name TEXT,
  docker_stack_name TEXT,
  internal_url TEXT,
  public_url TEXT,
  healthcheck_url TEXT,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('online','offline','degraded','unknown')),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Docker containers snapshot
CREATE TABLE control_center.docker_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  status TEXT,
  state TEXT NOT NULL DEFAULT 'created' CHECK (state IN ('running','exited','restarting','paused','removing','dead','created')),
  ports JSONB DEFAULT '[]',
  cpu_percent DECIMAL(10,2),
  memory_usage_mb DECIMAL(12,2),
  memory_limit_mb DECIMAL(12,2),
  network_rx_mb DECIMAL(12,2),
  network_tx_mb DECIMAL(12,2),
  uptime_seconds INTEGER,
  restart_count INTEGER,
  last_error TEXT,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Infrastructure metrics (host)
CREATE TABLE control_center.infrastructure_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_name TEXT NOT NULL,
  cpu_percent DECIMAL(5,2),
  ram_used_gb DECIMAL(8,2),
  ram_total_gb DECIMAL(8,2),
  disk_used_gb DECIMAL(10,2),
  disk_total_gb DECIMAL(10,2),
  load_average JSONB,
  uptime_seconds INTEGER,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PostgreSQL metrics
CREATE TABLE control_center.postgres_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_name TEXT NOT NULL,
  size_mb DECIMAL(12,2),
  active_connections INTEGER,
  idle_connections INTEGER,
  max_connections INTEGER,
  slow_queries INTEGER,
  transactions_per_second DECIMAL(10,2),
  cache_hit_ratio DECIMAL(5,2),
  locks_count INTEGER,
  deadlocks_count INTEGER,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supabase metrics
CREATE TABLE control_center.supabase_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_users INTEGER,
  realtime_connections INTEGER,
  storage_objects INTEGER,
  api_requests_1h INTEGER,
  api_errors_1h INTEGER,
  edge_invocations_1h INTEGER,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MinIO buckets
CREATE TABLE control_center.minio_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_name TEXT NOT NULL,
  product_id UUID REFERENCES control_center.products(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES control_center.organizations(id) ON DELETE SET NULL,
  total_objects INTEGER,
  size_mb DECIMAL(12,2),
  public_url TEXT,
  status TEXT DEFAULT 'active',
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WhatsApp instances
CREATE TABLE control_center.whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES control_center.organizations(id) ON DELETE CASCADE,
  workspace_id UUID,
  instance_name TEXT NOT NULL,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('connected','disconnected','qr_required','pairing','banned','error','unknown')),
  connection_state TEXT,
  qr_required BOOLEAN DEFAULT FALSE,
  phone_connected TEXT,
  last_connected_at TIMESTAMPTZ,
  last_disconnected_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  messages_sent_24h INTEGER DEFAULT 0,
  messages_received_24h INTEGER DEFAULT 0,
  failed_messages_24h INTEGER DEFAULT 0,
  uptime_percent DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API health checks
CREATE TABLE control_center.api_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES control_center.services(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  method TEXT DEFAULT 'GET',
  status_code INTEGER,
  response_time_ms INTEGER,
  is_online BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usage events (from products)
CREATE TABLE control_center.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES control_center.organizations(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES control_center.workspaces(id) ON DELETE SET NULL,
  product_id UUID REFERENCES control_center.products(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','error','critical')),
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alerts
CREATE TABLE control_center.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES control_center.organizations(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES control_center.workspaces(id) ON DELETE SET NULL,
  product_id UUID REFERENCES control_center.products(id) ON DELETE SET NULL,
  service_id UUID REFERENCES control_center.services(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','error','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved','ignored')),
  source TEXT,
  payload JSONB DEFAULT '{}',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Support tickets
CREATE TABLE control_center.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES control_center.organizations(id) ON DELETE CASCADE,
  workspace_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting_customer','resolved','closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  category TEXT,
  channel TEXT NOT NULL DEFAULT 'ticket' CHECK (channel IN ('whatsapp','ticket','email','chat')),
  assigned_to UUID,
  sla_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Support messages
CREATE TABLE control_center.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES control_center.support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  sender_id UUID,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_internal_note BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE control_center.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES control_center.organizations(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','quarterly','semiannual','annual')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','trial','overdue','cancelled')),
  due_day INTEGER,
  next_due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices
CREATE TABLE control_center.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES control_center.organizations(id) ON DELETE CASCADE,
  subscription_id UUID,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled','refunded')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (internal Fluow team)
CREATE TABLE control_center.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES control_center.organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner','admin','infra','suporte','financeiro','viewer')),
  department TEXT,
  team TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs
CREATE TABLE control_center.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES control_center.users(id),
  organization_id UUID REFERENCES control_center.organizations(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE control_center.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES control_center.users(id),
  organization_id UUID REFERENCES control_center.organizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','error','critical')),
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Portainer connections
CREATE TABLE control_center.portainer_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Knowledge articles
CREATE TABLE control_center.knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workspaces_organization ON control_center.workspaces(organization_id);
CREATE INDEX idx_workspaces_product ON control_center.workspaces(product_id);
CREATE INDEX idx_services_product ON control_center.services(product_id);
CREATE INDEX idx_usage_events_organization ON control_center.usage_events(organization_id);
CREATE INDEX idx_usage_events_product ON control_center.usage_events(product_id);
CREATE INDEX idx_usage_events_severity ON control_center.usage_events(severity);
CREATE INDEX idx_usage_events_created ON control_center.usage_events(created_at DESC);
CREATE INDEX idx_alerts_organization ON control_center.alerts(organization_id);
CREATE INDEX idx_alerts_status ON control_center.alerts(status);
CREATE INDEX idx_alerts_severity ON control_center.alerts(severity);
CREATE INDEX idx_alerts_source ON control_center.alerts(source);
CREATE INDEX idx_tickets_organization ON control_center.support_tickets(organization_id);
CREATE INDEX idx_tickets_status ON control_center.support_tickets(status);
CREATE INDEX idx_tickets_assigned ON control_center.support_tickets(assigned_to);
CREATE INDEX idx_messages_ticket ON control_center.support_messages(ticket_id);
CREATE INDEX idx_invoices_organization ON control_center.invoices(organization_id);
CREATE INDEX idx_invoices_status ON control_center.invoices(status);
CREATE INDEX idx_invoices_due ON control_center.invoices(due_date);
CREATE INDEX idx_audit_logs_user ON control_center.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON control_center.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON control_center.audit_logs(created_at DESC);
CREATE INDEX idx_notifications_user ON control_center.notifications(user_id);
CREATE INDEX idx_notifications_read ON control_center.notifications(read_at);
CREATE INDEX idx_whatsapp_organization ON control_center.whatsapp_instances(organization_id);
CREATE INDEX idx_whatsapp_status ON control_center.whatsapp_instances(status);
CREATE INDEX idx_minio_buckets_product ON control_center.minio_buckets(product_id);
CREATE INDEX idx_minio_buckets_organization ON control_center.minio_buckets(organization_id);
CREATE INDEX idx_infrastructure_metrics_collected ON control_center.infrastructure_metrics(collected_at DESC);
CREATE INDEX idx_postgres_metrics_collected ON control_center.postgres_metrics(collected_at DESC);
CREATE INDEX idx_docker_containers_state ON control_center.docker_containers(state);
CREATE INDEX idx_api_health_checks_service ON control_center.api_health_checks(service_id);
