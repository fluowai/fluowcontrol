import { Router } from 'express'
import prisma from '../../lib/prisma.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { requireRole, requireMinimumRole } from '../middleware/rbac.js'
import type { WorkspaceStatus } from '../../types/index.js'
const router = Router()

export function registerRoutes(app: import('express').Express) {
  router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
      const organizationId = req.query.organization_id as string | undefined
      const productId = req.query.product_id as string | undefined
      const status = req.query.status as string | undefined

      const where: any = {}
      if (organizationId) where.organizationId = organizationId
      if (productId) where.productId = productId
      if (status && ['active', 'suspended', 'creating', 'deleting'].includes(status)) {
        where.status = status
      }

      const [data, total] = await Promise.all([
        prisma.workspace.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            organization: { select: { id: true, name: true } },
            product: { select: { id: true, name: true, slug: true } },
            _count: { select: { alerts: true, usageEvents: true } },
          },
        }),
        prisma.workspace.count({ where }),
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
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.params.id },
        include: {
          organization: { select: { id: true, name: true, email: true, status: true } },
          product: { select: { id: true, name: true, slug: true, status: true } },
          _count: { select: { alerts: true, usageEvents: true } },
        },
      })

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace não encontrado', code: 'NOT_FOUND' })
      }

      return res.json(workspace)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { organizationId, productId, name, slug, publicUrl, adminUrl, databaseSchema, minioBucket, dockerStack, plan } = req.body

      if (!organizationId || !productId || !name || !slug) {
        return res.status(400).json({
          error: 'organizationId, productId, name e slug são obrigatórios',
          code: 'MISSING_FIELDS',
        })
      }

      const [org, product] = await Promise.all([
        prisma.organization.findUnique({ where: { id: organizationId } }),
        prisma.product.findUnique({ where: { id: productId } }),
      ])

      if (!org) {
        return res.status(404).json({ error: 'Organização não encontrada', code: 'ORGANIZATION_NOT_FOUND' })
      }
      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado', code: 'PRODUCT_NOT_FOUND' })
      }

      const workspace = await prisma.workspace.create({
        data: { organizationId, productId, name, slug, publicUrl, adminUrl, databaseSchema, minioBucket, dockerStack, plan },
        include: {
          organization: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      })

      return res.status(201).json(workspace)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.put('/:id', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { name, slug, publicUrl, adminUrl, databaseSchema, minioBucket, dockerStack, plan, status } = req.body

      const workspace = await prisma.workspace.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name }),
          ...(slug !== undefined && { slug }),
          ...(publicUrl !== undefined && { publicUrl }),
          ...(adminUrl !== undefined && { adminUrl }),
          ...(databaseSchema !== undefined && { databaseSchema }),
          ...(minioBucket !== undefined && { minioBucket }),
          ...(dockerStack !== undefined && { dockerStack }),
          ...(plan !== undefined && { plan }),
          ...(status !== undefined && { status }),
        },
        include: {
          organization: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      })

      return res.json(workspace)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.patch('/:id/status', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { status } = req.body
      const validStatuses: WorkspaceStatus[] = ['active', 'suspended', 'creating', 'deleting']

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Status inválido. Valores válidos: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS',
        })
      }

      const workspace = await prisma.workspace.update({
        where: { id: req.params.id },
        data: { status: status as WorkspaceStatus },
      })

      return res.json(workspace)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.delete('/:id', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      await prisma.workspace.delete({ where: { id: req.params.id } })
      return res.status(204).send()
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/workspaces', router)
}
