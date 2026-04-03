import { DbServiceError, DB_ERROR_CODES, remapPgError, throwNotFound } from '../../db/db-errors'
import { db } from '../../db/knex'

import type { CreateMembroInput, UpdateMembroInput } from './membro.dto'

type MembroRow = {
  id: number
  nome: string
  telefone: string | null
  cpf: string | null
  email: string | null
  tipo: 'membro' | 'lideranca' | 'visitante_autorizado'
  ativo: boolean
  data_cadastro: Date | string
}

type PgErrorLike = {
  code?: unknown
  constraint?: unknown
}

function remapMembroError(error: unknown): never {
  const pgError = error as PgErrorLike
  const code = typeof pgError?.code === 'string' ? pgError.code : ''
  const constraint = typeof pgError?.constraint === 'string' ? pgError.constraint : ''

  if (code === '23505' && constraint === 'idx_membros_email_unique') {
    throw new DbServiceError('Ja existe um membro cadastrado com este e-mail.', DB_ERROR_CODES.UNIQUE_VIOLATION, 409)
  }

  if (code === '23505' && constraint === 'idx_membros_cpf_unique') {
    throw new DbServiceError('Ja existe um membro cadastrado com este CPF.', DB_ERROR_CODES.UNIQUE_VIOLATION, 409)
  }

  remapPgError(error)
}

export class MembroService {
  async list() {
    return db('membros').select<MembroRow[]>('*').orderBy('nome', 'asc')
  }

  async getById(id: number) {
    const membro = await db('membros').select<MembroRow[]>('*').where({ id }).first()

    if (!membro) {
      throwNotFound('Membro nao encontrado.')
    }

    return membro
  }

  async create(input: CreateMembroInput) {
    try {
      const [membro] = await db('membros')
        .insert({
          nome: input.nome,
          telefone: input.telefone ?? null,
          cpf: input.cpf ?? null,
          email: input.email ?? null,
          tipo: input.tipo,
          ativo: input.ativo,
        })
        .returning<MembroRow[]>('*')

      return membro
    } catch (error) {
      remapMembroError(error)
    }
  }

  async update(id: number, input: UpdateMembroInput) {
    await this.getById(id)

    try {
      const [membro] = await db('membros')
        .where({ id })
        .update(
          {
            ...(input.nome !== undefined ? { nome: input.nome } : {}),
            ...(input.telefone !== undefined ? { telefone: input.telefone ?? null } : {}),
            ...(input.cpf !== undefined ? { cpf: input.cpf ?? null } : {}),
            ...(input.email !== undefined ? { email: input.email ?? null } : {}),
            ...(input.tipo !== undefined ? { tipo: input.tipo } : {}),
            ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
          },
          ['*'],
        )

      return membro as MembroRow
    } catch (error) {
      remapMembroError(error)
    }
  }

  async remove(id: number) {
    await this.getById(id)

    try {
      await db('membros').where({ id }).del()
    } catch (error) {
      remapMembroError(error)
    }
  }
}
