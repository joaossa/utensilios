import type { Request, Response } from 'express'

import { CheckEmailDTO, LoginDTO } from './auth.dto'
import { AuthService } from './auth.service'

const service = new AuthService()

export class AuthController {
  async checkEmail(req: Request, res: Response) {
    const parsed = CheckEmailDTO.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Os dados informados para verificar o e-mail são inválidos.',
        errors: parsed.error.flatten(),
      })
    }

    try {
      const result = await service.checkEmail(parsed.data.email)
      return res.json(result)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível verificar o e-mail informado.'
      const status = message.includes('Nenhuma conta') ? 404 : 400

      return res.status(status).json({ message })
    }
  }

  async login(req: Request, res: Response) {
    const parsed = LoginDTO.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Os dados informados para iniciar sessão são inválidos.',
        errors: parsed.error.flatten(),
      })
    }

    try {
      const result = await service.login(parsed.data.email, parsed.data.senha)
      return res.json(result)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível iniciar a sessão.'
      return res.status(401).json({ message })
    }
  }

  me(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Nao autenticado' })
    }

    return res.json({ usuario: req.user })
  }
}
