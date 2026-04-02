import type { Request, Response } from 'express'
import { z } from 'zod'

import { CreateItemDTO, UpdateItemDTO } from './item.dto'
import { ItemService } from './item.service'

const IdParamDTO = z.object({
  id: z.coerce.number().int().positive(),
})

const service = new ItemService()

export class ItemController {
  async formOptions(_req: Request, res: Response) {
    const options = await service.getFormOptions()
    return res.json(options)
  }

  async list(_req: Request, res: Response) {
    const items = await service.list()
    return res.json(items)
  }

  async getById(req: Request, res: Response) {
    const parsed = IdParamDTO.safeParse(req.params)

    if (!parsed.success) {
      return res.status(400).json({ message: 'Identificador de item invalido.' })
    }

    const item = await service.getById(parsed.data.id)
    return res.json(item)
  }

  async create(req: Request, res: Response) {
    const parsed = CreateItemDTO.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Dados invalidos para item.',
        errors: parsed.error.flatten(),
      })
    }

    const item = await service.create(parsed.data, req.user?.email)
    return res.status(201).json(item)
  }

  async update(req: Request, res: Response) {
    const parsedParams = IdParamDTO.safeParse(req.params)
    const parsedBody = UpdateItemDTO.safeParse(req.body)

    if (!parsedParams.success || !parsedBody.success) {
      return res.status(400).json({ message: 'Dados invalidos para atualizar item.' })
    }

    const item = await service.update(parsedParams.data.id, parsedBody.data, req.user?.email)
    return res.json(item)
  }

  async remove(req: Request, res: Response) {
    const parsed = IdParamDTO.safeParse(req.params)

    if (!parsed.success) {
      return res.status(400).json({ message: 'Identificador de item invalido.' })
    }

    await service.remove(parsed.data.id)
    return res.status(204).send()
  }
}
