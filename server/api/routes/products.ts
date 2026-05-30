import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { requireMinimumRole } from '../middleware/rbac.js'
import type { ProductStatus } from '../../types/index.js'

const prisma = new PrismaClient()
const router = Router()

export function registerRoutes(app: import('express').Express) {
  router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
      const status = req.query.status as string | undefined

      const where: any = {}
      if (status && ['active', 'inactive', 'maintenance'].includes(status)) {
        where.status = status
      }

      const [data, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { workspaces: true, services: true, alerts: true, usageEvents: true } },
          },
        }),
        prisma.product.count({ where }),
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
      const product = await prisma.product.findUnique({
        where: { id: req.params.id },
        include: {
          _count: { select: { workspaces: true, services: true, alerts: true, usageEvents: true } },
          services: { orderBy: { name: 'asc' } },
        },
      })

      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado', code: 'NOT_FOUND' })
      }

      return res.json(product)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { name, slug, description, publicUrl, adminUrl, healthcheckUrl } = req.body

      if (!name || !slug) {
        return res.status(400).json({ error: 'Nome e slug são obrigatórios', code: 'MISSING_FIELDS' })
      }

      const existing = await prisma.product.findUnique({ where: { slug } })
      if (existing) {
        return res.status(409).json({ error: 'Slug já existe', code: 'SLUG_EXISTS' })
      }

      const product = await prisma.product.create({
        data: { name, slug, description, publicUrl, adminUrl, healthcheckUrl },
      })

      return res.status(201).json(product)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.put('/:id', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { name, slug, description, publicUrl, adminUrl, healthcheckUrl, status } = req.body

      if (slug) {
        const existing = await prisma.product.findUnique({ where: { slug } })
        if (existing && existing.id !== req.params.id) {
          return res.status(409).json({ error: 'Slug já existe', code: 'SLUG_EXISTS' })
        }
      }

      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name }),
          ...(slug !== undefined && { slug }),
          ...(description !== undefined && { description }),
          ...(publicUrl !== undefined && { publicUrl }),
          ...(adminUrl !== undefined && { adminUrl }),
          ...(healthcheckUrl !== undefined && { healthcheckUrl }),
          ...(status !== undefined && { status }),
        },
      })

      return res.json(product)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.patch('/:id/status', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { status } = req.body
      const validStatuses: ProductStatus[] = ['active', 'inactive', 'maintenance']

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Status inválido. Valores válidos: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS',
        })
      }

      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: { status: status as ProductStatus },
      })

      return res.json(product)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/:id/workspaces', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))

      const [data, total] = await Promise.all([
        prisma.workspace.findMany({
          where: { productId: req.params.id },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            organization: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.workspace.count({ where: { productId: req.params.id } }),
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

  router.get('/:id/services', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = await prisma.service.findMany({
        where: { productId: req.params.id },
        orderBy: { name: 'asc' },
      })
      return res.json(data)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/:id/events', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
      const days = parseInt(req.query.days as string) || 7
      const since = new Date()
      since.setDate(since.getDate() - days)

      const [data, total] = await Promise.all([
        prisma.usageEvent.findMany({
          where: { productId: req.params.id, createdAt: { gte: since } },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            organization: { select: { id: true, name: true } },
            workspace: { select: { id: true, name: true } },
          },
        }),
        prisma.usageEvent.count({ where: { productId: req.params.id, createdAt: { gte: since } } }),
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

  router.get('/:id/metrics', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const since = new Date()
      since.setHours(since.getHours() - 24)

      const [totalOrgs, activeWorkspaces, errors24h] = await Promise.all([
        prisma.workspace.groupBy({
          by: ['organizationId'],
          where: { productId: req.params.id },
        }).then(groups => groups.length),
        prisma.workspace.count({
          where: { productId: req.params.id, status: 'active' },
        }),
        prisma.usageEvent.count({
          where: {
            productId: req.params.id,
            severity: { in: ['error', 'critical'] },
            createdAt: { gte: since },
          },
        }),
      ])

      return res.json({
        totalOrganizations: totalOrgs,
        activeWorkspaces,
        errors24h,
      })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/products', router)
}
