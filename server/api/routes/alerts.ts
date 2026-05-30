import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { requireMinimumRole } from '../middleware/rbac.js'

const prisma = new PrismaClient()
const router = Router()

export function registerRoutes(app: import('express').Express) {
  router.get('/', authenticateToken, requireMinimumRole('viewer'), async (req: AuthRequest, res) => {
    try {
      const { page = '1', limit = '50', status, severity, organization_id, source, product_id } = req.query as Record<string, string | undefined>
      const pageNum = Math.max(1, parseInt(page, 10) || 1)
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50))
      const skip = (pageNum - 1) * limitNum

      const where: Record<string, unknown> = {}
      if (status) where.status = status
      if (severity) where.severity = severity
      if (organization_id) where.organizationId = organization_id
      if (source) where.source = source
      if (product_id) where.productId = product_id

      const [data, total] = await Promise.all([
        prisma.alert.findMany({
          where,
          include: {
            organization: { select: { id: true, name: true } },
            product: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { lastSeenAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.alert.count({ where }),
      ])

      return res.json({
        data,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/stats', authenticateToken, requireMinimumRole('viewer'), async (req: AuthRequest, res) => {
    try {
      const now = new Date()
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const [byStatus, bySeverity, bySource, createdLast24h] = await Promise.all([
        prisma.alert.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        prisma.alert.groupBy({
          by: ['severity'],
          _count: { id: true },
        }),
        prisma.alert.groupBy({
          by: ['source'],
          _count: { id: true },
        }),
        prisma.alert.count({ where: { firstSeenAt: { gte: last24h } } }),
      ])

      return res.json({
        byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id })),
        bySeverity: bySeverity.map(s => ({ severity: s.severity, count: s._count.id })),
        bySource: bySource.map(s => ({ source: s.source, count: s._count.id })),
        createdLast24h,
      })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/critical', authenticateToken, requireMinimumRole('viewer'), async (req: AuthRequest, res) => {
    try {
      const alerts = await prisma.alert.findMany({
        where: { severity: 'critical', status: 'open' },
        take: 20,
        orderBy: { lastSeenAt: 'desc' },
        include: {
          organization: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      })
      return res.json(alerts)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { organization_id, workspace_id, product_id, service_id, title, description, severity, source, payload } = req.body

      if (!title) {
        return res.status(400).json({ error: 'title é obrigatório', code: 'MISSING_FIELDS' })
      }

      const validSeverities = ['info', 'warning', 'error', 'critical']
      const alertSeverity = severity && validSeverities.includes(severity) ? severity : 'warning'

      const alert = await prisma.alert.create({
        data: {
          organizationId: organization_id,
          workspaceId: workspace_id,
          productId: product_id,
          serviceId: service_id,
          title,
          description,
          severity: alertSeverity,
          source: source || 'internal',
          payload: payload || {},
        },
      })

      return res.status(201).json(alert)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/:id', authenticateToken, requireMinimumRole('viewer'), async (req: AuthRequest, res) => {
    try {
      const alert = await prisma.alert.findUnique({
        where: { id: req.params.id },
        include: {
          organization: { select: { id: true, name: true } },
          workspace: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, slug: true } },
          service: { select: { id: true, name: true, type: true } },
        },
      })
      if (!alert) {
        return res.status(404).json({ error: 'Alerta não encontrado', code: 'NOT_FOUND' })
      }
      return res.json(alert)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.patch('/:id/acknowledge', authenticateToken, requireMinimumRole('suporte'), async (req: AuthRequest, res) => {
    try {
      const existing = await prisma.alert.findUnique({ where: { id: req.params.id } })
      if (!existing) {
        return res.status(404).json({ error: 'Alerta não encontrado', code: 'NOT_FOUND' })
      }

      const alert = await prisma.alert.update({
        where: { id: req.params.id },
        data: { status: 'acknowledged' },
      })

      return res.json(alert)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.patch('/:id/resolve', authenticateToken, requireMinimumRole('suporte'), async (req: AuthRequest, res) => {
    try {
      const existing = await prisma.alert.findUnique({ where: { id: req.params.id } })
      if (!existing) {
        return res.status(404).json({ error: 'Alerta não encontrado', code: 'NOT_FOUND' })
      }

      const alert = await prisma.alert.update({
        where: { id: req.params.id },
        data: { status: 'resolved', resolvedAt: new Date() },
      })

      return res.json(alert)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.patch('/:id/ignore', authenticateToken, requireMinimumRole('suporte'), async (req: AuthRequest, res) => {
    try {
      const existing = await prisma.alert.findUnique({ where: { id: req.params.id } })
      if (!existing) {
        return res.status(404).json({ error: 'Alerta não encontrado', code: 'NOT_FOUND' })
      }

      const alert = await prisma.alert.update({
        where: { id: req.params.id },
        data: { status: 'ignored' },
      })

      return res.json(alert)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/alerts', router)
}
