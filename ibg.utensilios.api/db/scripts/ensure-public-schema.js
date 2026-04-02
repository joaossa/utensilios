require('dotenv/config')
const { Client } = require('pg')

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL nao definido')
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  await client.connect()
  await client.query('CREATE SCHEMA IF NOT EXISTS public')
  await client.end()
}

main().catch((error) => {
  console.error('Falha ao garantir schema public:', error)
  process.exit(1)
})
