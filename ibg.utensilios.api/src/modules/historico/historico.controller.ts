import type { Request, Response } from 'express'
import { z } from 'zod'

import { CreateHistoricoDTO, UpdateHistoricoDTO } from './historico.dto'
import { HistoricoService } from './historico.service'

const IdParamDTO = z.object({
  id: z.coerce.number().int().positive(),
})

const service = new HistoricoService()

export class HistoricoController {
  async list(_req: Request, res: Response) {
    const historico = await service.list()
    return res.json(historico)
  }

  async getById(req: Request, res: Response) {
    const parsed = IdParamDTO.safeParse(req.params)

    if (!parsed.success) {
      return res.status(400).json({ message: 'Identificador de historico invalido.' })
    }

    const historico = await service.getById(parsed.data.id)
    return res.json(historico)
  }

  async create(req: Request, res: Response) {
    const parsed = CreateHistoricoDTO.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Dados invalidos para historico.',
        errors: parsed.error.flatten(),
      })
    }

    const historico = await service.create(parsed.data)
    return res.status(201).json(historico)
  }

  async update(req: Request, res: Response) {
    const parsedParams = IdParamDTO.safeParse(req.params)
    const parsedBody = UpdateHistoricoDTO.safeParse(req.body)

    if (!parsedParams.success || !parsedBody.success) {
      return res.status(400).json({ message: 'Dados invalidos para atualizar historico.' })
    }

    const historico = await service.update(parsedParams.data.id, parsedBody.data)
    return res.json(historico)
  }

  async remove(req: Request, res: Response) {
    const parsed = IdParamDTO.safeParse(req.params)

    if (!parsed.success) {
      return res.status(400).json({ message: 'Identificador de historico invalido.' })
    }

    await service.remove(parsed.data.id)
    return res.status(204).send()
  }
}
