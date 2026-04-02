import { z } from 'zod'

export const CreateEmprestimoDTO = z.object({
  item_id: z.number().int().positive(),
  membro_id: z.number().int().positive(),
  quantidade: z.coerce.number().int().positive(),
  data_prevista_devolucao: z.string().datetime(),
  observacoes: z.string().trim().nullable().optional(),
})

export const UpdateEmprestimoDTO = CreateEmprestimoDTO.partial()

export type CreateEmprestimoInput = z.infer<typeof CreateEmprestimoDTO>
export type UpdateEmprestimoInput = z.infer<typeof UpdateEmprestimoDTO>
