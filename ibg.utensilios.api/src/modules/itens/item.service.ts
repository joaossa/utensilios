import { DbServiceError, DB_ERROR_CODES, remapPgError, throwNotFound } from '../../db/db-errors'
import { db } from '../../db/knex'

import type { CreateItemInput, UpdateItemInput } from './item.dto'

type ItemLookupRow = {
  id: number
  descricao: string
  ativo: 'S' | 'N'
}

type ItemRow = {
  id: number
  codigo: string
  descricao: string
  categoria_id: number | null
  estado_id: number | null
  categoria: string | null
  estado: string | null
  localizacao: string | null
  quantidade_total: number
  quantidade_emprestada: number
  quantidade_disponivel: number
  data_cadastro: Date | string
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

async function getEstadoById(id: number) {
  const estado = await db('item_estados').select<ItemLookupRow[]>('*').where({ id }).first()

  if (!estado || estado.ativo !== 'S') {
    throw new DbServiceError('Estado do item invalido.', DB_ERROR_CODES.NOT_FOUND, 400)
  }

  return estado
}

async function getCategoriaById(id: number) {
  const categoria = await db('item_categorias').select<ItemLookupRow[]>('*').where({ id }).first()

  if (!categoria || categoria.ativo !== 'S') {
    throw new DbServiceError('Categoria do item invalida.', DB_ERROR_CODES.NOT_FOUND, 400)
  }

  return categoria
}

function mapEstadoDescricaoParaLegado(descricao: string) {
  const normalized = descricao
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

  if (normalized === 'novo') return 'novo'
  if (normalized === 'bom') return 'bom'
  if (normalized === 'manutencao') return 'manutencao'
  if (normalized === 'danificado') return 'danificado'
  return 'bom'
}

async function getNextItemCode() {
  const result = await db.raw(
    "select nextval(pg_get_serial_sequence('public.itens', 'id')) as id",
  )

  const nextId =
    Number(result?.rows?.[0]?.id ?? result?.[0]?.id ?? result?.[0]?.rows?.[0]?.id) || 0

  if (!nextId) {
    throw new Error('Nao foi possivel gerar o codigo sequencial do item.')
  }

  return {
    id: nextId,
    codigo: String(nextId),
  }
}

function buildEmprestimosAtivosSubquery(ignoreEmprestimoId?: number) {
  const query = db('item_emprestimos as ie')
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

function buildItemQuery(ignoreEmprestimoId?: number) {
  return db('itens as i')
    .leftJoin('item_categorias as c', 'c.id', 'i.categoria_id')
    .leftJoin('item_estados as e', 'e.id', 'i.estado_id')
    .leftJoin(buildEmprestimosAtivosSubquery(ignoreEmprestimoId), 'mov.item_id', 'i.id')
    .select<ItemRow[]>(
      'i.id',
      'i.codigo',
      'i.descricao',
      'i.categoria_id',
      'i.estado_id',
      'c.descricao as categoria',
      'e.descricao as estado',
      'i.localizacao',
      'i.quantidade_total',
      db.raw('coalesce(mov.quantidade_emprestada, 0)::int as quantidade_emprestada'),
      db.raw('(i.quantidade_total - coalesce(mov.quantidade_emprestada, 0))::int as quantidade_disponivel'),
      'i.data_cadastro',
    )
}

export class ItemService {
  async list() {
    return buildItemQuery()
      .orderBy('i.id', 'desc')
  }

  async getById(id: number) {
    const item = await buildItemQuery()
      .where('i.id', id)
      .first()

    if (!item) {
      throwNotFound('Item nao encontrado.')
    }

    return item
  }

  async getFormOptions() {
    const [estados, categorias] = await Promise.all([
      db('item_estados').select<ItemLookupRow[]>('*').where({ ativo: 'S' }).orderBy('id', 'asc'),
      db('item_categorias').select<ItemLookupRow[]>('*').where({ ativo: 'S' }).orderBy('descricao', 'asc'),
    ])

    return { estados, categorias }
  }

  async create(input: CreateItemInput, usuario?: string) {
    const [categoria, estado, nextCode] = await Promise.all([
      getCategoriaById(input.categoria_id),
      getEstadoById(input.estado_id),
      getNextItemCode(),
    ])

    try {
      const [item] = await db('itens')
        .insert({
          id: nextCode.id,
          codigo: nextCode.codigo,
          descricao: input.descricao,
          categoria_id: categoria.id,
          estado_id: estado.id,
          quantidade_total: input.quantidade_total,
          categoria: categoria.descricao,
          estado: mapEstadoDescricaoParaLegado(estado.descricao),
          localizacao: input.localizacao ?? null,
        })
        .returning<{ id: number }[]>('id')

      await registrarHistorico(item.id, 'cadastro', `Item ${nextCode.codigo} cadastrado.`, usuario)

      return this.getById(item.id)
    } catch (error) {
      remapPgError(error)
    }
  }

  async update(id: number, input: UpdateItemInput, usuario?: string) {
    const currentItem = await this.getById(id)

    const categoria = input.categoria_id !== undefined ? await getCategoriaById(input.categoria_id) : null
    const estado = input.estado_id !== undefined ? await getEstadoById(input.estado_id) : null

    if (
      input.quantidade_total !== undefined &&
      input.quantidade_total < currentItem.quantidade_emprestada
    ) {
      throw new DbServiceError(
        `A quantidade total nao pode ser menor que ${currentItem.quantidade_emprestada}, pois existem unidades emprestadas.`,
        DB_ERROR_CODES.FOREIGN_KEY_VIOLATION,
        400,
      )
    }

    try {
      await db('itens')
        .where({ id })
        .update({
          ...(input.descricao !== undefined ? { descricao: input.descricao } : {}),
          ...(categoria ? { categoria_id: categoria.id, categoria: categoria.descricao } : {}),
          ...(estado ? { estado_id: estado.id, estado: mapEstadoDescricaoParaLegado(estado.descricao) } : {}),
          ...(input.quantidade_total !== undefined ? { quantidade_total: input.quantidade_total } : {}),
          ...(input.localizacao !== undefined ? { localizacao: input.localizacao ?? null } : {}),
        })

      const item = await this.getById(id)
      await registrarHistorico(item.id, 'atualizacao', `Item ${item.codigo} atualizado.`, usuario)
      return item
    } catch (error) {
      remapPgError(error)
    }
  }

  async remove(id: number) {
    await this.getById(id)

    try {
      await db('itens').where({ id }).del()
    } catch (error) {
      remapPgError(error)
    }
  }
}
