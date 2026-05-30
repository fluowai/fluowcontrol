import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { authenticateToken, AuthRequest, loginUser, generateToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import type { UserRole, JwtPayload } from '../../types/index.js'

const prisma = new PrismaClient()
const router = Router()

export function registerRoutes(app: import('express').Express) {
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios', code: 'MISSING_FIELDS' })
      }

      const result = await loginUser(email, password)
      return res.json(result)
    } catch (err: any) {
      if (err.message === 'Credenciais inválidas') {
        return res.status(401).json({ error: 'Credenciais inválidas', code: 'INVALID_CREDENTIALS' })
      }
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/register', authenticateToken, requireRole('owner'), async (req: AuthRequest, res) => {
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
      })

      return res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        team: user.team,
      })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
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
        return res.status(404).json({ error: 'Usuário não encontrado', code: 'USER_NOT_FOUND' })
      }

      return res.json(user)
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  router.put('/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { name, department, team, avatarUrl } = req.body

      const user = await prisma.user.update({
        where: { id: req.user!.userId },
        data: {
          ...(name !== undefined && { name }),
          ...(department !== undefined && { department }),
          ...(team !== undefined && { team }),
          ...(avatarUrl !== undefined && { avatarUrl }),
        },
      })

      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        team: user.team,
        avatarUrl: user.avatarUrl,
      })
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
    }
  })

  app.use('/api/auth', router)
}
