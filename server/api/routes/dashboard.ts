import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const prisma = new PrismaClient()
const router = Router()

export function registerRoutes(app: import('express').Express) {
  router.get('/kpi', authenticateToken, async (_req: AuthRequest, res) => {
    try {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const [
        activeClients,
        subscriptionsAgg,
        totalSubs,
        cancelledSubs,
        resolvedWithSla,
        slaBreachedOpen,
        recentResolved,
        ticketsByStatus,
        alertsOpen,
      ] = await Promise.all([
        prisma.organization.count({ where: { status: 'active' } }),
        prisma.subscription.aggregate({
          _sum: { amount: true },
          where: { status: { in: ['active', 'trial'] } },
        }),
        prisma.subscription.count(),
        prisma.subscription.count({ where: { status: 'cancelled' } }),
        prisma.supportTicket.findMany({
          where: { status: 'resolved', slaDueAt: { not: null }, closedAt: { not: null } },
          select: { closedAt: true, slaDueAt: true },
          take: 100,
        }),
        prisma.supportTicket.count({
          where: { status: { in: ['open', 'in_progress', 'waiting_customer'] }, slaDueAt: { lt: now } },
        }),
        prisma.supportTicket.findMany({
          where: { status: 'resolved', closedAt: { not: null }, createdAt: { not: null } },
          select: { createdAt: true, closedAt: true },
          orderBy: { closedAt: 'desc' },
          take: 100,
        }),
        prisma.supportTicket.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        prisma.alert.count({ where: { status: 'open' } }),
      ])

      const churnRate = cancelledSubs / Math.max(totalSubs + cancelledSubs, 1)

      const ticketsMap = Object.fromEntries(
        ticketsByStatus.map((t) => [t.status, t._count.id])
      )

      const totalResolved = ticketsMap['resolved'] ?? 0
      const inSla = resolvedWithSla.filter(
        (t) => t.closedAt!.getTime() <= t.slaDueAt!.getTime()
      ).length
      const slaCompliance =
        resolvedWithSla.length > 0 ? (inSla / resolvedWithSla.length) * 100 : 100

      const resolutionTimes = recentResolved
        .map((t) => t.closedAt!.getTime() - t.createdAt.getTime())
        .filter((d) => d > 0)
      const avgResolutionHours =
        resolutionTimes.length > 0
          ? Math.round((resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) / 3600000)
          : null

      return res.json({
        activeClients,
        mrr: Number(subscriptionsAgg._sum.amount ?? 0),
        arr: Number(subscriptionsAgg._sum.amount ?? 0) * 12,
        churnRate: Math.round(churnRate * 10000) / 100,
        avgTicketResolution: avgResolutionHours,
        slaCompliance: Math.round(slaCompliance * 100) / 100,
        slaBreachedOpen: slaBreachedOpen,
        openTickets: ticketsMap['open'] ?? 0,
        inProgressTickets: ticketsMap['in_progress'] ?? 0,
        openAlerts: alertsOpen,
        totalTickets: ticketsByStatus.reduce((s, t) => s + t._count.id, 0),
        newTickets7d: await prisma.supportTicket.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
      })
    } catch {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/timeline', authenticateToken, async (_req: AuthRequest, res) => {
    try {
      const [tickets, alerts, invoices] = await Promise.all([
        prisma.supportTicket.findMany({
          take: 10,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            organization: { select: { id: true, name: true } },
          },
        }),
        prisma.alert.findMany({
          take: 10,
          orderBy: { lastSeenAt: 'desc' },
          select: {
            id: true,
            title: true,
            severity: true,
            status: true,
            lastSeenAt: true,
            organization: { select: { id: true, name: true } },
          },
        }),
        prisma.invoice.findMany({
          take: 10,
          orderBy: { paidAt: { sort: 'desc', nulls: 'last' } },
          select: {
            id: true,
            amount: true,
            status: true,
            paidAt: true,
            dueDate: true,
            organization: { select: { id: true, name: true } },
          },
        }),
      ])

      const events: Array<{
        id: string
        type: string
        title: string
        description: string
        organizationId: string
        organizationName: string
        timestamp: string
      }> = []

      for (const ticket of tickets) {
        events.push({
          id: ticket.id,
          type: 'ticket',
          title: ticket.title,
          description: `Ticket ${ticket.status.replace('_', ' ')}`,
          organizationId: ticket.organization.id,
          organizationName: ticket.organization.name,
          timestamp: ticket.updatedAt.toISOString(),
        })
      }

      for (const alert of alerts) {
        events.push({
          id: alert.id,
          type: 'alert',
          title: alert.title,
          description: `Alerta ${alert.severity} - ${alert.status}`,
          organizationId: alert.organization.id,
          organizationName: alert.organization.name,
          timestamp: alert.lastSeenAt.toISOString(),
        })
      }

      for (const invoice of invoices) {
        if (invoice.paidAt) {
          events.push({
            id: invoice.id,
            type: 'payment',
            title: `Pagamento ${invoice.status}`,
            description: `R$ ${Number(invoice.amount).toFixed(2)}`,
            organizationId: invoice.organization.id,
            organizationName: invoice.organization.name,
            timestamp: invoice.paidAt.toISOString(),
          })
        }
      }

      events.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      return res.json(events.slice(0, 20))
    } catch {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/upcoming', authenticateToken, async (_req: AuthRequest, res) => {
    try {
      const now = new Date()
      const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const [invoicesDue, ticketsNearSla, subscriptionsExpiring] = await Promise.all([
        prisma.invoice.findMany({
          where: {
            status: { in: ['pending', 'overdue'] },
            dueDate: { gte: now, lte: sevenDays },
          },
          orderBy: { dueDate: 'asc' },
          include: { organization: { select: { id: true, name: true, email: true } } },
        }),
        prisma.supportTicket.findMany({
          where: {
            status: { in: ['open', 'in_progress', 'waiting_customer'] },
            slaDueAt: { gte: now, lte: sevenDays },
          },
          orderBy: { slaDueAt: 'asc' },
          include: { organization: { select: { id: true, name: true } } },
        }),
        prisma.subscription.findMany({
          where: {
            status: { in: ['active', 'trial'] },
            nextDueDate: { gte: now, lte: sevenDays },
          },
          orderBy: { nextDueDate: 'asc' },
          include: { organization: { select: { id: true, name: true, email: true } } },
        }),
      ])

      return res.json({
        invoicesDue: invoicesDue.map((inv) => ({
          id: inv.id,
          amount: Number(inv.amount),
          dueDate: inv.dueDate.toISOString().slice(0, 10),
          status: inv.status,
          organization: inv.organization,
        })),
        ticketsNearSla: ticketsNearSla.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          slaDueAt: t.slaDueAt?.toISOString(),
          status: t.status,
          organization: t.organization,
        })),
        subscriptionsExpiring: subscriptionsExpiring.map((s) => ({
          id: s.id,
          planName: s.planName,
          amount: Number(s.amount),
          nextDueDate: s.nextDueDate?.toISOString().slice(0, 10),
          status: s.status,
          organization: s.organization,
        })),
      })
    } catch {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/dashboard', router)
}
