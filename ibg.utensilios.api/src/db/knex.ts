import 'dotenv/config'

import knex, { type Knex } from 'knex'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL nao definido')
}

function getSearchPath(databaseUrl: string) {
  try {
    const schema = new URL(databaseUrl).searchParams.get('schema')?.trim()

    if (schema && schema.toLowerCase() !== 'public') {
      return [schema, 'public']
    }
  } catch {}

  return ['public']
}

function getConnectionString(databaseUrl: string) {
  try {
    const parsedUrl = new URL(databaseUrl)
    parsedUrl.searchParams.delete('schema')
    return parsedUrl.toString()
  } catch {
    return databaseUrl
  }
}

const config: Knex.Config = {
  client: 'pg',
  connection: getConnectionString(process.env.DATABASE_URL),
  searchPath: getSearchPath(process.env.DATABASE_URL),
  pool: {
    min: 0,
    max: 10,
  },
}

export const db = knex(config)

export async function testDbConnection() {
  await db.raw('select 1 as ok')
}

export async function closeDbConnection() {
  await db.destroy()
}
