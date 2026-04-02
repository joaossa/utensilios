import { remapPgError, throwNotFound } from '../../db/db-errors'
import { db } from '../../db/knex'

import type { CreateHistoricoInput, UpdateHistoricoInput } from './historico.dto'

type HistoricoRow = {
  id: number
  item_id: number
  tipo_evento: 'emprestado' | 'devolvido' | 'manutencao' | 'cadastro' | 'atualizacao'
  descricao: string | null
  data_evento: Date | string
  usuario_responsavel: string | null
}

export class HistoricoService {
  async list() {
    return db('historico_item as h')
      .leftJoin('itens as i', 'i.id', 'h.item_id')
      .select('h.*', 'i.codigo as item_codigo', 'i.descricao as item_descricao')
      .orderBy('h.data_evento', 'desc')
  }

  async getById(id: number) {
    const historico = await db('historico_item as h')
      .leftJoin('itens as i', 'i.id', 'h.item_id')
      .select('h.*', 'i.codigo as item_codigo', 'i.descricao as item_descricao')
      .where('h.id', id)
      .first()

    if (!historico) {
      throwNotFound('Registro de historico nao encontrado.')
    }

    return historico
  }

  async create(input: CreateHistoricoInput) {
    const item = await db('itens').select('id').where({ id: input.item_id }).first()

    if (!item) {
      throwNotFound('Item nao encontrado para historico.')
    }

    try {
      const [historico] = await db('historico_item')
        .insert({
          item_id: input.item_id,
          tipo_evento: input.tipo_evento,
          descricao: input.descricao ?? null,
          usuario_responsavel: input.usuario_responsavel ?? null,
        })
        .returning<HistoricoRow[]>('*')

      return historico
    } catch (error) {
      remapPgError(error)
    }
  }

  async update(id: number, input: UpdateHistoricoInput) {
    await this.getById(id)

    if (input.item_id !== undefined) {
      const item = await db('itens').select('id').where({ id: input.item_id }).first()

      if (!item) {
        throwNotFound('Item nao encontrado para historico.')
      }
    }

    try {
      const [historico] = await db('historico_item')
        .where({ id })
        .update(
          {
            ...(input.item_id !== undefined ? { item_id: input.item_id } : {}),
            ...(input.tipo_evento !== undefined ? { tipo_evento: input.tipo_evento } : {}),
            ...(input.descricao !== undefined ? { descricao: input.descricao ?? null } : {}),
            ...(input.usuario_responsavel !== undefined
              ? { usuario_responsavel: input.usuario_responsavel ?? null }
              : {}),
          },
          ['*'],
        )

      return historico as HistoricoRow
    } catch (error) {
      remapPgError(error)
    }
  }

  async remove(id: number) {
    await this.getById(id)
    await db('historico_item').where({ id }).del()
  }
}
