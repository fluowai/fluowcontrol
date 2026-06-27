// Supabase Management API Service
// Docs: https://api.supabase.com/api/v1

const MANAGEMENT_URL = 'https://api.supabase.com/v1'

function getToken(): string {
  return process.env.SUPABASE_MANAGEMENT_TOKEN || ''
}

function getOrgId(): string {
  return process.env.SUPABASE_ORG_ID || ''
}

async function managementFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  const token = getToken()
  if (!token) {
    console.warn('[SupabaseManagement] SUPABASE_MANAGEMENT_TOKEN not configured')
    return null
  }

  try {
    const response = await fetch(`${MANAGEMENT_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const body = await response.text()
      console.warn(`[SupabaseManagement] HTTP ${response.status} on ${path}: ${body}`)
      return null
    }

    return response.json() as Promise<T>
  } catch (error) {
    console.error(`[SupabaseManagement] Request to ${path} failed:`, error)
    return null
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SupabaseProject {
  id: string
  name: string
  organization_id: string
  region: string
  status: string
  database: {
    host: string
    version: string
  }
  created_at: string
}

export interface SupabaseOrgUsage {
  period_start: string
  period_end: string
  usages: Array<{
    metric: string
    usage: number
    limit: number
    unlimited: boolean
    capped: boolean
    available_in_plan: boolean
  }>
}

export interface ProjectMetrics {
  projectId: string
  projectName: string
  region: string
  status: string
  dbHost: string
  dbVersion: string
  createdAt: string
  authUsers: number | null
  storageSize: number | null
  bandwidthGb: number | null
  apiRequests: number | null
  realtimeConnections: number | null
  functionInvocations: number | null
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class SupabaseManagementService {

  async getAllMetrics(): Promise<{
    authUsers: number | null
    realtimeConnections: number | null
    storageObjects: number | null
    apiRequests1h: number | null
    apiErrors1h: number | null
    edgeInvocations1h: number | null
  }> {
    const projects = await this.listProjects()
    const allMetrics = await this.getAllProjectsMetrics()
    const total = allMetrics.reduce(
      (acc, m) => ({
        authUsers: (acc.authUsers ?? 0) + (m.authUsers ?? 0),
        realtimeConnections: (acc.realtimeConnections ?? 0) + (m.realtimeConnections ?? 0),
        storageObjects: (acc.storageSize ?? 0) + (m.storageSize ?? 0),
        apiRequests1h: (acc.apiRequests1h ?? 0) + (m.apiRequests ?? 0),
        apiErrors1h: acc.apiErrors1h ?? null,
        edgeInvocations1h: (acc.edgeInvocations1h ?? 0) + (m.functionInvocations ?? 0),
      }),
      {} as any
    )
    return {
      authUsers: total.authUsers ?? null,
      realtimeConnections: total.realtimeConnections ?? null,
      storageObjects: total.storageObjects ?? null,
      apiRequests1h: total.apiRequests1h ?? null,
      apiErrors1h: total.apiErrors1h ?? null,
      edgeInvocations1h: total.edgeInvocations1h ?? null,
    }
  }

  async listProjects(): Promise<SupabaseProject[]> {
    const projects = await managementFetch<SupabaseProject[]>('/projects')
    return projects ?? []
  }

  async getProject(projectId: string): Promise<SupabaseProject | null> {
    return managementFetch<SupabaseProject>(`/projects/${projectId}`)
  }

  async createProject(data: {
    name: string
    organizationId?: string
    plan?: 'free' | 'pro'
    region?: string
    dbPass: string
  }): Promise<SupabaseProject | null> {
    const orgId = data.organizationId || getOrgId()
    if (!orgId) {
      throw new Error('SUPABASE_ORG_ID não configurado. Configure a variável de ambiente.')
    }

    return managementFetch<SupabaseProject>('/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        organization_id: orgId,
        plan: data.plan ?? 'free',
        region: data.region ?? 'sa-east-1',
        db_pass: data.dbPass,
      }),
    })
  }

  async pauseProject(projectId: string): Promise<boolean> {
    const result = await managementFetch<any>(`/projects/${projectId}/pause`, { method: 'POST' })
    return result !== null
  }

  async restoreProject(projectId: string): Promise<boolean> {
    const result = await managementFetch<any>(`/projects/${projectId}/restore`, { method: 'POST' })
    return result !== null
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const result = await managementFetch<any>(`/projects/${projectId}`, { method: 'DELETE' })
    return result !== null
  }

  async getOrgUsage(): Promise<SupabaseOrgUsage | null> {
    const orgId = getOrgId()
    if (!orgId) return null
    return managementFetch<SupabaseOrgUsage>(`/organizations/${orgId}/usage`)
  }

  async getProjectMetrics(projectId: string): Promise<ProjectMetrics | null> {
    const [project, usageData] = await Promise.all([
      this.getProject(projectId),
      managementFetch<any>(`/projects/${projectId}/usage`).catch(() => null),
    ])

    if (!project) return null

    const usage = usageData?.usages ?? []
    const getUsage = (metric: string) => {
      const entry = usage.find((u: any) => u.metric?.toLowerCase().includes(metric))
      return entry ? entry.usage : null
    }

    return {
      projectId: project.id,
      projectName: project.name,
      region: project.region,
      status: project.status,
      dbHost: project.database?.host ?? '',
      dbVersion: project.database?.version ?? '',
      createdAt: project.created_at,
      authUsers: getUsage('auth'),
      storageSize: getUsage('storage'),
      bandwidthGb: getUsage('bandwidth'),
      apiRequests: getUsage('api_requests'),
      realtimeConnections: getUsage('realtime'),
      functionInvocations: getUsage('function'),
    }
  }

  async getAllProjectsMetrics(): Promise<ProjectMetrics[]> {
    const projects = await this.listProjects()
    const metrics = await Promise.all(projects.map(p => this.getProjectMetrics(p.id).catch(() => null)))
    return metrics.filter(Boolean) as ProjectMetrics[]
  }

  async getOrganizations(): Promise<any[]> {
    const orgs = await managementFetch<any[]>('/organizations')
    return orgs ?? []
  }
}

export const SupabaseService = SupabaseManagementService
