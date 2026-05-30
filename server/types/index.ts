export type OrganizationStatus = 'active' | 'trial' | 'suspended' | 'cancelled' | 'overdue'
export type ProductStatus = 'active' | 'inactive' | 'maintenance'
export type WorkspaceStatus = 'active' | 'suspended' | 'creating' | 'deleting'
export type ServiceStatus = 'online' | 'offline' | 'degraded' | 'unknown'
export type ServiceType = 'frontend' | 'backend' | 'worker' | 'database' | 'storage' | 'whatsapp' | 'api' | 'queue' | 'cache'
export type ContainerState = 'running' | 'exited' | 'restarting' | 'paused' | 'removing' | 'dead' | 'created'
export type WhatsAppStatus = 'connected' | 'disconnected' | 'qr_required' | 'pairing' | 'banned' | 'error' | 'unknown'
export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketChannel = 'whatsapp' | 'ticket' | 'email' | 'chat'
export type EventSeverity = 'info' | 'warning' | 'error' | 'critical'
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'ignored'
export type SubscriptionStatus = 'active' | 'trial' | 'overdue' | 'cancelled'
export type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
export type UserRole = 'owner' | 'admin' | 'infra' | 'suporte' | 'financeiro' | 'viewer'
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface JwtPayload {
  userId: string
  email: string
  role: UserRole
  organizationId?: string
}

export interface EventPayload {
  organization_id?: string
  workspace_id?: string
  product_slug: string
  event_type: string
  event_name: string
  severity: EventSeverity
  payload: Record<string, unknown>
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down'
  product: string
  version: string
  database: 'ok' | 'error'
  queue: 'ok' | 'error'
  uptime: number
}

export interface PaginationParams {
  page: number
  limit: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  error: string
  code: string
  details?: unknown
}

export interface AuditLogEntry {
  userId: string
  organizationId?: string
  action: string
  entityType: string
  entityId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}
