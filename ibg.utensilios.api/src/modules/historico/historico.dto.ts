import { z } from 'zod'

export const CreateHistoricoDTO = z.object({
  item_id: z.number().int().positive(),
  tipo_evento: z.enum(['emprestado', 'devolvido', 'manutencao', 'cadastro', 'atualizacao']),
  descricao: z.string().trim().nullable().optional(),
  usuario_responsavel: z.string().trim().max(150).nullable().optional(),
})

export const UpdateHistoricoDTO = CreateHistoricoDTO.partial()

export type CreateHistoricoInput = z.infer<typeof CreateHistoricoDTO>
export type UpdateHistoricoInput = z.infer<typeof UpdateHistoricoDTO>
