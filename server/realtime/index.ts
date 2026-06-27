import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types/index.js'
import prisma from '../lib/prisma.js'
const JWT_SECRET = process.env.JWT_SECRET || 'fluow-control-center-dev-secret'

let io: Server | null = null

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call setupRealtime first.')
  }
  return io
}

export function setupRealtime(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  })

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token as string

      if (!token) {
        return next(new Error('Token de autenticação não fornecido'))
      }

      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
      ;(socket as any).user = decoded
      next()
    } catch {
      next(new Error('Token inválido ou expirado'))
    }
  })

  io.on('connection', (socket) => {
    const user = (socket as any).user as JwtPayload
    console.log(`[Realtime] User connected: ${user.email} (${user.role})`)

    socket.join(`user:${user.userId}`)
    socket.join(`role:${user.role}`)

    if (user.organizationId) {
      socket.join(`org:${user.organizationId}`)
    }

    socket.on('disconnect', () => {
      console.log(`[Realtime] User disconnected: ${user.email}`)
    })
  })

  const metricsInterval = setInterval(async () => {
    try {
      const [containersRunning, criticalAlerts, activeOrganizations, pendingInvoices, openTickets] = await Promise.all([
        prisma.dockerContainer.count({ where: { state: 'running' } }),
        prisma.alert.count({ where: { severity: 'critical', status: 'open' } }),
        prisma.organization.count({ where: { status: 'active' } }),
        prisma.invoice.count({ where: { status: 'pending' } }),
        prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      ])

      io!.emit('metrics:update', {
        containersRunning,
        criticalAlerts,
        activeOrganizations,
        pendingInvoices,
        openTickets,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('[Realtime] metrics interval error:', error)
    }
  }, 10000)

  io.on('close', () => {
    clearInterval(metricsInterval)
  })

  console.log('[Realtime] Socket.IO initialized')
  return io
}

export function emitAlert(io: Server, alert: Record<string, unknown>): void {
  io.emit('alert:new', alert)
}

export function emitTicketUpdate(io: Server, ticket: Record<string, unknown>): void {
  io.emit('ticket:update', ticket)
}

export function sendNotification(io: Server, userId: string, notification: Record<string, unknown>): void {
  io.to(`user:${userId}`).emit('notification:new', notification)
}

export function emitMetricsUpdate(io: Server, metrics: Record<string, unknown>): void {
  io.emit('metrics:update', metrics)
}
