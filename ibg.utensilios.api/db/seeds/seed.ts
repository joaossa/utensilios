import 'dotenv/config'
import bcrypt from 'bcryptjs'

import { closeDbConnection, db } from '../../src/db/knex'

function readBoolEnv(name: string, fallback = false) {
  const value = process.env[name]?.trim().toLowerCase()

  if (!value) {
    return fallback
  }

  return ['1', 'true', 'yes', 'sim'].includes(value)
}

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

async function ensureAdminUser() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim() || 'admin@utensilios.local'
  const password = process.env.SEED_ADMIN_PASSWORD?.trim()

  if (!password) {
    throw new Error('SEED_ADMIN_PASSWORD nao definido.')
  }

  const senhaHash = await bcrypt.hash(password, 10)
  const existing = await db('membros')
    .select<{ id: number }[]>('id')
    .whereRaw('lower(email) = ?', [email.toLowerCase()])
    .first()

  if (existing) {
    await db('membros')
      .where({ id: existing.id })
      .update({
        senha_hash: senhaHash,
        role: 'ADMIN',
        ativo: true,
      })

    console.log(`Acesso administrador atualizado para o membro ${email}`)
    return
  }

  await db('membros').insert({
    nome: 'Administrador Inicial',
    email,
    senha_hash: senhaHash,
    role: 'ADMIN',
    tipo: 'lideranca',
    ativo: true,
  })

  console.log(`Membro administrador ${email} criado`)
}

async function ensureSampleData() {
  const membro = await db('membros')
    .select<{ id: number }[]>('id')
    .where({ email: 'membro@ibg.local' })
    .first()

  if (!membro) {
    await db('membros').insert({
      nome: 'Membro Exemplo',
      telefone: '(71) 99999-0001',
      email: 'membro@ibg.local',
      tipo: 'membro',
      ativo: true,
    })
  }

  const item = await db('itens')
    .select<{ id: number }[]>('id')
    .where((builder) => {
      builder.where({ codigo: '1' }).orWhere({ descricao: 'Caixa de som portatil' })
    })
    .first()

  if (!item) {
    const categoria = await db('item_categorias')
      .select<{ id: number }[]>('id')
      .whereRaw('lower(descricao) = lower(?)', ['Áudio'])
      .first()

    const estado = await db('item_estados')
      .select<{ id: number }[]>('id')
      .whereRaw('lower(descricao) = lower(?)', ['Bom'])
      .first()

    await db('itens').insert({
      codigo: '1',
      descricao: 'Caixa de som portatil',
      categoria: 'Áudio',
      categoria_id: categoria?.id ?? null,
      estado: 'bom',
      estado_id: estado?.id ?? null,
      localizacao: 'Sala principal',
    })
  }
}

async function main() {
  await ensureEstados()
  await ensureCategorias()
  await ensureAdminUser()

  if (readBoolEnv('SEED_INCLUDE_SAMPLE_DATA', false)) {
    await ensureSampleData()
  }
}

main()
  .catch((error) => {
    console.error('Erro no seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await closeDbConnection()
  })
