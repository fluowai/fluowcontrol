import { PrismaClient } from '@prisma/client'
import type { WhatsAppStatus } from '../types/index.js'

const prisma = new PrismaClient()

interface WhatsAppInstanceResponse {
  id: string
  organizationId: string
  workspaceId: string | null
  instanceName: string
  phoneNumber: string | null
  status: WhatsAppStatus
  connectionState: string | null
  qrRequired: boolean
  phoneConnected: string | null
  lastConnectedAt: Date | null
  lastDisconnectedAt: Date | null
  lastMessageAt: Date | null
  messagesSent24h: number
  messagesReceived24h: number
  failedMessages24h: number
  uptimePercent: number | null
  createdAt: Date
}

interface ConnectionStats {
  connected: number
  disconnected: number
  qrRequired: number
  pairing: number
  banned: number
  error: number
  unknown: number
  total: number
}

interface WebhookEvent {
  instanceName: string
  event: string
  payload?: Record<string, unknown>
  timestamp?: string
}

export class WhatsAppService {
  async getInstances(): Promise<WhatsAppInstanceResponse[]> {
    try {
      const instances = await prisma.whatsAppInstance.findMany({
        orderBy: { createdAt: 'desc' },
        include: { organization: { select: { name: true } } },
      })

      return instances.map((inst) => ({
        id: inst.id,
        organizationId: inst.organizationId,
        workspaceId: inst.workspaceId,
        instanceName: inst.instanceName,
        phoneNumber: inst.phoneNumber,
        status: inst.status as WhatsAppStatus,
        connectionState: inst.connectionState,
        qrRequired: inst.qrRequired,
        phoneConnected: inst.phoneConnected,
        lastConnectedAt: inst.lastConnectedAt,
        lastDisconnectedAt: inst.lastDisconnectedAt,
        lastMessageAt: inst.lastMessageAt,
        messagesSent24h: inst.messagesSent24h || 0,
        messagesReceived24h: inst.messagesReceived24h || 0,
        failedMessages24h: inst.failedMessages24h || 0,
        uptimePercent: inst.uptimePercent ? Number(inst.uptimePercent) : null,
        createdAt: inst.createdAt,
      }))
    } catch (error) {
      console.error('[WhatsAppService] getInstances failed:', error)
      return []
    }
  }

  async getInstance(id: string): Promise<WhatsAppInstanceResponse | null> {
    try {
      const inst = await prisma.whatsAppInstance.findUnique({ where: { id } })
      if (!inst) return null

      return {
        id: inst.id,
        organizationId: inst.organizationId,
        workspaceId: inst.workspaceId,
        instanceName: inst.instanceName,
        phoneNumber: inst.phoneNumber,
        status: inst.status as WhatsAppStatus,
        connectionState: inst.connectionState,
        qrRequired: inst.qrRequired,
        phoneConnected: inst.phoneConnected,
        lastConnectedAt: inst.lastConnectedAt,
        lastDisconnectedAt: inst.lastDisconnectedAt,
        lastMessageAt: inst.lastMessageAt,
        messagesSent24h: inst.messagesSent24h || 0,
        messagesReceived24h: inst.messagesReceived24h || 0,
        failedMessages24h: inst.failedMessages24h || 0,
        uptimePercent: inst.uptimePercent ? Number(inst.uptimePercent) : null,
        createdAt: inst.createdAt,
      }
    } catch (error) {
      console.error(`[WhatsAppService] getInstance(${id}) failed:`, error)
      return null
    }
  }

  async getInstancesByOrganization(orgId: string): Promise<WhatsAppInstanceResponse[]> {
    try {
      const instances = await prisma.whatsAppInstance.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      })

      return instances.map((inst) => ({
        id: inst.id,
        organizationId: inst.organizationId,
        workspaceId: inst.workspaceId,
        instanceName: inst.instanceName,
        phoneNumber: inst.phoneNumber,
        status: inst.status as WhatsAppStatus,
        connectionState: inst.connectionState,
        qrRequired: inst.qrRequired,
        phoneConnected: inst.phoneConnected,
        lastConnectedAt: inst.lastConnectedAt,
        lastDisconnectedAt: inst.lastDisconnectedAt,
        lastMessageAt: inst.lastMessageAt,
        messagesSent24h: inst.messagesSent24h || 0,
        messagesReceived24h: inst.messagesReceived24h || 0,
        failedMessages24h: inst.failedMessages24h || 0,
        uptimePercent: inst.uptimePercent ? Number(inst.uptimePercent) : null,
        createdAt: inst.createdAt,
      }))
    } catch (error) {
      console.error(`[WhatsAppService] getInstancesByOrganization(${orgId}) failed:`, error)
      return []
    }
  }

  async getConnectionStats(): Promise<ConnectionStats> {
    const stats: ConnectionStats = {
      connected: 0,
      disconnected: 0,
      qrRequired: 0,
      pairing: 0,
      banned: 0,
      error: 0,
      unknown: 0,
      total: 0,
    }

    try {
      const groups = await prisma.whatsAppInstance.groupBy({
        by: ['status'],
        _count: { id: true },
      })

      for (const group of groups) {
        const status = group.status as keyof ConnectionStats
        if (status in stats) {
          stats[status] = group._count.id
        } else {
          stats.unknown += group._count.id
        }
        stats.total += group._count.id
      }

      return stats
    } catch (error) {
      console.error('[WhatsAppService] getConnectionStats failed:', error)
      return stats
    }
  }

  async getMessagesSent24h(): Promise<number> {
    try {
      const result = await prisma.whatsAppInstance.aggregate({
        _sum: { messagesSent24h: true },
      })
      return result._sum.messagesSent24h || 0
    } catch (error) {
      console.error('[WhatsAppService] getMessagesSent24h failed:', error)
      return 0
    }
  }

  async getMessagesReceived24h(): Promise<number> {
    try {
      const result = await prisma.whatsAppInstance.aggregate({
        _sum: { messagesReceived24h: true },
      })
      return result._sum.messagesReceived24h || 0
    } catch (error) {
      console.error('[WhatsAppService] getMessagesReceived24h failed:', error)
      return 0
    }
  }

  async getFailedMessages24h(): Promise<number> {
    try {
      const result = await prisma.whatsAppInstance.aggregate({
        _sum: { failedMessages24h: true },
      })
      return result._sum.failedMessages24h || 0
    } catch (error) {
      console.error('[WhatsAppService] getFailedMessages24h failed:', error)
      return 0
    }
  }

  async getInstancesNeedingAttention(): Promise<WhatsAppInstanceResponse[]> {
    try {
      const instances = await prisma.whatsAppInstance.findMany({
        where: {
          status: {
            in: ['disconnected', 'qr_required', 'banned'],
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      return instances.map((inst) => ({
        id: inst.id,
        organizationId: inst.organizationId,
        workspaceId: inst.workspaceId,
        instanceName: inst.instanceName,
        phoneNumber: inst.phoneNumber,
        status: inst.status as WhatsAppStatus,
        connectionState: inst.connectionState,
        qrRequired: inst.qrRequired,
        phoneConnected: inst.phoneConnected,
        lastConnectedAt: inst.lastConnectedAt,
        lastDisconnectedAt: inst.lastDisconnectedAt,
        lastMessageAt: inst.lastMessageAt,
        messagesSent24h: inst.messagesSent24h || 0,
        messagesReceived24h: inst.messagesReceived24h || 0,
        failedMessages24h: inst.failedMessages24h || 0,
        uptimePercent: inst.uptimePercent ? Number(inst.uptimePercent) : null,
        createdAt: inst.createdAt,
      }))
    } catch (error) {
      console.error('[WhatsAppService] getInstancesNeedingAttention failed:', error)
      return []
    }
  }

  async ingestWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      const instance = await prisma.whatsAppInstance.findFirst({
        where: { instanceName: event.instanceName },
      })

      if (!instance) {
        console.warn(`[WhatsAppService] Unknown instance: ${event.instanceName}`)
        return
      }

      const updateData: Record<string, unknown> = {}

      switch (event.event) {
        case 'connection.update': {
          const state = event.payload?.state as string | undefined
          if (state) {
            updateData.connectionState = state
            updateData.status = this.mapWooApiState(state)
          }
          if (state === 'open') {
            updateData.lastConnectedAt = new Date()
            updateData.qrRequired = false
          }
          break
        }
        case 'messages.upsert': {
          updateData.lastMessageAt = new Date()
          const msgType = event.payload?.messageType as string | undefined
          if (msgType === 'sent') {
            updateData.messagesSent24h = (instance.messagesSent24h || 0) + 1
          } else if (msgType === 'received') {
            updateData.messagesReceived24h = (instance.messagesReceived24h || 0) + 1
          }
          break
        }
        case 'messages.error': {
          updateData.failedMessages24h = (instance.failedMessages24h || 0) + 1
          break
        }
        case 'qr.updated': {
          updateData.qrRequired = true
          updateData.status = 'qr_required'
          break
        }
        case 'disconnected': {
          updateData.lastDisconnectedAt = new Date()
          updateData.status = 'disconnected'
          break
        }
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.whatsAppInstance.update({
          where: { id: instance.id },
          data: updateData,
        })
      }
    } catch (error) {
      console.error('[WhatsAppService] ingestWebhookEvent failed:', error)
    }
  }

  private mapWooApiState(state: string): WhatsAppStatus {
    const map: Record<string, WhatsAppStatus> = {
      open: 'connected',
      close: 'disconnected',
      connecting: 'pairing',
      syncing: 'pairing',
      'qr-read': 'qr_required',
    }
    return map[state] || 'unknown'
  }
}
