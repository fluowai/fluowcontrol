import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const prisma = new PrismaClient()
const router = Router()

export function registerRoutes(app: import('express').Express) {
  router.get('/buckets', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const buckets = await prisma.minioBucket.findMany({
        include: {
          product: { select: { name: true, slug: true } },
          organization: { select: { name: true } },
        },
        orderBy: { bucketName: 'asc' },
      })
      return res.json(buckets)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/buckets/:name', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const bucket = await prisma.minioBucket.findFirst({
        where: { bucketName: req.params.name },
        include: {
          product: { select: { name: true, slug: true } },
          organization: { select: { name: true } },
        },
      })
      if (!bucket) {
        return res.status(404).json({ error: 'Bucket não encontrado', code: 'NOT_FOUND' })
      }
      return res.json(bucket)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/buckets/:name/files', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const bucket = await prisma.minioBucket.findFirst({
        where: { bucketName: req.params.name },
      })
      if (!bucket) {
        return res.status(404).json({ error: 'Bucket não encontrado', code: 'NOT_FOUND' })
      }
      return res.json({ bucket: bucket.bucketName, files: [] })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/usage-by-client', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const buckets = await prisma.minioBucket.findMany({
        where: { organizationId: { not: null } },
        include: { organization: { select: { name: true } } },
      })
      const grouped: Record<string, { organization: { name: string } | null; totalObjects: number; sizeMb: number }> = {}
      for (const b of buckets) {
        const key = b.organizationId || 'unknown'
        if (!grouped[key]) {
          grouped[key] = { organization: b.organization, totalObjects: 0, sizeMb: 0 }
        }
        grouped[key].totalObjects += b.totalObjects || 0
        grouped[key].sizeMb += Number(b.sizeMb || 0)
      }
      return res.json(Object.entries(grouped).map(([orgId, data]) => ({ orgId, ...data })))
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/usage-by-product', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const buckets = await prisma.minioBucket.findMany({
        where: { productId: { not: null } },
        include: { product: { select: { name: true, slug: true } } },
      })
      const grouped: Record<string, { product: { name: string; slug: string } | null; totalObjects: number; sizeMb: number }> = {}
      for (const b of buckets) {
        const key = b.productId || 'unknown'
        if (!grouped[key]) {
          grouped[key] = { product: b.product, totalObjects: 0, sizeMb: 0 }
        }
        grouped[key].totalObjects += b.totalObjects || 0
        grouped[key].sizeMb += Number(b.sizeMb || 0)
      }
      return res.json(Object.entries(grouped).map(([productId, data]) => ({ productId, ...data })))
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/total', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const [totalBuckets, totalObjects, sizeAgg] = await Promise.all([
        prisma.minioBucket.count(),
        prisma.minioBucket.aggregate({ _sum: { totalObjects: true } }),
        prisma.minioBucket.aggregate({ _sum: { sizeMb: true } }),
      ])
      return res.json({
        totalBuckets,
        totalObjects: totalObjects._sum.totalObjects || 0,
        totalSizeMb: Number(sizeAgg._sum.sizeMb || 0),
      })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/growth', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const buckets = await prisma.minioBucket.findMany({
        select: { sizeMb: true, collectedAt: true, bucketName: true },
        orderBy: { collectedAt: 'asc' },
      })
      return res.json(buckets)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/recent-files', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const buckets = await prisma.minioBucket.findMany({
        orderBy: { collectedAt: 'desc' },
        take: 20,
      })
      return res.json(buckets.map(b => ({
        bucketName: b.bucketName,
        lastCollected: b.collectedAt,
        totalObjects: b.totalObjects,
        sizeMb: b.sizeMb,
      })))
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/alert-buckets', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const buckets = await prisma.minioBucket.findMany()
      const alertBuckets = buckets.filter(b => {
        const threshold = 0.8 * 1024
        return Number(b.sizeMb || 0) >= threshold
      })
      return res.json(alertBuckets)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/storage', router)
}
