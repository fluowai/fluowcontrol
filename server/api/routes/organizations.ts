import { Router } from 'express'
import prisma from '../../lib/prisma.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { requireRole, requireMinimumRole } from '../middleware/rbac.js'
import type { OrganizationStatus } from '../../types/index.js'
const router = Router()

export function registerRoutes(app: import('express').Express) {
  router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
      const status = req.query.status as string | undefined
      const search = req.query.search as string | undefined

      const where: any = {}
      if (status && ['active', 'trial', 'suspended', 'cancelled', 'overdue'].includes(status)) {
        where.status = status
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { document: { contains: search } },
        ]
      }

      const [data, total] = await Promise.all([
        prisma.organization.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { workspaces: true, supportTickets: true, subscriptions: true } },
          },
        }),
        prisma.organization.count({ where }),
      ])

      return res.json({
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: req.params.id },
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
          subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      })

      if (!org) {
        return res.status(404).json({ error: 'Organização não encontrada', code: 'NOT_FOUND' })
      }

      return res.json(org)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { name, legalName, document, email, phone, whatsapp, planId } = req.body

      if (!name) {
        return res.status(400).json({ error: 'Nome é obrigatório', code: 'MISSING_FIELDS' })
      }

      const org = await prisma.organization.create({
        data: {
          name,
          legalName,
          document,
          email,
          phone,
          whatsapp,
          planId,
        },
      })

      return res.status(201).json(org)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.put('/:id', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { name, legalName, document, email, phone, whatsapp, planId } = req.body

      const org = await prisma.organization.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name }),
          ...(legalName !== undefined && { legalName }),
          ...(document !== undefined && { document }),
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone }),
          ...(whatsapp !== undefined && { whatsapp }),
          ...(planId !== undefined && { planId }),
        },
      })

      return res.json(org)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.patch('/:id/status', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { status } = req.body
      const validStatuses: OrganizationStatus[] = ['active', 'suspended', 'cancelled', 'trial', 'overdue']

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Status inválido. Valores válidos: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS',
        })
      }

      const org = await prisma.organization.update({
        where: { id: req.params.id },
        data: { status: status as OrganizationStatus },
      })

      return res.json(org)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.delete('/:id', authenticateToken, requireRole('owner'), async (req: AuthRequest, res) => {
    try {
      await prisma.organization.delete({ where: { id: req.params.id } })
      return res.status(204).send()
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/:id/workspaces', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = await prisma.workspace.findMany({
        where: { organizationId: req.params.id },
        include: { product: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return res.json(data)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/:id/tickets', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))

      const [data, total] = await Promise.all([
        prisma.supportTicket.findMany({
          where: { organizationId: req.params.id },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { messages: true } },
          },
        }),
        prisma.supportTicket.count({ where: { organizationId: req.params.id } }),
      ])

      return res.json({
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/:id/invoices', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))

      const [data, total] = await Promise.all([
        prisma.invoice.findMany({
          where: { organizationId: req.params.id },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.invoice.count({ where: { organizationId: req.params.id } }),
      ])

      return res.json({
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/:id/alerts', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
      const status = req.query.status as string | undefined

      const where: any = { organizationId: req.params.id }
      if (status) where.status = status

      const [data, total] = await Promise.all([
        prisma.alert.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { lastSeenAt: 'desc' },
        }),
        prisma.alert.count({ where }),
      ])

      return res.json({
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/:id/whatsapp', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = await prisma.whatsAppInstance.findMany({
        where: { organizationId: req.params.id },
        orderBy: { createdAt: 'desc' },
      })
      return res.json(data)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/:id/usage', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30
      const since = new Date()
      since.setDate(since.getDate() - days)

      const events = await prisma.usageEvent.groupBy({
        by: ['eventType', 'eventName'],
        where: {
          organizationId: req.params.id,
          createdAt: { gte: since },
        },
        _count: { id: true },
      })

      const total = events.reduce((sum, e) => sum + e._count.id, 0)

      return res.json({
        period: `${days}d`,
        totalEvents: total,
        breakdown: events.map(e => ({
          eventType: e.eventType,
          eventName: e.eventName,
          count: e._count.id,
        })),
      })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/:id/subscriptions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = await prisma.subscription.findMany({
        where: { organizationId: req.params.id },
        orderBy: { createdAt: 'desc' },
      })
      return res.json(data)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/organizations', router)
}
