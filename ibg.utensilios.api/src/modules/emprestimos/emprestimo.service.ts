import type { Knex } from 'knex'

import { DbServiceError, remapPgError, throwNotFound } from '../../db/db-errors'
import { db } from '../../db/knex'

import type { CreateEmprestimoInput, UpdateEmprestimoInput } from './emprestimo.dto'

type Executor = Knex | Knex.Transaction

type EmprestimoHeaderRow = {
  id: number
  membro_id: number
  data_retirada: Date | string
  data_prevista_devolucao: Date | string
  data_devolucao: Date | string | null
  status: 'ativo' | 'devolvido' | 'atrasado'
  observacoes: string | null
}

type EmprestimoQueryRow = {
  id: number
  membro_id: number
  data_retirada: Date | string
  data_prevista_devolucao: Date | string
  data_devolucao: Date | string | null
  status: 'ativo' | 'devolvido' | 'atrasado'
  observacoes: string | null
  membro_nome: string | null
  detalhe_id: number | null
  item_id: number | null
  item_quantidade: number | null
  item_codigo: string | null
  item_descricao: string | null
}

type EmprestimoItemRecord = {
  id: number
  item_id: number
  quantidade: number
  item_codigo: string | null
  item_descricao: string | null
}

type EmprestimoRecord = {
  id: number
  membro_id: number
  data_retirada: Date | string
  data_prevista_devolucao: Date | string
  data_devolucao: Date | string | null
  status: 'ativo' | 'devolvido' | 'atrasado'
  observacoes: string | null
  membro_nome: string | null
  itens: EmprestimoItemRecord[]
  total_itens: number
  quantidade_total: number
  itens_resumo: string
}

type ItemStockRow = {
  id: number
  codigo: string
  descricao: string
  quantidade_total: number
  quantidade_emprestada: number
  quantidade_disponivel: number
}

type MembroRow = {
  id: number
  nome: string
}

const ACTIVE_LOAN_STATUSES = ['ativo', 'atrasado'] as const

function getExecutor(executor?: Executor) {
  return executor ?? db
}

async function registrarHistorico(
  executor: Executor | undefined,
  itemId: number,
  tipoEvento: string,
  descricao: string,
  usuario?: string,
) {
  await getExecutor(executor)('historico_item').insert({
    item_id: itemId,
    tipo_evento: tipoEvento,
    descricao,
    usuario_responsavel: usuario ?? null,
  })
}

function buildEmprestimoRowsQuery(executor?: Executor) {
  return getExecutor(executor)('emprestimos as e')
    .leftJoin('membros as m', 'm.id', 'e.membro_id')
    .leftJoin('item_emprestimos as ie', 'ie.emprestimo_id', 'e.id')
    .leftJoin('itens as i', 'i.id', 'ie.item_id')
    .select<EmprestimoQueryRow[]>(
      'e.id',
      'e.membro_id',
      'e.data_retirada',
      'e.data_prevista_devolucao',
      'e.data_devolucao',
      'e.status',
      'e.observacoes',
      'm.nome as membro_nome',
      'ie.id as detalhe_id',
      'ie.item_id',
      'ie.quantidade as item_quantidade',
      'i.codigo as item_codigo',
      'i.descricao as item_descricao',
    )
}

function mapEmprestimos(rows: EmprestimoQueryRow[]) {
  const emprestimos = new Map<number, EmprestimoRecord>()

  for (const row of rows) {
    let current = emprestimos.get(row.id)

    if (!current) {
      current = {
        id: row.id,
        membro_id: row.membro_id,
        data_retirada: row.data_retirada,
        data_prevista_devolucao: row.data_prevista_devolucao,
        data_devolucao: row.data_devolucao,
        status: row.status,
        observacoes: row.observacoes,
        membro_nome: row.membro_nome,
        itens: [],
        total_itens: 0,
        quantidade_total: 0,
        itens_resumo: '',
      }
      emprestimos.set(row.id, current)
    }

    if (row.detalhe_id !== null && row.item_id !== null && row.item_quantidade !== null) {
      current.itens.push({
        id: row.detalhe_id,
        item_id: row.item_id,
        quantidade: row.item_quantidade,
        item_codigo: row.item_codigo,
        item_descricao: row.item_descricao,
      })
      current.total_itens = current.itens.length
      current.quantidade_total += row.item_quantidade
    }
  }

  for (const emprestimo of emprestimos.values()) {
    emprestimo.itens_resumo = emprestimo.itens
      .map((item) => {
        const nome = item.item_descricao ?? item.item_codigo ?? `Item ${item.item_id}`
        return item.quantidade > 1 ? `${nome} (${item.quantidade})` : nome
      })
      .join(', ')
  }

  return Array.from(emprestimos.values())
}

function buildActiveLoanItemsSubquery(executor?: Executor, ignoreEmprestimoId?: number) {
  const query = getExecutor(executor)('item_emprestimos as ie')
    .join('emprestimos as emp', 'emp.id', 'ie.emprestimo_id')
    .select('ie.item_id')
    .sum({ quantidade_emprestada: 'ie.quantidade' })
    .whereIn('emp.status', ACTIVE_LOAN_STATUSES)
    .groupBy('ie.item_id')

  if (ignoreEmprestimoId !== undefined) {
    query.whereNot('emp.id', ignoreEmprestimoId)
  }

  return query.as('mov')
}

async function getItemStock(itemId: number, ignoreEmprestimoId?: number, executor?: Executor) {
  const item = await getExecutor(executor)('itens as i')
    .leftJoin(buildActiveLoanItemsSubquery(executor, ignoreEmprestimoId), 'mov.item_id', 'i.id')
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

async function getMembroById(id: number, executor?: Executor) {
  const membro = await getExecutor(executor)('membros')
    .select<MembroRow[]>('id', 'nome')
    .where({ id })
    .first()

  if (!membro) {
    throwNotFound('Membro nao encontrado para emprestimo.')
  }

  return membro
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

async function validateLoanItems(
  items: Array<{ item_id: number; quantidade: number }>,
  ignoreEmprestimoId?: number,
  executor?: Executor,
) {
  const itemStocks = new Map<number, ItemStockRow>()

  for (const loanItem of items) {
    const itemStock = await getItemStock(loanItem.item_id, ignoreEmprestimoId, executor)
    assertQuantidadeDisponivel(itemStock, loanItem.quantidade)
    itemStocks.set(loanItem.item_id, itemStock)
  }

  return itemStocks
}

export class EmprestimoService {
  async list() {
    const rows = await buildEmprestimoRowsQuery()
      .orderBy('e.data_retirada', 'desc')
      .orderBy('ie.id', 'asc')

    return mapEmprestimos(rows)
  }

  async create(input: CreateEmprestimoInput, usuario?: string) {
    try {
      return await db.transaction(async (trx) => {
        const membro = await getMembroById(input.membro_id, trx)
        const itemStocks = await validateLoanItems(input.itens, undefined, trx)

        const [emprestimoHeader] = await trx('emprestimos')
          .insert({
            membro_id: input.membro_id,
            data_prevista_devolucao: input.data_prevista_devolucao,
            observacoes: input.observacoes ?? null,
            status: 'ativo',
          })
          .returning<EmprestimoHeaderRow[]>('*')

        if (!emprestimoHeader) {
          throw new Error('Falha ao registrar emprestimo.')
        }

        await trx('item_emprestimos').insert(
          input.itens.map((item) => ({
            emprestimo_id: emprestimoHeader.id,
            item_id: item.item_id,
            quantidade: item.quantidade,
          })),
        )

        for (const loanItem of input.itens) {
          const itemStock = itemStocks.get(loanItem.item_id)
          await registrarHistorico(
            trx,
            loanItem.item_id,
            'emprestado',
            `Emprestimo #${emprestimoHeader.id}: item ${itemStock?.codigo ?? loanItem.item_id} emprestado para ${membro.nome} (${loanItem.quantidade} unidade(s)).`,
            usuario,
          )
        }

        return this.getById(emprestimoHeader.id, trx)
      })
    } catch (error) {
      remapPgError(error)
    }
  }

  async getById(id: number, executor?: Executor) {
    const rows = await buildEmprestimoRowsQuery(executor)
      .where('e.id', id)
      .orderBy('ie.id', 'asc')

    if (rows.length === 0) {
      throwNotFound('Emprestimo nao encontrado.')
    }

    return mapEmprestimos(rows)[0]
  }

  async update(id: number, input: UpdateEmprestimoInput, usuario?: string) {
    const emprestimoAtual = await this.getById(id)

    try {
      return await db.transaction(async (trx) => {
        const nextMembroId = input.membro_id ?? emprestimoAtual.membro_id
        const nextItems = input.itens ?? emprestimoAtual.itens.map((item) => ({
          item_id: item.item_id,
          quantidade: item.quantidade,
        }))

        await getMembroById(nextMembroId, trx)

        if (emprestimoAtual.status !== 'devolvido') {
          await validateLoanItems(nextItems, id, trx)
        }

        await trx('emprestimos')
          .where({ id })
          .update({
            ...(input.membro_id !== undefined ? { membro_id: input.membro_id } : {}),
            ...(input.data_prevista_devolucao !== undefined
              ? { data_prevista_devolucao: input.data_prevista_devolucao }
              : {}),
            ...(input.observacoes !== undefined ? { observacoes: input.observacoes ?? null } : {}),
          })

        if (input.itens !== undefined) {
          await trx('item_emprestimos').where({ emprestimo_id: id }).del()
          await trx('item_emprestimos').insert(
            input.itens.map((item) => ({
              emprestimo_id: id,
              item_id: item.item_id,
              quantidade: item.quantidade,
            })),
          )
        }

        const updated = await this.getById(id, trx)

        for (const item of updated.itens) {
          await registrarHistorico(
            trx,
            item.item_id,
            'atualizacao',
            `Emprestimo #${updated.id} atualizado para o item ${item.item_codigo ?? item.item_id}.`,
            usuario,
          )
        }

        return updated
      })
    } catch (error) {
      remapPgError(error)
    }
  }

  async returnEmprestimo(id: number, usuario?: string) {
    const emprestimo = await this.getById(id)

    if (emprestimo.status === 'devolvido') {
      throw new Error('Este emprestimo ja foi devolvido.')
    }

    const membroNome = emprestimo.membro_nome ?? 'membro'

    try {
      return await db.transaction(async (trx) => {
        await trx('emprestimos')
          .where({ id })
          .update({
            data_devolucao: new Date(),
            status: 'devolvido',
          })

        for (const item of emprestimo.itens) {
          await registrarHistorico(
            trx,
            item.item_id,
            'devolvido',
            `Item ${item.item_codigo ?? item.item_id} devolvido por ${membroNome} (${item.quantidade} unidade(s)) no emprestimo #${emprestimo.id}.`,
            usuario,
          )
        }

        return this.getById(id, trx)
      })
    } catch (error) {
      remapPgError(error)
    }
  }

  async remove(id: number) {
    await this.getById(id)

    try {
      await db('emprestimos').where({ id }).del()
    } catch (error) {
      remapPgError(error)
    }
  }
}
