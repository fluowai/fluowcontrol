import { Router } from 'express'
import prisma from '../../lib/prisma.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { requireMinimumRole } from '../middleware/rbac.js'
import * as DockerService from '../../services/docker.js'
const router = Router()

export function registerRoutes(app: import('express').Express) {
  router.get('/containers', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const dbContainers = await prisma.dockerContainer.findMany({
        orderBy: { collectedAt: 'desc' },
        take: 100,
      })
      return res.json(dbContainers)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/containers/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const container = await prisma.dockerContainer.findUnique({
        where: { id: req.params.id },
      })
      if (!container) {
        return res.status(404).json({ error: 'Container não encontrado', code: 'NOT_FOUND' })
      }
      return res.json(container)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/containers/:id/logs', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const container = await prisma.dockerContainer.findUnique({
        where: { id: req.params.id },
      })
      if (!container) {
        return res.status(404).json({ error: 'Container não encontrado', code: 'NOT_FOUND' })
      }
      const lines = req.query.lines ? Number(req.query.lines) : undefined
      const logs = await DockerService.getContainerLogs(container.containerId, lines)
      return res.json(logs)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/containers/:id/restart', authenticateToken, requireMinimumRole('infra'), async (req: AuthRequest, res) => {
    try {
      const container = await prisma.dockerContainer.findUnique({
        where: { id: req.params.id },
      })
      if (!container) {
        return res.status(404).json({ error: 'Container não encontrado', code: 'NOT_FOUND' })
      }
      const result = await DockerService.restartContainer(container.containerId)
      return res.json(result)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/containers/:id/stop', authenticateToken, requireMinimumRole('infra'), async (req: AuthRequest, res) => {
    try {
      const container = await prisma.dockerContainer.findUnique({
        where: { id: req.params.id },
      })
      if (!container) {
        return res.status(404).json({ error: 'Container não encontrado', code: 'NOT_FOUND' })
      }
      const result = await DockerService.stopContainer(container.containerId)
      return res.json(result)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/containers/:id/start', authenticateToken, requireMinimumRole('infra'), async (req: AuthRequest, res) => {
    try {
      const container = await prisma.dockerContainer.findUnique({
        where: { id: req.params.id },
      })
      if (!container) {
        return res.status(404).json({ error: 'Container não encontrado', code: 'NOT_FOUND' })
      }
      const result = await DockerService.startContainer(container.containerId)
      return res.json(result)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/docker/prune', authenticateToken, requireMinimumRole('infra'), async (req: AuthRequest, res) => {
    try {
      const result = await DockerService.pruneDocker()
      return res.json(result)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/host', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const [liveMetrics, latestDbMetric] = await Promise.all([
        DockerService.getHostMetrics(),
        prisma.infrastructureMetric.findFirst({ orderBy: { collectedAt: 'desc' } }),
      ])
      return res.json({ live: liveMetrics, lastRecorded: latestDbMetric })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/postgres', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const metrics = await prisma.postgresMetric.findMany({
        orderBy: { collectedAt: 'desc' },
        take: 20,
      })
      return res.json(metrics)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/supabase', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const metrics = await prisma.supabaseMetric.findMany({
        orderBy: { collectedAt: 'desc' },
        take: 20,
      })
      return res.json(metrics)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/services', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const services = await prisma.service.findMany({
        include: { product: { select: { name: true, slug: true } } },
        orderBy: { name: 'asc' },
      })
      return res.json(services)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/health-checks', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const checks = await prisma.apiHealthCheck.findMany({
        include: { service: { select: { name: true } } },
        orderBy: { checkedAt: 'desc' },
        take: 100,
      })
      return res.json(checks)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/dashboard', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const [containers, hostMetric, pgMetric, supabaseMetric, services, recentChecks] = await Promise.all([
        prisma.dockerContainer.findMany({ orderBy: { collectedAt: 'desc' }, take: 50 }),
        prisma.infrastructureMetric.findFirst({ orderBy: { collectedAt: 'desc' } }),
        prisma.postgresMetric.findFirst({ orderBy: { collectedAt: 'desc' } }),
        prisma.supabaseMetric.findFirst({ orderBy: { collectedAt: 'desc' } }),
        prisma.service.findMany({ include: { product: { select: { name: true, slug: true } } } }),
        prisma.apiHealthCheck.findMany({ orderBy: { checkedAt: 'desc' }, take: 20 }),
      ])
      return res.json({ containers, hostMetric, pgMetric, supabaseMetric, services, recentChecks })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/infra', router)
}
