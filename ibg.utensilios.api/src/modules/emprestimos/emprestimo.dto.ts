import { z } from 'zod'

const EMPRESTIMO_OBSERVACOES_MAX_LENGTH = 2000

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

function isFutureDateTime(value: string) {
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now()
}

const EmprestimoItemDTO = z.object({
  item_id: z.coerce.number().int().positive(),
  quantidade: z.coerce.number().int().positive('Quantidade obrigatoria.'),
})

const EmprestimoItensDTO = z
  .array(EmprestimoItemDTO)
  .min(1, 'Selecione ao menos um item para o emprestimo.')
  .refine((items) => new Set(items.map((item) => item.item_id)).size === items.length, {
    message: 'Nao repita o mesmo item no mesmo emprestimo.',
  })

export { EMPRESTIMO_OBSERVACOES_MAX_LENGTH }

export const CreateEmprestimoDTO = z.object({
  membro_id: z.coerce.number().int().positive(),
  data_prevista_devolucao: z
    .string()
    .datetime('Data de devolucao invalida.')
    .refine((value) => isFutureDateTime(value), 'A data de devolucao deve ser maior que a data e hora atuais.'),
  observacoes: z.preprocess(
    normalizeOptionalString,
    z
      .string()
      .max(EMPRESTIMO_OBSERVACOES_MAX_LENGTH, 'Observacao muito longa.')
      .nullable()
      .optional(),
  ),
  itens: EmprestimoItensDTO,
})

export const UpdateEmprestimoDTO = z
  .object({
    membro_id: z.coerce.number().int().positive().optional(),
    data_prevista_devolucao: z
      .string()
      .datetime('Data de devolucao invalida.')
      .refine((value) => isFutureDateTime(value), 'A data de devolucao deve ser maior que a data e hora atuais.')
      .optional(),
    observacoes: z.preprocess(
      normalizeOptionalString,
      z
        .string()
        .max(EMPRESTIMO_OBSERVACOES_MAX_LENGTH, 'Observacao muito longa.')
        .nullable()
        .optional(),
    ),
    itens: EmprestimoItensDTO.optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: 'Informe ao menos um campo para atualizar o emprestimo.',
  })

export type CreateEmprestimoInput = z.infer<typeof CreateEmprestimoDTO>
export type UpdateEmprestimoInput = z.infer<typeof UpdateEmprestimoDTO>
