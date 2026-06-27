import { PrismaClient } from '@prisma/client'
import { encryptSecret, decryptSecret } from './crypto.js'

const prisma = new PrismaClient()

interface PortainerConfig {
  name: string
  baseUrl: string
  apiKey: string
}

interface PortainerEndpoint {
  Id: number
  Name: string
  URL: string
  Type: number
  Status: number
  Snapshots: Array<{ Time: number; Docker: { Containers: number; Images: number } }>
}

interface PortainerStack {
  Id: number
  Name: string
  Status: number
  EndpointId: number
  Env: Array<{ name: string; value: string }>
}

interface PortainerConnection {
  id: string
  name: string
  baseUrl: string
  status: string
  createdAt: Date
}





export class PortainerService {
  private baseUrl = ''
  private apiKey = ''
  private connected = false

  async connect(config: PortainerConfig): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/api/users`, {
        headers: {
          'X-API-Key': config.apiKey,
        },
      })

      if (!response.ok) {
        return { success: false, message: `Portainer returned HTTP ${response.status}` }
      }

      const existing = await prisma.portainerConnection.findFirst({ where: { name: config.name } })
      if (existing) {
        await prisma.portainerConnection.update({
          where: { id: existing.id },
          data: {
            baseUrl: config.baseUrl,
            apiKeyEncrypted: encryptSecret(config.apiKey) ?? '',
            status: 'active',
          },
        })
      } else {
        await prisma.portainerConnection.create({
          data: {
            name: config.name,
            baseUrl: config.baseUrl,
            apiKeyEncrypted: encryptSecret(config.apiKey) ?? '',
            status: 'active',
          },
        })
      }

      this.baseUrl = config.baseUrl
      this.apiKey = config.apiKey
      this.connected = true

      return { success: true, message: 'Connected to Portainer successfully' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed'
      return { success: false, message }
    }
  }

  async getEndpoints(connectionId?: string): Promise<PortainerEndpoint[]> {
    const loaded = await this.loadConnection(connectionId)
    if (!loaded) return []

    try {
      const response = await fetch(`${this.baseUrl}/api/endpoints`, {
        headers: { 'X-API-Key': this.apiKey },
      })
      if (!response.ok) return []
      return response.json() as Promise<PortainerEndpoint[]>
    } catch {
      return []
    }
  }

  async getStacks(connectionId?: string): Promise<PortainerStack[]> {
    const loaded = await this.loadConnection(connectionId)
    if (!loaded) return []

    try {
      const response = await fetch(`${this.baseUrl}/api/stacks`, {
        headers: { 'X-API-Key': this.apiKey },
      })
      if (!response.ok) return []
      return response.json() as Promise<PortainerStack[]>
    } catch {
      return []
    }
  }

  async getStackStatus(stackId: number, connectionId?: string): Promise<PortainerStack | null> {
    const loaded = await this.loadConnection(connectionId)
    if (!loaded) return null

    try {
      const response = await fetch(`${this.baseUrl}/api/stacks/${stackId}`, {
        headers: { 'X-API-Key': this.apiKey },
      })
      if (!response.ok) return null
      return response.json() as Promise<PortainerStack>
    } catch {
      return null
    }
  }

  async redeployStack(stackId: number, connectionId?: string): Promise<{ success: boolean; message: string }> {
    const loaded = await this.loadConnection(connectionId)
    if (!loaded) return { success: false, message: 'Portainer not connected' }

    try {
      const response = await fetch(`${this.baseUrl}/api/stacks/${stackId}/start`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        return { success: false, message: `HTTP ${response.status}` }
      }

      return { success: true, message: 'Stack redeploy triggered' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Redeploy failed'
      return { success: false, message }
    }
  }

  async getContainerLogsFromPortainer(
    endpointId: number,
    containerId: string,
    connectionId?: string
  ): Promise<string[]> {
    const loaded = await this.loadConnection(connectionId)
    if (!loaded) return []

    try {
      const response = await fetch(
        `${this.baseUrl}/api/endpoints/${endpointId}/docker/containers/${containerId}/logs?stdout=true&stderr=true`,
        { headers: { 'X-API-Key': this.apiKey } }
      )
      if (!response.ok) return []
      const text = await response.text()
      return text.split('\n').filter(Boolean)
    } catch {
      return []
    }
  }

  async getSavedConnections(): Promise<PortainerConnection[]> {
    try {
      const connections = await prisma.portainerConnection.findMany({
        orderBy: { createdAt: 'desc' },
      })
      return connections.map((c) => ({
        id: c.id,
        name: c.name,
        baseUrl: c.baseUrl,
        status: c.status,
        createdAt: c.createdAt,
      }))
    } catch {
      return []
    }
  }

  private async loadConnection(connectionId?: string): Promise<boolean> {
    if (this.connected && !connectionId) return true

    try {
      const id = connectionId
      if (!id) return false

      const conn = await prisma.portainerConnection.findUnique({ where: { id } })
      if (!conn) return false

      this.baseUrl = conn.baseUrl
      this.apiKey = decryptSecret(conn.apiKeyEncrypted) ?? ''
      this.connected = true
      return true
    } catch {
      return false
    }
  }
}
