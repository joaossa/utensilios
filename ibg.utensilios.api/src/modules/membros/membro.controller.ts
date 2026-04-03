import type { Request, Response } from 'express'
import { z, type ZodError } from 'zod'

import { CreateMembroDTO, UpdateMembroDTO } from './membro.dto'
import { MembroService } from './membro.service'

const IdParamDTO = z.object({
  id: z.coerce.number().int().positive(),
})

const service = new MembroService()

function getFirstValidationMessage(error: ZodError) {
  return error.issues[0]?.message || 'Dados invalidos para membro.'
}

export class MembroController {
  async list(_req: Request, res: Response) {
    const membros = await service.list()
    return res.json(membros)
  }

  async getById(req: Request, res: Response) {
    const parsed = IdParamDTO.safeParse(req.params)

    if (!parsed.success) {
      return res.status(400).json({ message: 'Identificador de membro invalido.' })
    }

    const membro = await service.getById(parsed.data.id)
    return res.json(membro)
  }

  async create(req: Request, res: Response) {
    const parsed = CreateMembroDTO.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: getFirstValidationMessage(parsed.error),
        errors: parsed.error.flatten(),
      })
    }

    const membro = await service.create(parsed.data)
    return res.status(201).json(membro)
  }

  async update(req: Request, res: Response) {
    const parsedParams = IdParamDTO.safeParse(req.params)
    const parsedBody = UpdateMembroDTO.safeParse(req.body)

    if (!parsedParams.success) {
      return res.status(400).json({ message: 'Identificador de membro invalido.' })
    }

    if (!parsedBody.success) {
      return res.status(400).json({
        message: getFirstValidationMessage(parsedBody.error),
        errors: parsedBody.error.flatten(),
      })
    }

    const membro = await service.update(parsedParams.data.id, parsedBody.data)
    return res.json(membro)
  }

  async remove(req: Request, res: Response) {
    const parsed = IdParamDTO.safeParse(req.params)

    if (!parsed.success) {
      return res.status(400).json({ message: 'Identificador de membro invalido.' })
    }

    await service.remove(parsed.data.id)
    return res.status(204).send()
  }
}
