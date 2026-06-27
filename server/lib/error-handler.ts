import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import logger from './logger.js'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    })
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
  }

  logger.error({ err, method: req.method, url: req.url }, 'Unhandled error')

  const isProduction = process.env.NODE_ENV === 'production'
  return res.status(500).json({
    error: isProduction ? 'Erro interno do servidor' : err.message,
    code: 'INTERNAL_ERROR',
  })
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: `Rota não encontrada: ${req.method} ${req.url}`,
    code: 'NOT_FOUND',
  })
}
