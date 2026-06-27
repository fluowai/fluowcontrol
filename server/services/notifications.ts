import prisma from '../lib/prisma.js'
import type { NotificationSeverity, UserRole } from '../types/index.js'

interface NotificationResponse {
  id: string
  userId: string
  organizationId: string | null
  title: string
  message: string | null
  severity: NotificationSeverity
  link: string | null
  readAt: Date | null
  createdAt: Date
}

export class NotificationService {
  async createNotification(
    userId: string,
    title: string,
    message?: string,
    severity?: NotificationSeverity,
    link?: string,
    organizationId?: string
  ): Promise<NotificationResponse | null> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message: message || null,
          severity: severity || 'info',
          link: link || null,
          organizationId: organizationId || null,
        },
      })

      return this.toResponse(notification)
    } catch (error) {
      console.error('[NotificationService] createNotification failed:', error)
      return null
    }
  }

  async getNotifications(userId: string, unreadOnly = false): Promise<NotificationResponse[]> {
    try {
      const where: Record<string, unknown> = { userId }
      if (unreadOnly) {
        where.readAt = null
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      })

      return notifications.map(this.toResponse)
    } catch (error) {
      console.error('[NotificationService] getNotifications failed:', error)
      return []
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      })
      return true
    } catch (error) {
      console.error(`[NotificationService] markAsRead(${notificationId}) failed:`, error)
      return false
    }
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      })
      return true
    } catch (error) {
      console.error(`[NotificationService] markAllAsRead(${userId}) failed:`, error)
      return false
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: { userId, readAt: null },
      })
    } catch (error) {
      console.error(`[NotificationService] getUnreadCount(${userId}) failed:`, error)
      return 0
    }
  }

  async broadcastToRole(
    role: UserRole,
    title: string,
    message?: string,
    severity?: NotificationSeverity
  ): Promise<number> {
    try {
      const users = await prisma.user.findMany({
        where: { role, isActive: true },
        select: { id: true },
      })

      if (users.length === 0) return 0

      const notifications = users.map((user) => ({
        userId: user.id,
        title,
        message: message || null,
        severity: severity || 'info',
        link: null,
        organizationId: null,
      }))

      await prisma.notification.createMany({ data: notifications })
      return notifications.length
    } catch (error) {
      console.error(`[NotificationService] broadcastToRole(${role}) failed:`, error)
      return 0
    }
  }

  async notifyTeam(
    team: string,
    title: string,
    message?: string,
    severity?: NotificationSeverity
  ): Promise<number> {
    try {
      const users = await prisma.user.findMany({
        where: { team, isActive: true },
        select: { id: true },
      })

      if (users.length === 0) return 0

      const notifications = users.map((user) => ({
        userId: user.id,
        title,
        message: message || null,
        severity: severity || 'info',
        link: null,
        organizationId: null,
      }))

      await prisma.notification.createMany({ data: notifications })
      return notifications.length
    } catch (error) {
      console.error(`[NotificationService] notifyTeam(${team}) failed:`, error)
      return 0
    }
  }

  private toResponse(notification: {
    id: string
    userId: string
    organizationId: string | null
    title: string
    message: string | null
    severity: string
    link: string | null
    readAt: Date | null
    createdAt: Date
  }): NotificationResponse {
    return {
      id: notification.id,
      userId: notification.userId,
      organizationId: notification.organizationId,
      title: notification.title,
      message: notification.message,
      severity: notification.severity as NotificationSeverity,
      link: notification.link,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    }
  }
}
