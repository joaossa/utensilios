import { z } from 'zod'

export const CreateItemDTO = z.object({
  descricao: z.string().trim().min(1, 'Descricao obrigatoria.').max(255, 'Descricao muito longa.'),
  categoria_id: z.coerce.number().int().positive(),
  estado_id: z.coerce.number().int().positive(),
  quantidade_total: z.coerce.number().int().positive('Quantidade total obrigatoria.'),
  localizacao: z.string().trim().max(150).nullable().optional(),
})

export const UpdateItemDTO = CreateItemDTO.partial()

export type CreateItemInput = z.infer<typeof CreateItemDTO>
export type UpdateItemInput = z.infer<typeof UpdateItemDTO>
