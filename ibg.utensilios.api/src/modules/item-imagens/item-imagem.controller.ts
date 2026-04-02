import type { Request, Response } from 'express'
import { z } from 'zod'

import { CreateItemImagemDTO, UpdateItemImagemDTO } from './item-imagem.dto'
import { ItemImagemService } from './item-imagem.service'

const IdParamDTO = z.object({
  id: z.coerce.number().int().positive(),
})

const ItemQueryDTO = z.object({
  item_id: z.coerce.number().int().positive(),
})

const service = new ItemImagemService()

export class ItemImagemController {
  async list(req: Request, res: Response) {
    const parsed = ItemQueryDTO.safeParse(req.query)

    if (!parsed.success) {
      return res.status(400).json({ message: 'Item invalido para listar imagens.' })
    }

    const imagens = await service.listByItemId(parsed.data.item_id)
    return res.json(imagens)
  }

  async create(req: Request, res: Response) {
    const parsed = CreateItemImagemDTO.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Dados invalidos para imagem do item.',
        errors: parsed.error.flatten(),
      })
    }

    const imagem = await service.create(parsed.data)
    return res.status(201).json(imagem)
  }

  async update(req: Request, res: Response) {
    const parsedParams = IdParamDTO.safeParse(req.params)
    const parsedBody = UpdateItemImagemDTO.safeParse(req.body)

    if (!parsedParams.success || !parsedBody.success) {
      return res.status(400).json({ message: 'Dados invalidos para atualizar imagem do item.' })
    }

    const imagem = await service.update(parsedParams.data.id, parsedBody.data)
    return res.json(imagem)
  }

  async remove(req: Request, res: Response) {
    const parsed = IdParamDTO.safeParse(req.params)

    if (!parsed.success) {
      return res.status(400).json({ message: 'Identificador de imagem invalido.' })
    }

    await service.remove(parsed.data.id)
    return res.status(204).send()
  }
}
