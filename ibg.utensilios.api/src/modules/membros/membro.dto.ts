import { z } from 'zod'

export const CreateMembroDTO = z.object({
  nome: z.string().trim().min(1).max(150),
  telefone: z.string().trim().max(20).nullable().optional(),
  cpf: z.string().trim().max(11).nullable().optional(),
  email: z.string().trim().toLowerCase().email().nullable().optional(),
  tipo: z.enum(['membro', 'lideranca', 'visitante_autorizado']).default('membro'),
  ativo: z.boolean().default(true),
})

export const UpdateMembroDTO = CreateMembroDTO.partial()

export type CreateMembroInput = z.infer<typeof CreateMembroDTO>
export type UpdateMembroInput = z.infer<typeof UpdateMembroDTO>
