import { Router } from 'express'
import prisma from '../../lib/prisma.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { requireRole, requireMinimumRole } from '../middleware/rbac.js'
const router = Router()

export function registerRoutes(app: import('express').Express) {
  router.get('/subscriptions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { org, status } = req.query as Record<string, string | undefined>
      const where: Record<string, unknown> = {}
      if (org) where.organizationId = org
      if (status) where.status = status

      const subscriptions = await prisma.subscription.findMany({
        where,
        include: { organization: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return res.json(subscriptions)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/subscriptions/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: req.params.id },
        include: { organization: { select: { name: true } } },
      })
      if (!subscription) {
        return res.status(404).json({ error: 'Assinatura não encontrada', code: 'NOT_FOUND' })
      }
      return res.json(subscription)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/subscriptions', authenticateToken, requireMinimumRole('financeiro'), async (req: AuthRequest, res) => {
    try {
      const { organizationId, planName, amount, billingCycle, dueDay, nextDueDate } = req.body
      if (!organizationId || !planName || amount === undefined) {
        return res.status(400).json({ error: 'organizationId, planName e amount são obrigatórios', code: 'MISSING_FIELDS' })
      }

      const subscription = await prisma.subscription.create({
        data: {
          organizationId,
          planName,
          amount,
          billingCycle: billingCycle || 'monthly',
          dueDay,
          nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        },
      })
      return res.status(201).json(subscription)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.put('/subscriptions/:id', authenticateToken, requireMinimumRole('financeiro'), async (req: AuthRequest, res) => {
    try {
      const { planName, amount, billingCycle, dueDay, nextDueDate } = req.body
      const subscription = await prisma.subscription.update({
        where: { id: req.params.id },
        data: {
          ...(planName !== undefined && { planName }),
          ...(amount !== undefined && { amount }),
          ...(billingCycle !== undefined && { billingCycle }),
          ...(dueDay !== undefined && { dueDay }),
          ...(nextDueDate !== undefined && { nextDueDate: new Date(nextDueDate) }),
        },
      })
      return res.json(subscription)
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return res.status(404).json({ error: 'Assinatura não encontrada', code: 'NOT_FOUND' })
      }
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.patch('/subscriptions/:id/cancel', authenticateToken, requireMinimumRole('financeiro'), async (req: AuthRequest, res) => {
    try {
      const subscription = await prisma.subscription.update({
        where: { id: req.params.id },
        data: { status: 'cancelled' },
      })
      return res.json(subscription)
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return res.status(404).json({ error: 'Assinatura não encontrada', code: 'NOT_FOUND' })
      }
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/invoices', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { org, status } = req.query as Record<string, string | undefined>
      const where: Record<string, unknown> = {}
      if (org) where.organizationId = org
      if (status) where.status = status

      const invoices = await prisma.invoice.findMany({
        where,
        include: { organization: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return res.json(invoices)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/invoices/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: req.params.id },
        include: { organization: { select: { name: true } } },
      })
      if (!invoice) {
        return res.status(404).json({ error: 'Fatura não encontrada', code: 'NOT_FOUND' })
      }
      return res.json(invoice)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/invoices', authenticateToken, requireMinimumRole('financeiro'), async (req: AuthRequest, res) => {
    try {
      const { organizationId, subscriptionId, amount, dueDate, description } = req.body
      if (!organizationId || amount === undefined || !dueDate) {
        return res.status(400).json({ error: 'organizationId, amount e dueDate são obrigatórios', code: 'MISSING_FIELDS' })
      }

      const invoice = await prisma.invoice.create({
        data: {
          organizationId,
          subscriptionId,
          amount,
          dueDate: new Date(dueDate),
          description,
        },
      })
      return res.status(201).json(invoice)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/invoices/:id/pay', authenticateToken, requireMinimumRole('financeiro'), async (req: AuthRequest, res) => {
    try {
      const invoice = await prisma.invoice.update({
        where: { id: req.params.id },
        data: { status: 'paid', paidAt: new Date() },
      })
      return res.json(invoice)
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return res.status(404).json({ error: 'Fatura não encontrada', code: 'NOT_FOUND' })
      }
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/invoices/:id/cancel', authenticateToken, requireMinimumRole('financeiro'), async (req: AuthRequest, res) => {
    try {
      const invoice = await prisma.invoice.update({
        where: { id: req.params.id },
        data: { status: 'cancelled' },
      })
      return res.json(invoice)
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return res.status(404).json({ error: 'Fatura não encontrada', code: 'NOT_FOUND' })
      }
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/mrr', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const result = await prisma.subscription.aggregate({
        _sum: { amount: true },
        where: { status: 'active' },
      })
      return res.json({ mrr: result._sum.amount || 0 })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/arr', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const result = await prisma.subscription.aggregate({
        _sum: { amount: true },
        where: { status: 'active' },
      })
      const mrr = result._sum.amount || 0
      return res.json({ arr: Number(mrr) * 12 })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/overdue', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const invoices = await prisma.invoice.findMany({
        where: { status: 'overdue' },
        include: { organization: { select: { name: true } } },
        orderBy: { dueDate: 'asc' },
      })
      return res.json(invoices)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/delinquency-rate', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const [total, overdue] = await Promise.all([
        prisma.invoice.count({ where: { status: { not: 'cancelled' } } }),
        prisma.invoice.count({ where: { status: 'overdue' } }),
      ])
      const rate = total > 0 ? (overdue / total) * 100 : 0
      return res.json({ delinquencyRate: Math.round(rate * 100) / 100, overdue, total })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/dashboard', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const [mrrResult, activeSubs, overdueInvoices, totalInvoices, paidInvoices] = await Promise.all([
        prisma.subscription.aggregate({ _sum: { amount: true }, where: { status: 'active' } }),
        prisma.subscription.count({ where: { status: 'active' } }),
        prisma.invoice.findMany({ where: { status: 'overdue' }, include: { organization: { select: { name: true } } } }),
        prisma.invoice.count(),
        prisma.invoice.count({ where: { status: 'paid' } }),
      ])
      const mrr = mrrResult._sum.amount || 0
      return res.json({
        mrr,
        arr: Number(mrr) * 12,
        activeSubscriptions: activeSubs,
        overdueInvoices,
        totalInvoices,
        paidInvoices,
        totalOutstanding: overdueInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
      })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/financeiro', router)
}
