import 'dotenv/config'

import app from './app'
import { closeDbConnection, testDbConnection } from './db/knex'

async function bootstrap() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL nao definido')
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET nao definido')
  }

  await testDbConnection()

  const port = Number(process.env.PORT ?? 3001)

  app.listen(port, '0.0.0.0', () => {
    console.log(`API IBG Utensilios rodando na porta ${port}`)
  })
}

process.on('SIGINT', async () => {
  await closeDbConnection()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await closeDbConnection()
  process.exit(0)
})

bootstrap().catch((error) => {
  console.error('Falha ao iniciar a API:', error)
  process.exit(1)
})
