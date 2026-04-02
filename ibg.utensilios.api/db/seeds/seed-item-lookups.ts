import 'dotenv/config'

import { closeDbConnection, db } from '../../src/db/knex'

async function ensureEstados() {
  const estados = ['Novo', 'Bom', 'Manutenção', 'Danificado']

  for (const descricao of estados) {
    const existing = await db('item_estados')
      .select<{ id: number }[]>('id')
      .whereRaw('lower(descricao) = lower(?)', [descricao])
      .first()

    if (!existing) {
      await db('item_estados').insert({ descricao, ativo: 'S' })
    }
  }
}

async function ensureCategorias() {
  const categorias = [
    'Áudio',
    'Vídeo',
    'Iluminação',
    'Mobiliário',
    'Instrumentos',
    'Utensílios Cozinha',
    'Diversos',
  ]

  for (const descricao of categorias) {
    const existing = await db('item_categorias')
      .select<{ id: number }[]>('id')
      .whereRaw('lower(descricao) = lower(?)', [descricao])
      .first()

    if (!existing) {
      await db('item_categorias').insert({ descricao, ativo: 'S' })
    }
  }
}

async function main() {
  await ensureEstados()
  await ensureCategorias()
  console.log('Seed de categorias e estados concluido')
}

main()
  .catch((error) => {
    console.error('Erro no seed de lookups:', error)
    process.exit(1)
  })
  .finally(async () => {
    await closeDbConnection()
  })
