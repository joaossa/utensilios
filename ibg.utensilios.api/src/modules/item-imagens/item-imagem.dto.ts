import { z } from 'zod'

const OptionalOrderDTO = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  return value
}, z.coerce.number().int().min(0).optional())

const BaseItemImagemDTO = z.object({
  item_id: z.coerce.number().int().positive(),
  descricao: z.string().trim().max(255).nullable().optional(),
  ordem: OptionalOrderDTO,
  url_imagem: z.string().trim().url().max(4000).nullable().optional(),
  arquivo_base64: z.string().trim().min(1).nullable().optional(),
  nome_arquivo: z.string().trim().max(255).nullable().optional(),
  mime_type: z.string().trim().max(120).nullable().optional(),
  tamanho_bytes: z.coerce.number().int().min(1).nullable().optional(),
})

export const CreateItemImagemDTO = BaseItemImagemDTO.superRefine((value, ctx) => {
  if (!value.url_imagem && !value.arquivo_base64) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe uma URL da imagem ou envie o arquivo binario.',
      path: ['arquivo_base64'],
    })
  }
})

export const UpdateItemImagemDTO = BaseItemImagemDTO.partial().superRefine((value, ctx) => {
  const hasAnyField =
    value.item_id !== undefined ||
    value.descricao !== undefined ||
    value.ordem !== undefined ||
    value.url_imagem !== undefined ||
    value.arquivo_base64 !== undefined ||
    value.nome_arquivo !== undefined ||
    value.mime_type !== undefined ||
    value.tamanho_bytes !== undefined

  if (!hasAnyField) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Nenhum campo informado para atualizacao.',
    })
  }
})

export type CreateItemImagemInput = z.infer<typeof CreateItemImagemDTO>
export type UpdateItemImagemInput = z.infer<typeof UpdateItemImagemDTO>
