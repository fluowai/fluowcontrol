import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { requireMinimumRole } from '../middleware/rbac.js'
import type { TicketStatus, TicketPriority } from '../../types/index.js'

const prisma = new PrismaClient()
const router = Router()

export function registerRoutes(app: import('express').Express) {
  router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const [byStatus, byPriority, total, openSlaBreaches] = await Promise.all([
        prisma.supportTicket.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        prisma.supportTicket.groupBy({
          by: ['priority'],
          _count: { id: true },
        }),
        prisma.supportTicket.count(),
        prisma.supportTicket.count({
          where: {
            status: { in: ['open', 'in_progress', 'waiting_customer'] },
            slaDueAt: { lt: new Date() },
          },
        }),
      ])

      return res.json({
        total,
        byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {} as Record<string, number>),
        byPriority: byPriority.reduce((acc, p) => ({ ...acc, [p.priority]: p._count.id }), {} as Record<string, number>),
        openSlaBreaches,
      })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
      const status = req.query.status as string | undefined
      const priority = req.query.priority as string | undefined
      const organizationId = req.query.organization_id as string | undefined
      const assignedTo = req.query.assigned_to as string | undefined

      const where: any = {}
      if (status && ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'].includes(status)) {
        where.status = status
      }
      if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
        where.priority = priority
      }
      if (organizationId) where.organizationId = organizationId
      if (assignedTo) where.assignedTo = assignedTo

      const [data, total] = await Promise.all([
        prisma.supportTicket.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { updatedAt: 'desc' },
          include: {
            organization: { select: { id: true, name: true } },
            _count: { select: { messages: true } },
          },
        }),
        prisma.supportTicket.count({ where }),
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
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: req.params.id },
        include: {
          organization: { select: { id: true, name: true, email: true } },
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket não encontrado', code: 'NOT_FOUND' })
      }

      return res.json(ticket)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/', authenticateToken, requireMinimumRole('suporte'), async (req: AuthRequest, res) => {
    try {
      const { organizationId, workspaceId, title, description, priority, category, channel, slaDueAt } = req.body

      if (!organizationId || !title) {
        return res.status(400).json({ error: 'organizationId e title são obrigatórios', code: 'MISSING_FIELDS' })
      }

      const ticket = await prisma.supportTicket.create({
        data: {
          organizationId,
          workspaceId,
          title,
          description,
          priority: priority as TicketPriority || 'medium',
          category,
          channel: channel || 'ticket',
          assignedTo: req.user!.userId,
          slaDueAt: slaDueAt ? new Date(slaDueAt) : undefined,
        },
        include: {
          organization: { select: { id: true, name: true } },
        },
      })

      return res.status(201).json(ticket)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.put('/:id', authenticateToken, requireMinimumRole('suporte'), async (req: AuthRequest, res) => {
    try {
      const { title, description, priority, category, channel, slaDueAt } = req.body

      const ticket = await prisma.supportTicket.update({
        where: { id: req.params.id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(priority !== undefined && { priority }),
          ...(category !== undefined && { category }),
          ...(channel !== undefined && { channel }),
          ...(slaDueAt !== undefined && { slaDueAt: new Date(slaDueAt) }),
        },
      })

      return res.json(ticket)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.patch('/:id/status', authenticateToken, requireMinimumRole('suporte'), async (req: AuthRequest, res) => {
    try {
      const { status } = req.body
      const validStatuses: TicketStatus[] = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed']

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Status inválido. Valores válidos: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS',
        })
      }

      const data: any = { status: status as TicketStatus }
      if (status === 'closed' || status === 'resolved') {
        data.closedAt = new Date()
      }

      const ticket = await prisma.supportTicket.update({
        where: { id: req.params.id },
        data,
      })

      return res.json(ticket)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.patch('/:id/assign', authenticateToken, requireMinimumRole('suporte'), async (req: AuthRequest, res) => {
    try {
      const { userId } = req.body

      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório', code: 'MISSING_FIELDS' })
      }

      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado', code: 'USER_NOT_FOUND' })
      }

      const ticket = await prisma.supportTicket.update({
        where: { id: req.params.id },
        data: { assignedTo: userId },
      })

      return res.json(ticket)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/:id/messages', authenticateToken, requireMinimumRole('suporte'), async (req: AuthRequest, res) => {
    try {
      const { message, attachments } = req.body

      if (!message) {
        return res.status(400).json({ error: 'Mensagem é obrigatória', code: 'MISSING_FIELDS' })
      }

      const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } })
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket não encontrado', code: 'NOT_FOUND' })
      }

      const msg = await prisma.supportMessage.create({
        data: {
          ticketId: req.params.id,
          senderType: 'agent',
          senderId: req.user!.userId,
          message,
          attachments: attachments || [],
          isInternalNote: false,
        },
      })

      await prisma.supportTicket.update({
        where: { id: req.params.id },
        data: { updatedAt: new Date() },
      })

      return res.status(201).json(msg)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/:id/notes', authenticateToken, requireMinimumRole('suporte'), async (req: AuthRequest, res) => {
    try {
      const { message } = req.body

      if (!message) {
        return res.status(400).json({ error: 'Mensagem é obrigatória', code: 'MISSING_FIELDS' })
      }

      const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } })
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket não encontrado', code: 'NOT_FOUND' })
      }

      const note = await prisma.supportMessage.create({
        data: {
          ticketId: req.params.id,
          senderType: 'agent',
          senderId: req.user!.userId,
          message,
          isInternalNote: true,
        },
      })

      return res.status(201).json(note)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/tickets', router)
}
