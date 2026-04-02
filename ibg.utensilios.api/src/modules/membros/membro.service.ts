import { remapPgError, throwNotFound } from '../../db/db-errors'
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
      remapPgError(error)
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
      remapPgError(error)
    }
  }

  async remove(id: number) {
    await this.getById(id)

    try {
      await db('membros').where({ id }).del()
    } catch (error) {
      remapPgError(error)
    }
  }
}
