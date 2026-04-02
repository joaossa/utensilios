import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

type AppJwtPayload = {
  sub: string
  email: string
  role: 'ADMIN' | 'OPERADOR' | 'LEITURA'
}

function isAppJwtPayload(payload: unknown): payload is AppJwtPayload {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const candidate = payload as Record<string, unknown>

  return (
    typeof candidate.sub === 'string' &&
    typeof candidate.email === 'string' &&
    (candidate.role === 'ADMIN' || candidate.role === 'OPERADOR' || candidate.role === 'LEITURA')
  )
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ message: 'Token nao informado' })
  }

  const [type, token] = authHeader.split(' ')

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token malformado' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)

    if (!isAppJwtPayload(decoded)) {
      return res.status(401).json({ message: 'Token invalido' })
    }

    req.user = {
      id: Number(decoded.sub),
      email: decoded.email,
      role: decoded.role,
    }

    return next()
  } catch {
    return res.status(401).json({ message: 'Token invalido ou expirado' })
  }
}
