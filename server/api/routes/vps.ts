import { Router } from 'express'
import prisma from '../../lib/prisma.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { requireMinimumRole } from '../middleware/rbac.js'
import { encryptSecret } from '../../services/crypto.js'
import { collectVpsMetrics, testVpsConnection } from '../../services/vps.js'
const router = Router()

function sanitizeHost(host: any) {
  const latestMetric = host.metrics?.[0]
  return {
    id: host.id,
    name: host.name,
    host: host.host,
    port: host.port,
    username: host.username,
    status: host.status,
    lastError: host.lastError,
    lastSeenAt: host.lastSeenAt,
    createdAt: host.createdAt,
    updatedAt: host.updatedAt,
    latestMetric,
    hasPassword: Boolean(host.passwordEncrypted),
    hasPrivateKey: Boolean(host.privateKeyEncrypted),
  }
}

export function registerRoutes(app: import('express').Express) {
  router.get('/hosts', authenticateToken, requireMinimumRole('viewer'), async (_req: AuthRequest, res) => {
    try {
      const hosts = await prisma.vpsHost.findMany({
        orderBy: { createdAt: 'desc' },
        include: { metrics: { orderBy: { collectedAt: 'desc' }, take: 1 } },
      })
      return res.json(hosts.map(sanitizeHost))
    } catch {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/hosts', authenticateToken, requireMinimumRole('infra'), async (req: AuthRequest, res) => {
    try {
      const { name, host, port = 22, username, password, privateKey } = req.body
      if (!name || !host || !username || (!password && !privateKey)) {
        return res.status(400).json({ error: 'name, host, username e uma credencial SSH sao obrigatorios', code: 'MISSING_FIELDS' })
      }

      const created = await prisma.vpsHost.create({
        data: {
          name,
          host,
          port: Number(port) || 22,
          username,
          passwordEncrypted: encryptSecret(password),
          privateKeyEncrypted: encryptSecret(privateKey),
          status: 'unknown',
        },
        include: { metrics: { orderBy: { collectedAt: 'desc' }, take: 1 } },
      })

      return res.status(201).json(sanitizeHost(created))
    } catch {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/test', authenticateToken, requireMinimumRole('infra'), async (req: AuthRequest, res) => {
    const { host, port = 22, username, password, privateKey } = req.body
    if (!host || !username || (!password && !privateKey)) {
      return res.status(400).json({ error: 'host, username e uma credencial SSH sao obrigatorios', code: 'MISSING_FIELDS' })
    }

    const result = await testVpsConnection({
      host,
      port: Number(port) || 22,
      username,
      password,
      privateKey,
    })
    return res.status(result.ok ? 200 : 400).json(result)
  })

  router.post('/hosts/:id/collect', authenticateToken, requireMinimumRole('infra'), async (req: AuthRequest, res) => {
    try {
      const metric = await collectVpsMetrics(req.params.id)
      return res.json(metric)
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Falha ao coletar metricas da VPS', code: 'COLLECT_FAILED' })
    }
  })

  router.get('/hosts/:id/metrics', authenticateToken, requireMinimumRole('viewer'), async (req: AuthRequest, res) => {
    try {
      const metrics = await prisma.vpsMetric.findMany({
        where: { hostId: req.params.id },
        orderBy: { collectedAt: 'desc' },
        take: 100,
      })
      return res.json(metrics)
    } catch {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/vps', router)
}
