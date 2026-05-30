import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import type { JwtPayload, UserRole } from '../../types/index.js'

const prisma = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET || 'fluow-control-center-dev-secret'

export interface AuthRequest extends Request {
  user?: JwtPayload & { name?: string }
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido', code: 'MISSING_TOKEN' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado', code: 'INVALID_TOKEN' })
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
      req.user = decoded
    } catch {
      // ignore invalid tokens for optional auth
    }
  }
  next()
}

export function requireApiKey(req: AuthRequest, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string
  const internalKey = process.env.INTERNAL_API_KEY || 'fluow-internal-secret-key'

  if (apiKey !== internalKey) {
    return res.status(401).json({ error: 'API key inválida', code: 'INVALID_API_KEY' })
  }
  next()
}

export async function loginUser(email: string, password: string) {
  const bcrypt = await import('bcryptjs')

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new Error('Credenciais inválidas')
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    throw new Error('Credenciais inválidas')
  }

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
    organizationId: user.organizationId || undefined,
  }

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      team: user.team,
      avatarUrl: user.avatarUrl,
    },
  }
}

export function generateToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}
