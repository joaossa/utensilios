import cors from 'cors'
import express from 'express'

import { errorHandler } from './middlewares/error-handler'
import authRouter from './modules/auth/auth.router'
import emprestimoRouter from './modules/emprestimos/emprestimo.router'
import historicoRouter from './modules/historico/historico.router'
import itemImagemRouter from './modules/item-imagens/item-imagem.router'
import itemRouter from './modules/itens/item.router'
import membroRouter from './modules/membros/membro.router'

const app = express()

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Origin not allowed by CORS'))
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: '5mb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', system: 'ibg-utensilios-api' })
})

app.use('/auth', authRouter)
app.use('/itens', itemRouter)
app.use('/item-imagens', itemImagemRouter)
app.use('/membros', membroRouter)
app.use('/emprestimos', emprestimoRouter)
app.use('/historico', historicoRouter)

app.use(errorHandler)

export default app
