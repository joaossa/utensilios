import { DbServiceError, DB_ERROR_CODES, remapPgError, throwNotFound } from '../../db/db-errors'
import { db } from '../../db/knex'

import type { CreateItemImagemInput, UpdateItemImagemInput } from './item-imagem.dto'

type ItemImagemDbRow = {
  id: number
  item_id: number
  url_imagem: string | null
  descricao: string | null
  ordem: number | null
  arquivo_binario: Buffer | null
  nome_arquivo: string | null
  mime_type: string | null
  tamanho_bytes: number | null
}

function decodeBase64Payload(value: string | null | undefined) {
  if (!value) {
    return null
  }

  try {
    return Buffer.from(value, 'base64')
  } catch {
    throw new DbServiceError('Arquivo binário da imagem inválido.', DB_ERROR_CODES.NOT_FOUND, 400)
  }
}

function buildImageSource(row: ItemImagemDbRow) {
  if (row.arquivo_binario && row.mime_type) {
    return `data:${row.mime_type};base64,${row.arquivo_binario.toString('base64')}`
  }

  return row.url_imagem
}

function mapRow(row: ItemImagemDbRow) {
  return {
    id: row.id,
    item_id: row.item_id,
    url_imagem: row.url_imagem,
    descricao: row.descricao,
    ordem: row.ordem,
    nome_arquivo: row.nome_arquivo,
    mime_type: row.mime_type,
    tamanho_bytes: row.tamanho_bytes,
    possui_binario: !!row.arquivo_binario,
    imagem_src: buildImageSource(row),
  }
}

async function ensureItemExists(itemId: number) {
  const item = await db('itens').select('id').where({ id: itemId }).first()

  if (!item) {
    throwNotFound('Item nao encontrado para imagem.')
  }
}

export class ItemImagemService {
  async listByItemId(itemId: number) {
    await ensureItemExists(itemId)

    const rows = await db('item_imagens')
      .select<ItemImagemDbRow[]>('*')
      .where({ item_id: itemId })
      .orderBy([
        { column: 'ordem', order: 'asc' },
        { column: 'id', order: 'asc' },
      ])

    return rows.map(mapRow)
  }

  async create(input: CreateItemImagemInput) {
    await ensureItemExists(input.item_id)

    const arquivoBinario = decodeBase64Payload(input.arquivo_base64)

    try {
      const [imagem] = await db('item_imagens')
        .insert({
          item_id: input.item_id,
          url_imagem: input.url_imagem ?? null,
          descricao: input.descricao ?? null,
          ordem: input.ordem ?? 0,
          arquivo_binario: arquivoBinario,
          nome_arquivo: input.nome_arquivo ?? null,
          mime_type: input.mime_type ?? null,
          tamanho_bytes: input.tamanho_bytes ?? (arquivoBinario ? arquivoBinario.length : null),
        })
        .returning<ItemImagemDbRow[]>('*')

      return mapRow(imagem)
    } catch (error) {
      remapPgError(error)
    }
  }

  async update(id: number, input: UpdateItemImagemInput) {
    const imagem = await db('item_imagens').select<ItemImagemDbRow[]>('*').where({ id }).first()

    if (!imagem) {
      throwNotFound('Imagem do item nao encontrada.')
    }

    if (input.item_id !== undefined) {
      await ensureItemExists(input.item_id)
    }

    const arquivoBinario =
      input.arquivo_base64 !== undefined ? decodeBase64Payload(input.arquivo_base64) : undefined
    const nextUrlImagem = input.url_imagem !== undefined ? (input.url_imagem ?? null) : imagem.url_imagem
    const nextArquivoBinario = arquivoBinario !== undefined ? arquivoBinario : imagem.arquivo_binario

    if (!nextUrlImagem && !nextArquivoBinario) {
      throw new DbServiceError(
        'A imagem precisa manter um arquivo ou URL valido mesmo ao editar apenas a ordem ou a descricao.',
        DB_ERROR_CODES.CHECK_VIOLATION,
        409,
      )
    }

    try {
      const [updated] = await db('item_imagens')
        .where({ id })
        .update(
          {
            ...(input.item_id !== undefined ? { item_id: input.item_id } : {}),
            ...(input.url_imagem !== undefined ? { url_imagem: nextUrlImagem } : {}),
            ...(input.descricao !== undefined ? { descricao: input.descricao ?? null } : {}),
            ...(input.ordem !== undefined ? { ordem: input.ordem } : {}),
            ...(arquivoBinario !== undefined ? { arquivo_binario: nextArquivoBinario } : {}),
            ...(input.nome_arquivo !== undefined ? { nome_arquivo: input.nome_arquivo ?? null } : {}),
            ...(input.mime_type !== undefined ? { mime_type: input.mime_type ?? null } : {}),
            ...(input.tamanho_bytes !== undefined
              ? { tamanho_bytes: input.tamanho_bytes ?? null }
              : arquivoBinario !== undefined
                ? { tamanho_bytes: arquivoBinario ? arquivoBinario.length : null }
                : {}),
          },
          ['*'],
        )

      return mapRow(updated as ItemImagemDbRow)
    } catch (error) {
      remapPgError(error)
    }
  }

  async remove(id: number) {
    const imagem = await db('item_imagens').select('id').where({ id }).first()

    if (!imagem) {
      throwNotFound('Imagem do item nao encontrada.')
    }

    await db('item_imagens').where({ id }).del()
  }
}
