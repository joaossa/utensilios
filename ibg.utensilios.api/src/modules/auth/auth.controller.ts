import type { Request, Response } from 'express'

import { LoginDTO } from './auth.dto'
import { AuthService } from './auth.service'

const service = new AuthService()

export class AuthController {
  async login(req: Request, res: Response) {
    const parsed = LoginDTO.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Dados invalidos para login.',
        errors: parsed.error.flatten(),
      })
    }

    try {
      const result = await service.login(parsed.data.email, parsed.data.senha)
      return res.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel autenticar.'
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
