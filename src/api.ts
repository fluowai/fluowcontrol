const API_BASE = '/api'

let globalApiKey = localStorage.getItem('fluow_backend_api_key') || '';

export const setApiKey = (key: string) => {
  globalApiKey = key;
  localStorage.setItem('fluow_backend_api_key', key);
};

export const getApiKey = () => globalApiKey;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: any = { 'Content-Type': 'application/json', ...options?.headers };
  
  if (globalApiKey) {
    headers['Authorization'] = `Bearer ${globalApiKey}`;
    headers['x-api-key'] = globalApiKey;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Dashboard
  dashboard: {
    kpi: () => request<any>('/dashboard/kpi'),
    timeline: () => request<any>('/dashboard/timeline'),
    upcoming: () => request<any>('/dashboard/upcoming'),
  },

  // Metrics
  metrics: {
    dashboard: () => request<any>('/metrics/dashboard'),
    realtime: () => request<any>('/metrics/realtime'),
    organization: (id: string) => request<any>(`/metrics/organization/${id}`),
    product: (id: string) => request<any>(`/metrics/product/${id}`),
  },

  // Organizations (clients)
  organizations: {
    list: (params?: string) => request<any[]>(`/organizations${params ? `?${params}` : ''}`),
    get: (id: string) => request<any>(`/organizations/${id}`),
    create: (data: any) => request<any>('/organizations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) => request<any>(`/organizations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) => request<void>(`/organizations/${id}`, { method: 'DELETE' }),
    workspaces: (id: string) => request<any[]>(`/organizations/${id}/workspaces`),
    tickets: (id: string) => request<any[]>(`/organizations/${id}/tickets`),
    invoices: (id: string) => request<any[]>(`/organizations/${id}/invoices`),
    alerts: (id: string) => request<any[]>(`/organizations/${id}/alerts`),
    whatsapp: (id: string) => request<any[]>(`/organizations/${id}/whatsapp`),
    usage: (id: string) => request<any>(`/organizations/${id}/usage`),
  },

  // Products
  products: {
    list: () => request<any[]>('/products'),
    get: (id: string) => request<any>(`/products/${id}`),
    create: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggleStatus: (id: string) => request<any>(`/products/${id}/status`, { method: 'PATCH' }),
    workspaces: (id: string) => request<any[]>(`/products/${id}/workspaces`),
    services: (id: string) => request<any[]>(`/products/${id}/services`),
    events: (id: string) => request<any[]>(`/products/${id}/events`),
    metrics: (id: string) => request<any>(`/products/${id}/metrics`),
  },

  // Workspaces
  workspaces: {
    list: (params?: string) => request<any[]>(`/workspaces${params ? `?${params}` : ''}`),
    get: (id: string) => request<any>(`/workspaces/${id}`),
    create: (data: any) => request<any>('/workspaces', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/workspaces/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) => request<any>(`/workspaces/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) => request<void>(`/workspaces/${id}`, { method: 'DELETE' }),
  },

  // Tickets
  tickets: {
    list: (params?: string) => request<any[]>(`/tickets${params ? `?${params}` : ''}`),
    get: (id: string) => request<any>(`/tickets/${id}`),
    create: (data: any) => request<any>('/tickets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) => request<any>(`/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    assign: (id: string, userId: string) => request<any>(`/tickets/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ userId }) }),
    addMessage: (id: string, data: any) => request<any>(`/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify(data) }),
    addNote: (id: string, message: string) => request<any>(`/tickets/${id}/notes`, { method: 'POST', body: JSON.stringify({ message }) }),
    stats: () => request<any>('/tickets/stats'),
  },

  // WhatsApp
  whatsapp: {
    instances: (params?: string) => request<any[]>(`/whatsapp/instances${params ? `?${params}` : ''}`),
    getInstance: (id: string) => request<any>(`/whatsapp/instances/${id}`),
    createInstance: (data: any) => request<any>('/whatsapp/instances', { method: 'POST', body: JSON.stringify(data) }),
    updateInstance: (id: string, data: any) => request<any>(`/whatsapp/instances/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    qrCode: (id: string) => request<any>(`/whatsapp/instances/${id}/qrcode`),
    disconnect: (id: string) => request<any>(`/whatsapp/instances/${id}/disconnect`, { method: 'POST' }),
    reconnect: (id: string) => request<any>(`/whatsapp/instances/${id}/reconnect`, { method: 'POST' }),
    stats: () => request<any>('/whatsapp/stats'),
    needingAttention: () => request<any[]>('/whatsapp/needing-attention'),
  },

  // Financeiro
  financeiro: {
    subscriptions: (params?: string) => request<any[]>(`/financeiro/subscriptions${params ? `?${params}` : ''}`),
    createSubscription: (data: any) => request<any>('/financeiro/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
    cancelSubscription: (id: string) => request<any>(`/financeiro/subscriptions/${id}/cancel`, { method: 'PATCH' }),
    invoices: (params?: string) => request<any[]>(`/financeiro/invoices${params ? `?${params}` : ''}`),
    createInvoice: (data: any) => request<any>('/financeiro/invoices', { method: 'POST', body: JSON.stringify(data) }),
    payInvoice: (id: string) => request<any>(`/financeiro/invoices/${id}/pay`, { method: 'POST' }),
    mrr: () => request<number>('/financeiro/mrr'),
    arr: () => request<number>('/financeiro/arr'),
    overdue: () => request<any[]>('/financeiro/overdue'),
    dashboard: () => request<any>('/financeiro/dashboard'),
  },

  // Infrastructure
  infra: {
    containers: () => request<any[]>('/infra/containers'),
    containerLogs: (id: string) => request<any>(`/infra/containers/${id}/logs`),
    restartContainer: (id: string) => request<any>(`/infra/containers/${id}/restart`, { method: 'POST' }),
    stopContainer: (id: string) => request<any>(`/infra/containers/${id}/stop`, { method: 'POST' }),
    startContainer: (id: string) => request<any>(`/infra/containers/${id}/start`, { method: 'POST' }),
    host: () => request<any>('/infra/host'),
    postgres: () => request<any>('/infra/postgres'),
    supabase: () => request<any>('/infra/supabase'),
    services: () => request<any[]>('/infra/services'),
    dashboard: () => request<any>('/infra/dashboard'),
  },

  // Storage (MinIO)
  storage: {
    buckets: () => request<any[]>('/storage/buckets'),
    bucketDetail: (name: string) => request<any>(`/storage/buckets/${name}`),
    bucketFiles: (name: string) => request<any[]>(`/storage/buckets/${name}/files`),
    usageByClient: () => request<any[]>('/storage/usage-by-client'),
    usageByProduct: () => request<any[]>('/storage/usage-by-product'),
    total: () => request<any>('/storage/total'),
    growth: () => request<any>('/storage/growth'),
    recentFiles: () => request<any[]>('/storage/recent-files'),
    alertBuckets: () => request<any[]>('/storage/alert-buckets'),
  },

  // Users
  users: {
    list: () => request<any[]>('/users'),
    get: (id: string) => request<any>(`/users/${id}`),
    create: (data: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deactivate: (id: string) => request<any>(`/users/${id}/deactivate`, { method: 'PATCH' }),
    notifications: () => request<any[]>('/users/me/notifications'),
    markRead: (id: string) => request<any>(`/users/me/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => request<any>('/users/me/notifications/read-all', { method: 'POST' }),
  },

  // Audit
  audit: {
    list: (params?: string) => request<any[]>(`/audit${params ? `?${params}` : ''}`),
    get: (id: string) => request<any>(`/audit/${id}`),
    stats: () => request<any>('/audit/stats'),
  },

  // Alerts
  alerts: {
    list: (params?: string) => request<any[]>(`/alerts${params ? `?${params}` : ''}`),
    get: (id: string) => request<any>(`/alerts/${id}`),
    acknowledge: (id: string) => request<any>(`/alerts/${id}/acknowledge`, { method: 'PATCH' }),
    resolve: (id: string) => request<any>(`/alerts/${id}/resolve`, { method: 'PATCH' }),
    ignore: (id: string) => request<any>(`/alerts/${id}/ignore`, { method: 'PATCH' }),
    stats: () => request<any>('/alerts/stats'),
    critical: () => request<any[]>('/alerts/critical'),
  },

  // Events
  events: {
    list: (params?: string) => request<any[]>(`/events${params ? `?${params}` : ''}`),
    recent: () => request<any[]>('/events/recent'),
    stats: () => request<any>('/events/stats'),
    send: (data: any) => request<any>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'x-api-key': 'fluow-internal-secret-key-change-in-production' },
    }),
  },

  // AI Copilot
  ai: {
    chat: (message: string, systemContext: any, history?: any[]) =>
      request<{ text: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, systemContext, history }),
      }),
  },

  // Auth
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<any>('/auth/me'),
  },
}
