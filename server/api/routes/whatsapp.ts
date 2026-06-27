import { Router } from 'express'
import prisma from '../../lib/prisma.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { requireMinimumRole } from '../middleware/rbac.js'
const router = Router()

export function registerRoutes(app: import('express').Express) {
  router.get('/instances', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { org, status } = req.query as Record<string, string | undefined>
      const where: Record<string, unknown> = {}
      if (org) where.organizationId = org
      if (status) where.status = status

      const instances = await prisma.whatsAppInstance.findMany({
        where,
        include: { organization: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return res.json(instances)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/instances/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const instance = await prisma.whatsAppInstance.findUnique({
        where: { id: req.params.id },
        include: { organization: { select: { name: true } } },
      })
      if (!instance) {
        return res.status(404).json({ error: 'Instância não encontrada', code: 'NOT_FOUND' })
      }
      return res.json(instance)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/instances', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { organizationId, workspaceId, instanceName, phoneNumber } = req.body
      if (!organizationId || !instanceName) {
        return res.status(400).json({ error: 'organizationId e instanceName são obrigatórios', code: 'MISSING_FIELDS' })
      }

      const instance = await prisma.whatsAppInstance.create({
        data: {
          organizationId,
          workspaceId,
          instanceName,
          phoneNumber,
          status: 'unknown',
          qrRequired: true,
        },
      })
      return res.status(201).json(instance)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.put('/instances/:id', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { instanceName, phoneNumber, status } = req.body
      const instance = await prisma.whatsAppInstance.update({
        where: { id: req.params.id },
        data: {
          ...(instanceName !== undefined && { instanceName }),
          ...(phoneNumber !== undefined && { phoneNumber }),
          ...(status !== undefined && { status }),
        },
      })
      return res.json(instance)
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return res.status(404).json({ error: 'Instância não encontrada', code: 'NOT_FOUND' })
      }
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/instances/:id/qrcode', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const instance = await prisma.whatsAppInstance.findUnique({
        where: { id: req.params.id },
        select: { qrRequired: true, status: true, id: true },
      })
      if (!instance) {
        return res.status(404).json({ error: 'Instância não encontrada', code: 'NOT_FOUND' })
      }
      return res.json({ instanceId: instance.id, qrRequired: instance.qrRequired, status: instance.status })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/instances/:id/disconnect', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const instance = await prisma.whatsAppInstance.update({
        where: { id: req.params.id },
        data: {
          status: 'disconnected',
          qrRequired: true,
          lastDisconnectedAt: new Date(),
        },
      })
      return res.json(instance)
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return res.status(404).json({ error: 'Instância não encontrada', code: 'NOT_FOUND' })
      }
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/instances/:id/reconnect', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const instance = await prisma.whatsAppInstance.update({
        where: { id: req.params.id },
        data: {
          status: 'qr_required',
          qrRequired: true,
        },
      })
      return res.json(instance)
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return res.status(404).json({ error: 'Instância não encontrada', code: 'NOT_FOUND' })
      }
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const [online, offline, qrPending, messages24h, failures24h] = await Promise.all([
        prisma.whatsAppInstance.count({ where: { status: 'connected' } }),
        prisma.whatsAppInstance.count({ where: { status: 'disconnected' } }),
        prisma.whatsAppInstance.count({ where: { qrRequired: true } }),
        prisma.whatsAppInstance.aggregate({ _sum: { messagesSent24h: true, messagesReceived24h: true } }),
        prisma.whatsAppInstance.aggregate({ _sum: { failedMessages24h: true } }),
      ])
      return res.json({
        online,
        offline,
        qrPending,
        messages24h: (messages24h._sum.messagesSent24h || 0) + (messages24h._sum.messagesReceived24h || 0),
        failures: failures24h._sum.failedMessages24h || 0,
      })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/needing-attention', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
      const [disconnected, qrPending] = await Promise.all([
        prisma.whatsAppInstance.findMany({
          where: {
            status: 'disconnected',
            lastDisconnectedAt: { lte: fiveMinAgo },
          },
        }),
        prisma.whatsAppInstance.findMany({
          where: { qrRequired: true, status: { not: 'connected' } },
        }),
      ])
      return res.json({ disconnected, qrPending })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/whatsapp', router)
}
