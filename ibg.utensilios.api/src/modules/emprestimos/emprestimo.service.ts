import { DbServiceError, remapPgError, throwNotFound } from '../../db/db-errors'
import { db } from '../../db/knex'

import type { CreateEmprestimoInput, UpdateEmprestimoInput } from './emprestimo.dto'

type EmprestimoRow = {
  id: number
  item_id: number
  membro_id: number
  quantidade: number
  data_retirada: Date | string
  data_prevista_devolucao: Date | string
  data_devolucao: Date | string | null
  status: 'ativo' | 'devolvido' | 'atrasado'
  observacoes: string | null
}

type ItemStockRow = {
  id: number
  codigo: string
  descricao: string
  quantidade_total: number
  quantidade_emprestada: number
  quantidade_disponivel: number
}

const ACTIVE_LOAN_STATUSES = ['ativo', 'atrasado'] as const

async function registrarHistorico(itemId: number, tipoEvento: string, descricao: string, usuario?: string) {
  await db('historico_item').insert({
    item_id: itemId,
    tipo_evento: tipoEvento,
    descricao,
    usuario_responsavel: usuario ?? null,
  })
}

async function getItemStock(itemId: number, ignoreEmprestimoId?: number) {
  const movimentacao = db('emprestimos as emp')
    .select('emp.item_id')
    .sum({ quantidade_emprestada: 'emp.quantidade' })
    .whereIn('emp.status', ACTIVE_LOAN_STATUSES)
    .groupBy('emp.item_id')

  if (ignoreEmprestimoId !== undefined) {
    movimentacao.whereNot('emp.id', ignoreEmprestimoId)
  }

  const item = await db('itens as i')
    .leftJoin(movimentacao.as('mov'), 'mov.item_id', 'i.id')
    .select<ItemStockRow[]>(
      'i.id',
      'i.codigo',
      'i.descricao',
      'i.quantidade_total',
      db.raw('coalesce(mov.quantidade_emprestada, 0)::int as quantidade_emprestada'),
      db.raw('(i.quantidade_total - coalesce(mov.quantidade_emprestada, 0))::int as quantidade_disponivel'),
    )
    .where('i.id', itemId)
    .first()

  if (!item) {
    throwNotFound('Item nao encontrado para emprestimo.')
  }

  return item
}

function assertQuantidadeDisponivel(item: ItemStockRow, quantidade: number) {
  if (quantidade > item.quantidade_disponivel) {
    throw new DbServiceError(
      `Quantidade solicitada (${quantidade}) maior que a disponivel (${item.quantidade_disponivel}) para o item ${item.codigo}.`,
      'INVALID_STOCK',
      400,
    )
  }
}

export class EmprestimoService {
  async list() {
    return db('emprestimos as e')
      .leftJoin('itens as i', 'i.id', 'e.item_id')
      .leftJoin('membros as m', 'm.id', 'e.membro_id')
      .select(
        'e.*',
        'i.codigo as item_codigo',
        'i.descricao as item_descricao',
        'm.nome as membro_nome',
      )
      .orderBy('e.data_retirada', 'desc')
  }

  async create(input: CreateEmprestimoInput, usuario?: string) {
    const itemRecord = await db('itens')
      .select<{ id: number; codigo: string }[]>('id', 'codigo')
      .where({ id: input.item_id })
      .first()

    const membroRecord = await db('membros')
      .select<{ id: number; nome: string }[]>('id', 'nome')
      .where({ id: input.membro_id })
      .first()

    if (!itemRecord) {
      throwNotFound('Item nao encontrado para emprestimo.')
    }

    if (!membroRecord) {
      throwNotFound('Membro nao encontrado para emprestimo.')
    }

    const item = itemRecord
    const membro = membroRecord
    const itemStock = await getItemStock(input.item_id)

    assertQuantidadeDisponivel(itemStock, input.quantidade)

    try {
      const [emprestimoRecord] = await db('emprestimos')
        .insert({
          item_id: input.item_id,
          membro_id: input.membro_id,
          quantidade: input.quantidade,
          data_prevista_devolucao: input.data_prevista_devolucao,
          observacoes: input.observacoes ?? null,
          status: 'ativo',
        })
        .returning<EmprestimoRow[]>('*')

      if (!emprestimoRecord) {
        throw new Error('Falha ao registrar emprestimo.')
      }

      await registrarHistorico(
        input.item_id,
        'emprestado',
        `Item ${item.codigo} emprestado para ${membro.nome} (${input.quantidade} unidade(s)).`,
        usuario,
      )

      return emprestimoRecord
    } catch (error) {
      remapPgError(error)
    }
  }

  async getById(id: number) {
    const emprestimo = await db('emprestimos as e')
      .leftJoin('itens as i', 'i.id', 'e.item_id')
      .leftJoin('membros as m', 'm.id', 'e.membro_id')
      .select(
        'e.*',
        'i.codigo as item_codigo',
        'i.descricao as item_descricao',
        'm.nome as membro_nome',
      )
      .where('e.id', id)
      .first()

    if (!emprestimo) {
      throwNotFound('Emprestimo nao encontrado.')
    }

    return emprestimo
  }

  async update(id: number, input: UpdateEmprestimoInput, usuario?: string) {
    const emprestimoAtual = await db('emprestimos')
      .select<EmprestimoRow[]>('*')
      .where({ id })
      .first()

    if (!emprestimoAtual) {
      throwNotFound('Emprestimo nao encontrado.')
    }

    if (input.item_id !== undefined) {
      const item = await db('itens').select('id').where({ id: input.item_id }).first()

      if (!item) {
        throwNotFound('Item nao encontrado para emprestimo.')
      }
    }

    if (input.membro_id !== undefined) {
      const membro = await db('membros').select('id').where({ id: input.membro_id }).first()

      if (!membro) {
        throwNotFound('Membro nao encontrado para emprestimo.')
      }
    }

    const nextItemId = input.item_id ?? emprestimoAtual.item_id
    const nextQuantidade = input.quantidade ?? emprestimoAtual.quantidade

    if (emprestimoAtual.status !== 'devolvido') {
      const itemStock = await getItemStock(nextItemId, id)
      assertQuantidadeDisponivel(itemStock, nextQuantidade)
    }

    try {
      const [updated] = await db('emprestimos')
        .where({ id })
        .update(
          {
            ...(input.item_id !== undefined ? { item_id: input.item_id } : {}),
            ...(input.membro_id !== undefined ? { membro_id: input.membro_id } : {}),
            ...(input.quantidade !== undefined ? { quantidade: input.quantidade } : {}),
            ...(input.data_prevista_devolucao !== undefined
              ? { data_prevista_devolucao: input.data_prevista_devolucao }
              : {}),
            ...(input.observacoes !== undefined ? { observacoes: input.observacoes ?? null } : {}),
          },
          ['*'],
        )

      if (!updated) {
        throw new Error('Falha ao atualizar emprestimo.')
      }

      await registrarHistorico(
        updated.item_id,
        'atualizacao',
        `Emprestimo ${updated.id} atualizado.`,
        usuario,
      )

      return updated as EmprestimoRow
    } catch (error) {
      remapPgError(error)
    }
  }

  async returnEmprestimo(id: number, usuario?: string) {
    const emprestimoRecord = await db('emprestimos')
      .select<EmprestimoRow[]>('*')
      .where({ id })
      .first()

    if (!emprestimoRecord) {
      throwNotFound('Emprestimo nao encontrado.')
    }

    const emprestimo = emprestimoRecord

    if (emprestimo.status === 'devolvido') {
      throw new Error('Este emprestimo ja foi devolvido.')
    }

    const item = await db('itens').select<{ codigo: string }[]>('codigo').where({ id: emprestimo.item_id }).first()
    const membro = await db('membros').select<{ nome: string }[]>('nome').where({ id: emprestimo.membro_id }).first()

    const [updated] = await db('emprestimos')
      .where({ id })
      .update(
        {
          data_devolucao: new Date(),
          status: 'devolvido',
        },
        ['*'],
      )

    if (!updated) {
      throw new Error('Falha ao atualizar emprestimo.')
    }

    await registrarHistorico(
      emprestimo.item_id,
      'devolvido',
      `Item ${item?.codigo ?? emprestimo.item_id} devolvido por ${membro?.nome ?? 'membro'} (${emprestimo.quantidade} unidade(s)).`,
      usuario,
    )

    return updated as EmprestimoRow
  }

  async remove(id: number) {
    const emprestimo = await db('emprestimos')
      .select<EmprestimoRow[]>('*')
      .where({ id })
      .first()

    if (!emprestimo) {
      throwNotFound('Emprestimo nao encontrado.')
    }

    await db('emprestimos').where({ id }).del()
  }
}
