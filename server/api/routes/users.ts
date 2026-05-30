import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { requireRole, requireMinimumRole } from '../middleware/rbac.js'
import type { UserRole } from '../../types/index.js'

const prisma = new PrismaClient()
const router = Router()

const rolePermissions: Record<UserRole, string[]> = {
  owner: ['users.manage', 'users.create', 'users.delete', 'users.role', 'billing.manage', 'infra.manage', 'tickets.manage', 'audit.view', 'dashboard.view'],
  admin: ['users.manage', 'users.create', 'billing.manage', 'tickets.manage', 'audit.view', 'dashboard.view'],
  infra: ['infra.manage', 'containers.manage', 'dashboard.view'],
  suporte: ['tickets.manage', 'tickets.respond', 'dashboard.view'],
  financeiro: ['billing.manage', 'invoices.manage', 'dashboard.view'],
  viewer: ['dashboard.view'],
}

export function registerRoutes(app: import('express').Express) {
  router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          team: true,
          avatarUrl: true,
          isActive: true,
          organizationId: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      })
      return res.json(users)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          team: true,
          avatarUrl: true,
          isActive: true,
          organizationId: true,
          createdAt: true,
        },
      })
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado', code: 'NOT_FOUND' })
      }
      return res.json(user)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/', authenticateToken, requireRole('owner', 'admin'), async (req: AuthRequest, res) => {
    try {
      const { name, email, password, role, department, team } = req.body
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios', code: 'MISSING_FIELDS' })
      }

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return res.status(409).json({ error: 'Email já cadastrado', code: 'EMAIL_EXISTS' })
      }

      const passwordHash = await bcrypt.hash(password, 12)
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: (role as UserRole) || 'viewer',
          department,
          team,
          organizationId: req.user?.organizationId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          team: true,
          isActive: true,
          createdAt: true,
        },
      })
      return res.status(201).json(user)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.put('/:id', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { name, department, team, avatarUrl } = req.body
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name }),
          ...(department !== undefined && { department }),
          ...(team !== undefined && { team }),
          ...(avatarUrl !== undefined && { avatarUrl }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          team: true,
          avatarUrl: true,
          isActive: true,
        },
      })
      return res.json(user)
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return res.status(404).json({ error: 'Usuário não encontrado', code: 'NOT_FOUND' })
      }
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.patch('/:id/role', authenticateToken, requireRole('owner'), async (req: AuthRequest, res) => {
    try {
      const { role } = req.body
      if (!role) {
        return res.status(400).json({ error: 'Role é obrigatório', code: 'MISSING_FIELDS' })
      }
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { role: role as UserRole },
        select: { id: true, name: true, email: true, role: true },
      })
      return res.json(user)
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return res.status(404).json({ error: 'Usuário não encontrado', code: 'NOT_FOUND' })
      }
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.patch('/:id/deactivate', authenticateToken, requireMinimumRole('admin'), async (req: AuthRequest, res) => {
    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: false },
        select: { id: true, name: true, email: true, isActive: true },
      })
      return res.json(user)
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return res.status(404).json({ error: 'Usuário não encontrado', code: 'NOT_FOUND' })
      }
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/me/permissions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const role = req.user!.role as UserRole
      const permissions = rolePermissions[role] || []
      return res.json({ role, permissions })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/me/notifications', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return res.json(notifications)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/me/notifications/:id/read', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const notification = await prisma.notification.update({
        where: { id: req.params.id, userId: req.user!.userId },
        data: { readAt: new Date() },
      })
      return res.json(notification)
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return res.status(404).json({ error: 'Notificação não encontrada', code: 'NOT_FOUND' })
      }
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/me/notifications/read-all', authenticateToken, async (req: AuthRequest, res) => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.userId, readAt: null },
        data: { readAt: new Date() },
      })
      return res.json({ success: true })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/users', router)
}
