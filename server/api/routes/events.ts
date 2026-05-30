import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthRequest, requireApiKey } from '../middleware/auth.js'
import { requireMinimumRole } from '../middleware/rbac.js'

const prisma = new PrismaClient()
const router = Router()

export function registerRoutes(app: import('express').Express) {
  router.post('/', requireApiKey, async (req: AuthRequest, res) => {
    try {
      const { organization_id, workspace_id, product_slug, event_type, event_name, severity, payload } = req.body

      if (!product_slug || !event_type || !event_name) {
        return res.status(400).json({ error: 'product_slug, event_type e event_name são obrigatórios', code: 'MISSING_FIELDS' })
      }

      const product = await prisma.product.findUnique({ where: { slug: product_slug } })
      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado', code: 'PRODUCT_NOT_FOUND' })
      }

      const validSeverities = ['info', 'warning', 'error', 'critical']
      const eventSeverity = severity && validSeverities.includes(severity) ? severity : 'info'

      const event = await prisma.usageEvent.create({
        data: {
          organizationId: organization_id,
          workspaceId: workspace_id,
          productId: product.id,
          eventType: event_type,
          eventName: event_name,
          severity: eventSeverity,
          payload: payload || {},
        },
      })

      if (eventSeverity === 'error' || eventSeverity === 'critical') {
        await prisma.alert.create({
          data: {
            organizationId: organization_id,
            workspaceId: workspace_id,
            productId: product.id,
            title: `${event_name} - ${product.name}`,
            description: `${event_type} event with ${eventSeverity} severity from ${product_slug}`,
            severity: eventSeverity,
            source: product_slug,
            payload: payload || {},
          },
        })
      }

      return res.status(201).json(event)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/', authenticateToken, requireMinimumRole('viewer'), async (req: AuthRequest, res) => {
    try {
      const { page = '1', limit = '50', organization_id, product_slug, event_type, severity, start_date, end_date } = req.query as Record<string, string | undefined>
      const pageNum = Math.max(1, parseInt(page, 10) || 1)
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50))
      const skip = (pageNum - 1) * limitNum

      const where: Record<string, unknown> = {}
      if (organization_id) where.organizationId = organization_id
      if (event_type) where.eventType = event_type
      if (severity) where.severity = severity
      if (product_slug) {
        const product = await prisma.product.findUnique({ where: { slug: product_slug } })
        if (product) where.productId = product.id
        else return res.json({ data: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 })
      }
      if (start_date || end_date) {
        const createdAt: Record<string, Date> = {}
        if (start_date) createdAt.gte = new Date(start_date)
        if (end_date) createdAt.lte = new Date(end_date)
        where.createdAt = createdAt
      }

      const [data, total] = await Promise.all([
        prisma.usageEvent.findMany({
          where,
          include: {
            organization: { select: { id: true, name: true } },
            product: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.usageEvent.count({ where }),
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

      const [totalEvents, eventsBySeverity, eventsByProduct, eventsLast24h, eventsByType] = await Promise.all([
        prisma.usageEvent.count(),
        prisma.usageEvent.groupBy({
          by: ['severity'],
          _count: { id: true },
        }),
        prisma.usageEvent.groupBy({
          by: ['productId'],
          _count: { id: true },
        }),
        prisma.usageEvent.count({ where: { createdAt: { gte: last24h } } }),
        prisma.usageEvent.groupBy({
          by: ['eventType'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
      ])

      const productIds = eventsByProduct.map(e => e.productId).filter(Boolean) as string[]
      const products: { id: string; name: string; slug: string }[] = productIds.length > 0
        ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, slug: true } })
        : []
      const productMap = new Map<string, { id: string; name: string; slug: string }>(products.map(p => [p.id, p]))

      const eventsByProductWithName = eventsByProduct.map(e => {
        const p = productMap.get(e.productId!)
        return {
          productId: e.productId,
          productName: p?.name || null,
          productSlug: p?.slug || null,
          count: e._count.id,
        }
      })

      return res.json({
        totalEvents,
        eventsBySeverity: eventsBySeverity.map(e => ({ severity: e.severity, count: e._count.id })),
        eventsByProduct: eventsByProductWithName,
        eventsLast24h,
        eventsByType: eventsByType.map(e => ({ eventType: e.eventType, count: e._count.id })),
      })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/recent', authenticateToken, requireMinimumRole('viewer'), async (req: AuthRequest, res) => {
    try {
      const events = await prisma.usageEvent.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      })
      return res.json(events)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/:id', authenticateToken, requireMinimumRole('viewer'), async (req: AuthRequest, res) => {
    try {
      const event = await prisma.usageEvent.findUnique({
        where: { id: req.params.id },
        include: {
          organization: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, slug: true } },
          workspace: { select: { id: true, name: true } },
        },
      })
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado', code: 'NOT_FOUND' })
      }
      return res.json(event)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/events', router)
}
