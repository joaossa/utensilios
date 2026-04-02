export const DB_ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  UNIQUE_VIOLATION: 'UNIQUE_VIOLATION',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  CHECK_VIOLATION: 'CHECK_VIOLATION',
} as const

export class DbServiceError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status = 400) {
    super(message)
    this.name = 'DbServiceError'
    this.code = code
    this.status = status
  }
}

type PgErrorLike = {
  code?: unknown
}

export function throwNotFound(message: string): never {
  throw new DbServiceError(message, DB_ERROR_CODES.NOT_FOUND, 404)
}

export function remapPgError(error: unknown): never {
  const maybePgError = error as PgErrorLike
  const code = typeof maybePgError?.code === 'string' ? maybePgError.code : undefined

  if (code === '23505') {
    throw new DbServiceError('Registro duplicado', DB_ERROR_CODES.UNIQUE_VIOLATION, 409)
  }

  if (code === '23503') {
    throw new DbServiceError('Registro possui vinculos ou referencia invalida', DB_ERROR_CODES.FOREIGN_KEY_VIOLATION, 409)
  }

  if (code === '23514') {
    throw new DbServiceError('Os dados informados violam uma regra de validacao do banco.', DB_ERROR_CODES.CHECK_VIOLATION, 409)
  }

  throw error
}
