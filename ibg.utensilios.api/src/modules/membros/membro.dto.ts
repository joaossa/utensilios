import { z } from 'zod'

const VALID_BRAZIL_DDDS = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
])

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

function normalizeCpf(value: unknown) {
  const normalized = normalizeOptionalString(value)

  if (normalized === null || normalized === undefined || typeof normalized !== 'string') {
    return normalized
  }

  const digits = normalized.replace(/\D/g, '')
  return digits === '' ? null : digits
}

function normalizeEmail(value: unknown) {
  const normalized = normalizeOptionalString(value)

  if (normalized === null || normalized === undefined || typeof normalized !== 'string') {
    return normalized
  }

  return normalized.toLowerCase()
}

function isValidCpf(value: string) {
  if (!/^\d{11}$/.test(value)) {
    return false
  }

  if (/^(\d)\1{10}$/.test(value)) {
    return false
  }

  let firstSum = 0
  for (let index = 0; index < 9; index += 1) {
    firstSum += Number(value[index]) * (10 - index)
  }
  const firstDigit = (firstSum * 10) % 11 % 10

  let secondSum = 0
  for (let index = 0; index < 10; index += 1) {
    secondSum += Number(value[index]) * (11 - index)
  }
  const secondDigit = (secondSum * 10) % 11 % 10

  return firstDigit === Number(value[9]) && secondDigit === Number(value[10])
}

function isValidBrazilPhone(value: string) {
  const digits = value.replace(/\D/g, '')

  if (!(digits.length === 10 || digits.length === 11)) {
    return false
  }

  if (!VALID_BRAZIL_DDDS.has(digits.slice(0, 2))) {
    return false
  }

  const subscriberStart = digits[2]

  if (digits.length === 11) {
    return subscriberStart === '9'
  }

  return /^[2-5]$/.test(subscriberStart)
}

const telefoneSchema = z.preprocess(
  normalizeOptionalString,
  z
    .string()
    .max(20, 'Telefone muito longo.')
    .refine((value) => isValidBrazilPhone(value), 'Telefone invalido. Informe um telefone brasileiro valido com DDD.')
    .nullable()
    .optional(),
)

const cpfSchema = z.preprocess(
  normalizeCpf,
  z
    .string()
    .length(11, 'CPF invalido. Informe 11 digitos.')
    .regex(/^\d{11}$/, 'CPF invalido. Informe apenas numeros.')
    .refine((value) => isValidCpf(value), 'CPF invalido. Informe um CPF valido.')
    .nullable()
    .optional(),
)

const emailSchema = z.preprocess(
  normalizeEmail,
  z
    .string()
    .max(150, 'E-mail muito longo.')
    .email('E-mail invalido.')
    .nullable()
    .optional(),
)

export const CreateMembroDTO = z.object({
  nome: z.string().trim().min(1, 'Nome obrigatorio.').max(150, 'Nome muito longo.'),
  telefone: telefoneSchema,
  cpf: cpfSchema,
  email: emailSchema,
  tipo: z.enum(['membro', 'lideranca', 'visitante_autorizado']).default('membro'),
  ativo: z.boolean().default(true),
})

export const UpdateMembroDTO = CreateMembroDTO.partial()

export type CreateMembroInput = z.infer<typeof CreateMembroDTO>
export type UpdateMembroInput = z.infer<typeof UpdateMembroDTO>
