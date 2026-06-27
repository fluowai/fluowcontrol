import { Router } from 'express'
import prisma from '../../lib/prisma.js'
import { authenticateToken, AuthRequest, requireApiKey } from '../middleware/auth.js'
import { requireMinimumRole } from '../middleware/rbac.js'
const router = Router()

function buildAuditWhere(query: Record<string, string | undefined>): Record<string, unknown> {
  const { user_id, action, entity_type, start_date, end_date } = query
  const where: Record<string, unknown> = {}

  if (user_id) where.userId = user_id
  if (action) where.action = action
  if (entity_type) where.entityType = entity_type
  if (start_date || end_date) {
    const createdAt: Record<string, Date> = {}
    if (start_date) createdAt.gte = new Date(start_date)
    if (end_date) createdAt.lte = new Date(end_date)
    where.createdAt = createdAt
  }

  return where
}

export function registerRoutes(app: import('express').Express) {
  router.get('/', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { page = '1', limit = '50' } = req.query as Record<string, string | undefined>
      const pageNum = Math.max(1, parseInt(page, 10) || 1)
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50))
      const skip = (pageNum - 1) * limitNum
      const where = buildAuditWhere(req.query as Record<string, string | undefined>)

      const [data, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: { user: { select: { name: true, email: true, role: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.auditLog.count({ where }),
      ])

      return res.json({
        data,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      })
    } catch {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/', requireApiKey, async (req: AuthRequest, res) => {
    try {
      const { userId, organizationId, action, entityType, entityId, ipAddress, userAgent, metadata } = req.body
      if (!userId || !action || !entityType) {
        return res.status(400).json({ error: 'userId, action e entityType sao obrigatorios', code: 'MISSING_FIELDS' })
      }

      const entry = await prisma.auditLog.create({
        data: {
          userId,
          organizationId,
          action,
          entityType,
          entityId,
          ipAddress,
          userAgent,
          metadata: metadata || {},
        },
      })
      return res.status(201).json(entry)
    } catch {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/stats', authenticateToken, requireMinimumRole('admin'), async (_req: AuthRequest, res) => {
    try {
      const [actionsByType, totalEntries, recentActivity] = await Promise.all([
        prisma.auditLog.groupBy({
          by: ['action'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
        prisma.auditLog.count(),
        prisma.auditLog.findMany({
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, email: true, role: true } } },
        }),
      ])
      return res.json({ actionsByType, totalEntries, recentActivity })
    } catch {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/export', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const where = buildAuditWhere(req.query as Record<string, string | undefined>)
      const entries = await prisma.auditLog.findMany({
        where,
        include: { user: { select: { name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return res.json(entries)
    } catch {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/:id', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const entry = await prisma.auditLog.findUnique({
        where: { id: req.params.id },
        include: { user: { select: { name: true, email: true, role: true } } },
      })
      if (!entry) {
        return res.status(404).json({ error: 'Registro de auditoria nao encontrado', code: 'NOT_FOUND' })
      }
      return res.json(entry)
    } catch {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/audit', router)
}
