import type { NextFunction, Request, Response } from 'express'

import { DbServiceError } from '../db/db-errors'

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof DbServiceError) {
    return res.status(error.status).json({
      message: error.message,
      code: error.code,
    })
  }

  const message = error instanceof Error ? error.message : 'Erro interno do servidor'
  console.error('Erro nao tratado:', error)

  return res.status(500).json({
    message,
  })
}
