import { Router } from 'express'
import prisma from '../../lib/prisma.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
const router = Router()

export function registerRoutes(app: import('express').Express) {
  router.get('/dashboard', authenticateToken, async (_req: AuthRequest, res) => {
    try {
      const now = new Date()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const [
        orgsByStatus,
        subscriptionsAgg,
        ticketsByStatus,
        alertsBySeverity,
        alertsOpen,
        invoicesByStatus,
        latestInfra,
        containersByState,
        storageAgg,
        whatsappByStatus,
        whatsappQr,
        latestPostgres,
        latestSupabase,
      ] = await Promise.all([
        prisma.organization.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        prisma.subscription.aggregate({
          _sum: { amount: true },
          where: { status: { in: ['active', 'trial'] } },
        }),
        prisma.supportTicket.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        prisma.alert.groupBy({
          by: ['severity'],
          _count: { id: true },
          where: { status: { not: 'resolved' } },
        }),
        prisma.alert.count({ where: { status: 'open' } }),
        prisma.invoice.groupBy({
          by: ['status'],
          _sum: { amount: true },
          where: { createdAt: { gte: twentyFourHoursAgo } },
        }),
        prisma.infrastructureMetric.findFirst({ orderBy: { collectedAt: 'desc' } }),
        prisma.dockerContainer.groupBy({
          by: ['state'],
          _count: { id: true },
        }),
        prisma.minioBucket.aggregate({
          _sum: { sizeMb: true, totalObjects: true },
          _count: { id: true },
        }),
        prisma.whatsAppInstance.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        prisma.whatsAppInstance.count({ where: { qrRequired: true } }),
        prisma.postgresMetric.findFirst({ orderBy: { collectedAt: 'desc' } }),
        prisma.supabaseMetric.findFirst({ orderBy: { collectedAt: 'desc' } }),
      ])

      const orgsMap = Object.fromEntries(
        orgsByStatus.map((o) => [o.status, o._count.id])
      )

      const mrr = Number(subscriptionsAgg._sum.amount ?? 0)

      const ticketsMap = Object.fromEntries(
        ticketsByStatus.map((t) => [t.status, t._count.id])
      )

      const alertsCritical = alertsBySeverity
        .filter((a) => a.severity === 'critical')
        .reduce((s, a) => s + a._count.id, 0)
      const alertsWarning = alertsBySeverity
        .filter((a) => a.severity === 'warning')
        .reduce((s, a) => s + a._count.id, 0)

      const invoiceMap: Record<string, number> = {}
      for (const inv of invoicesByStatus) {
        invoiceMap[inv.status] = Number(inv._sum.amount ?? 0)
      }

      const containersMap = Object.fromEntries(
        containersByState.map((c) => [c.state, c._count.id])
      )

      const whatsappMap = Object.fromEntries(
        whatsappByStatus.map((w) => [w.status === 'connected' ? 'online' : 'offline', w._count.id])
      )
      const whatsappOnline = whatsappByStatus
        .filter((w) => w.status === 'connected')
        .reduce((s, w) => s + w._count.id, 0)

      return res.json({
        organizations: {
          total: orgsByStatus.reduce((s, o) => s + o._count.id, 0),
          active: orgsMap['active'] ?? 0,
          trial: orgsMap['trial'] ?? 0,
          suspended: orgsMap['suspended'] ?? 0,
          cancelled: orgsMap['cancelled'] ?? 0,
          overdue: orgsMap['overdue'] ?? 0,
        },
        mrr,
        arr: mrr * 12,
        tickets: {
          open: ticketsMap['open'] ?? 0,
          inProgress: ticketsMap['in_progress'] ?? 0,
          resolved: ticketsMap['resolved'] ?? 0,
          total: ticketsByStatus.reduce((s, t) => s + t._count.id, 0),
        },
        alerts: {
          critical: alertsCritical,
          warning: alertsWarning,
          open: alertsOpen,
          total: alertsBySeverity.reduce((s, a) => s + a._count.id, 0),
        },
        revenue: {
          monthly: mrr,
          paid: invoiceMap['paid'] ?? 0,
          overdue: invoiceMap['overdue'] ?? 0,
          pending: invoiceMap['pending'] ?? 0,
        },
        infrastructure: {
          cpu: latestInfra ? Number(latestInfra.cpuPercent) ?? 0 : 0,
          ram: latestInfra ? Number(latestInfra.ramUsedGb) ?? 0 : 0,
          ramTotal: latestInfra ? `${Number(latestInfra.ramTotalGb)} GB` : '0 GB',
          disk: latestInfra ? Number(latestInfra.diskUsedGb) ?? 0 : 0,
          diskTotal: latestInfra ? `${Number(latestInfra.diskTotalGb)} TB` : '0 TB',
          containers: {
            total: containersByState.reduce((s, c) => s + c._count.id, 0),
            running: containersMap['running'] ?? 0,
            exited: containersMap['exited'] ?? 0,
          },
        },
        storage: {
          totalGb: Number(storageAgg._sum.sizeMb ?? 0) / 1024,
          buckets: storageAgg._count.id,
          files: storageAgg._sum.totalObjects ?? 0,
        },
        whatsapp: {
          online: whatsappOnline,
          offline: whatsappByStatus
            .filter((w) => w.status !== 'connected')
            .reduce((s, w) => s + w._count.id, 0),
          qrRequired: whatsappQr,
          total: whatsappByStatus.reduce((s, w) => s + w._count.id, 0),
        },
        postgres: {
          sizeMb: latestPostgres ? Number(latestPostgres.sizeMb) ?? 0 : 0,
          connections: latestPostgres
            ? (latestPostgres.activeConnections ?? 0) + (latestPostgres.idleConnections ?? 0)
            : 0,
          slowQueries: latestPostgres?.slowQueries ?? 0,
        },
        supabase: {
          authUsers: latestSupabase?.authUsers ?? 0,
          apiRequests1h: latestSupabase?.apiRequests1h ?? 0,
          apiErrors1h: latestSupabase?.apiErrors1h ?? 0,
        },
      })
    } catch {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/organization/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params
      const now = new Date()
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const [organization, subscriptions, workspaces, whatsapp, tickets, alerts, invoices, usageAgg] =
        await Promise.all([
          prisma.organization.findUnique({
            where: { id },
            include: {
              _count: {
                select: {
                  workspaces: true,
                  supportTickets: true,
                  alerts: true,
                  subscriptions: true,
                  users: true,
                  invoices: true,
                  whatsappInstances: true,
                },
              },
            },
          }),
          prisma.subscription.findMany({
            where: { organizationId: id },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.workspace.findMany({
            where: { organizationId: id },
            include: { _count: { select: { alerts: true, usageEvents: true } } },
            orderBy: { name: 'asc' },
          }),
          prisma.whatsAppInstance.findMany({
            where: { organizationId: id },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.supportTicket.findMany({
            where: { organizationId: id },
            orderBy: { updatedAt: 'desc' },
            include: { _count: { select: { messages: true } } },
          }),
          prisma.alert.findMany({
            where: { organizationId: id },
            orderBy: { lastSeenAt: 'desc' },
          }),
          prisma.invoice.findMany({
            where: { organizationId: id },
            orderBy: { dueDate: 'desc' },
          }),
          prisma.usageEvent.aggregate({
            _count: { id: true },
            where: { organizationId: id },
          }),
        ])

      if (!organization) {
        return res.status(404).json({ error: 'Organização não encontrada', code: 'NOT_FOUND' })
      }

      const storageMb = await prisma.minioBucket
        .aggregate({
          _sum: { sizeMb: true },
          where: { organizationId: id },
        })
        .then((r) => Number(r._sum.sizeMb ?? 0))

      return res.json({
        organization,
        subscriptions,
        workspaces,
        whatsapp,
        tickets,
        alerts,
        invoices,
        usage: {
          events: usageAgg._count.id,
          storageMb,
          messagesSent: whatsapp.reduce((s, w) => s + (w.messagesSent24h ?? 0), 0),
          messagesReceived: whatsapp.reduce((s, w) => s + (w.messagesReceived24h ?? 0), 0),
        },
      })
    } catch {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/product/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params
      const now = new Date()
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const [product, activeOrganizations, activeWorkspaces, events24h, errors24h, storageAgg, tickets] =
        await Promise.all([
          prisma.product.findUnique({ where: { id } }),
          prisma.workspace.count({
            where: { productId: id, organization: { status: 'active' } },
          }),
          prisma.workspace.count({
            where: { productId: id, status: 'active' },
          }),
          prisma.usageEvent.count({
            where: { productId: id, createdAt: { gte: last24h } },
          }),
          prisma.usageEvent.count({
            where: { productId: id, createdAt: { gte: last24h }, severity: { in: ['error', 'critical'] } },
          }),
          prisma.minioBucket.aggregate({
            _sum: { sizeMb: true },
            where: { productId: id },
          }),
          prisma.supportTicket.findMany({
            where: { organization: { workspaces: { some: { productId: id } } } },
          }),
        ])

      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado', code: 'NOT_FOUND' })
      }

      const services = await prisma.service.findMany({
        where: { productId: id },
        orderBy: { name: 'asc' },
      })

      const containers = await prisma.dockerContainer.findMany({
        where: { name: { in: services.map((s) => s.dockerContainerName).filter(Boolean) as string[] } },
        orderBy: { name: 'asc' },
      })

      return res.json({
        product,
        activeOrganizations,
        activeWorkspaces,
        events24h,
        errors24h,
        services,
        containers,
        storageMb: Number(storageAgg._sum.sizeMb ?? 0),
        tickets: {
          open: tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length,
          total: tickets.length,
        },
      })
    } catch {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/realtime', authenticateToken, async (_req: AuthRequest, res) => {
    try {
      const [
        containersByState,
        alertsCritical,
        alertsOpen,
        whatsappOnline,
        latestInfra,
        activeTickets,
        apiOnline,
        apiOffline,
      ] = await Promise.all([
        prisma.dockerContainer.groupBy({
          by: ['state'],
          _count: { id: true },
        }),
        prisma.alert.count({
          where: { severity: 'critical', status: { not: 'resolved' } },
        }),
        prisma.alert.count({ where: { status: 'open' } }),
        prisma.whatsAppInstance.count({ where: { status: 'connected' } }),
        prisma.infrastructureMetric.findFirst({
          orderBy: { collectedAt: 'desc' },
          select: { cpuPercent: true, ramUsedGb: true },
        }),
        prisma.supportTicket.count({
          where: { status: { in: ['open', 'in_progress', 'waiting_customer'] } },
        }),
        prisma.service.count({ where: { status: 'online' } }),
        prisma.service.count({ where: { status: 'offline' } }),
      ])

      const containersMap = Object.fromEntries(
        containersByState.map((c) => [c.state, c._count.id])
      )

      return res.json({
        containers: {
          total: containersByState.reduce((s, c) => s + c._count.id, 0),
          running: containersMap['running'] ?? 0,
          exited: containersMap['exited'] ?? 0,
        },
        alerts: {
          critical: alertsCritical,
          open: alertsOpen,
        },
        whatsappOnline,
        cpu: latestInfra ? Number(latestInfra.cpuPercent) ?? 0 : 0,
        ram: latestInfra ? Number(latestInfra.ramUsedGb) ?? 0 : 0,
        activeTickets,
        apiOnline,
        apiOffline,
      })
    } catch {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/metrics', router)
}
