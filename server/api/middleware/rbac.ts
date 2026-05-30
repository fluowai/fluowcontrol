import { Response, NextFunction } from 'express'
import type { UserRole } from '../../types/index.js'
import type { AuthRequest } from './auth.js'

const roleHierarchy: Record<UserRole, number> = {
  owner: 100,
  admin: 80,
  infra: 60,
  suporte: 40,
  financeiro: 40,
  viewer: 20,
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado', code: 'NOT_AUTHENTICATED' })
    }

    const userRole = req.user.role as UserRole
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Permissão insuficiente',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        userRole,
      })
    }

    next()
  }
}

export function requireMinimumRole(minRole: UserRole) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado', code: 'NOT_AUTHENTICATED' })
    }

    const userLevel = roleHierarchy[req.user.role as UserRole] || 0
    const requiredLevel = roleHierarchy[minRole]

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: 'Permissão insuficiente',
        code: 'INSUFFICIENT_PERMISSIONS',
        minimumRole: minRole,
        userRole: req.user.role,
      })
    }

    next()
  }
}
