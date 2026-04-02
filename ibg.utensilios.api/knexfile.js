require('dotenv/config')

function getSearchPath(databaseUrl) {
  try {
    const schema = new URL(databaseUrl).searchParams.get('schema')?.trim()

    if (schema && schema.toLowerCase() !== 'public') {
      return [schema, 'public']
    }
  } catch {}

  return ['public']
}

function getConnectionString(databaseUrl) {
  try {
    const parsedUrl = new URL(databaseUrl)
    parsedUrl.searchParams.delete('schema')
    return parsedUrl.toString()
  } catch {
    return databaseUrl
  }
}

/** @type {import('knex').Knex.Config} */
module.exports = {
  client: 'pg',
  connection: getConnectionString(process.env.DATABASE_URL ?? ''),
  searchPath: getSearchPath(process.env.DATABASE_URL ?? ''),
  pool: {
    min: 0,
    max: 10,
  },
  migrations: {
    directory: './db/migrations',
    tableName: 'knex_migrations',
  },
}
