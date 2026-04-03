import { z } from 'zod'

const HISTORICO_DESCRICAO_MAX_LENGTH = 2000

function normalizeOptionalString(value: unknown) {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export { HISTORICO_DESCRICAO_MAX_LENGTH }

export const CreateHistoricoDTO = z.object({
  item_id: z.coerce.number().int().positive(),
  tipo_evento: z.enum(['emprestado', 'devolvido', 'manutencao', 'cadastro', 'atualizacao']),
  descricao: z.preprocess(
    normalizeOptionalString,
    z
      .string()
      .max(HISTORICO_DESCRICAO_MAX_LENGTH, 'Descricao muito longa.')
      .nullable()
      .optional(),
  ),
  usuario_responsavel: z.preprocess(
    normalizeOptionalString,
    z
      .string()
      .max(150, 'Usuario responsavel muito longo.')
      .nullable()
      .optional(),
  ),
})

export const UpdateHistoricoDTO = CreateHistoricoDTO.partial()

export type CreateHistoricoInput = z.infer<typeof CreateHistoricoDTO>
export type UpdateHistoricoInput = z.infer<typeof UpdateHistoricoDTO>
