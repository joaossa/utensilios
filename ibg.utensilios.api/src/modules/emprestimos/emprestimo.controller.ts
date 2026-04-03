import type { Request, Response } from 'express'
import { z, type ZodError } from 'zod'

import { CreateEmprestimoDTO, UpdateEmprestimoDTO } from './emprestimo.dto'
import { EmprestimoService } from './emprestimo.service'

const IdParamDTO = z.object({
  id: z.coerce.number().int().positive(),
})

const service = new EmprestimoService()

function getFirstValidationMessage(error: ZodError) {
  return error.issues[0]?.message || 'Dados invalidos para emprestimo.'
}

export class EmprestimoController {
  async list(_req: Request, res: Response) {
    const emprestimos = await service.list()
    return res.json(emprestimos)
  }

  async getById(req: Request, res: Response) {
    const parsed = IdParamDTO.safeParse(req.params)

    if (!parsed.success) {
      return res.status(400).json({ message: 'Identificador de emprestimo invalido.' })
    }

    const emprestimo = await service.getById(parsed.data.id)
    return res.json(emprestimo)
  }

  async create(req: Request, res: Response) {
    const parsed = CreateEmprestimoDTO.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: getFirstValidationMessage(parsed.error),
        errors: parsed.error.flatten(),
      })
    }

    const emprestimo = await service.create(parsed.data, req.user?.email)
    return res.status(201).json(emprestimo)
  }

  async update(req: Request, res: Response) {
    const parsedParams = IdParamDTO.safeParse(req.params)
    const parsedBody = UpdateEmprestimoDTO.safeParse(req.body)

    if (!parsedParams.success) {
      return res.status(400).json({ message: 'Identificador de emprestimo invalido.' })
    }

    if (!parsedBody.success) {
      return res.status(400).json({
        message: getFirstValidationMessage(parsedBody.error),
        errors: parsedBody.error.flatten(),
      })
    }

    const emprestimo = await service.update(parsedParams.data.id, parsedBody.data, req.user?.email)
    return res.json(emprestimo)
  }

  async returnEmprestimo(req: Request, res: Response) {
    const parsed = IdParamDTO.safeParse(req.params)

    if (!parsed.success) {
      return res.status(400).json({ message: 'Identificador de emprestimo invalido.' })
    }

    try {
      const emprestimo = await service.returnEmprestimo(parsed.data.id, req.user?.email)
      return res.json(emprestimo)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel registrar a devolucao.'
      return res.status(400).json({ message })
    }
  }

  async remove(req: Request, res: Response) {
    const parsed = IdParamDTO.safeParse(req.params)

    if (!parsed.success) {
      return res.status(400).json({ message: 'Identificador de emprestimo invalido.' })
    }

    await service.remove(parsed.data.id)
    return res.status(204).send()
  }
}
