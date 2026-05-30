interface SupabaseAllMetrics {
  authUsers: number
  realtimeConnections: number
  storageObjects: number
  apiRequests1h: number
  apiErrors1h: number
  edgeInvocations1h: number
}

export class SupabaseService {
  private baseUrl: string
  private serviceKey: string

  constructor() {
    this.baseUrl = process.env.SUPABASE_URL || ''
    this.serviceKey = process.env.SUPABASE_SERVICE_KEY || ''
  }

  private get managementUrl(): string {
    return `${this.baseUrl.replace(/\/$/, '')}`
  }

  private async managementFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
    if (!this.baseUrl || !this.serviceKey) {
      console.warn('[SupabaseService] SUPABASE_URL or SUPABASE_SERVICE_KEY not configured')
      return null
    }

    try {
      const response = await fetch(`${this.managementUrl}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.serviceKey,
          'Authorization': `Bearer ${this.serviceKey}`,
          ...options?.headers,
        },
      })

      if (!response.ok) {
        console.warn(`[SupabaseService] HTTP ${response.status} on ${path}`)
        return null
      }

      return response.json() as Promise<T>
    } catch (error) {
      console.error(`[SupabaseService] request to ${path} failed:`, error)
      return null
    }
  }

  async getAuthUsers(): Promise<number> {
    try {
      const data = await this.managementFetch<{ total_users: number }>(
        '/rest/v1/users?select=count'
      )
      if (data && typeof data.total_users === 'number') return data.total_users

      const count = await this.managementFetch<number>(
        '/rest/v1/users?select=id&head=true&limit=0'
      )
      return count ?? 0
    } catch {
      return 0
    }
  }

  async getRealtimeConnections(): Promise<number> {
    try {
      const data = await this.managementFetch<Array<{ count: number }>>(
        '/rest/v1/realtime?select=count'
      )
      return data?.[0]?.count ?? 0
    } catch {
      return 0
    }
  }

  async getStorageObjects(): Promise<number> {
    try {
      const objects = await this.managementFetch<Array<{ name: string }>>(
        '/storage/v1/object/list/public'
      )
      return Array.isArray(objects) ? objects.length : 0
    } catch {
      return 0
    }
  }

  async getApiRequests(duration = '1h'): Promise<{ requests: number; errors: number }> {
    try {
      const data = await this.managementFetch<{ count: number }>(
        `/rest/v1/analytics?duration=${duration}`
      )
      return { requests: data?.count ?? 0, errors: 0 }
    } catch {
      return { requests: 0, errors: 0 }
    }
  }

  async getAllMetrics(): Promise<SupabaseAllMetrics> {
    const defaultMetrics: SupabaseAllMetrics = {
      authUsers: 0,
      realtimeConnections: 0,
      storageObjects: 0,
      apiRequests1h: 0,
      apiErrors1h: 0,
      edgeInvocations1h: 0,
    }

    try {
      const [authUsers, realtimeConnections, storageObjects, apiRequests] = await Promise.all([
        this.getAuthUsers(),
        this.getRealtimeConnections(),
        this.getStorageObjects(),
        this.getApiRequests('1h'),
      ])

      return {
        authUsers,
        realtimeConnections,
        storageObjects,
        apiRequests1h: apiRequests.requests,
        apiErrors1h: apiRequests.errors,
        edgeInvocations1h: 0,
      }
    } catch (error) {
      console.error('[SupabaseService] getAllMetrics failed:', error)
      return defaultMetrics
    }
  }
}
