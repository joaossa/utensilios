const CPF_LENGTH = 11
const NAME_MAX_LENGTH = 150
const EMAIL_MAX_LENGTH = 150
const PHONE_MAX_LENGTH = 20
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

const EMAIL_REGEX =
  /^(?=.{1,150}$)(?!\.)(?!.*\.\.)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/

export {
  CPF_LENGTH,
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PHONE_MAX_LENGTH,
}

export function onlyDigits(value: string | null | undefined) {
  return String(value ?? '').replace(/\D/g, '')
}

export function normalizeMemberName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function normalizeEmailInput(value: string) {
  return value.trim().toLowerCase()
}

export function formatCpfInput(value: string) {
  const digits = onlyDigits(value).slice(0, CPF_LENGTH)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function formatCpfDisplay(value: string | null | undefined) {
  return formatCpfInput(String(value ?? ''))
}

export function normalizeCpfForPayload(value: string) {
  const digits = onlyDigits(value)
  return digits === '' ? null : digits.slice(0, CPF_LENGTH)
}

export function isCpfValid(value: string) {
  const digits = onlyDigits(value)

  if (digits === '') return true
  if (!/^\d{11}$/.test(digits)) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  let firstSum = 0
  for (let index = 0; index < 9; index += 1) {
    firstSum += Number(digits[index]) * (10 - index)
  }
  const firstDigit = (firstSum * 10) % 11 % 10

  let secondSum = 0
  for (let index = 0; index < 10; index += 1) {
    secondSum += Number(digits[index]) * (11 - index)
  }
  const secondDigit = (secondSum * 10) % 11 % 10

  return firstDigit === Number(digits[9]) && secondDigit === Number(digits[10])
}

function hasValidBrazilDdd(digits: string) {
  return VALID_BRAZIL_DDDS.has(digits.slice(0, 2))
}

export function formatPhoneInput(value: string) {
  const digits = onlyDigits(value).slice(0, 11)

  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function normalizePhoneForPayload(value: string) {
  const masked = formatPhoneInput(value)
  return masked === '' ? null : masked.slice(0, PHONE_MAX_LENGTH)
}

export function isPhoneValid(value: string) {
  const digits = onlyDigits(value)

  if (digits === '') return true
  if (!(digits.length === 10 || digits.length === 11)) return false
  if (!hasValidBrazilDdd(digits)) return false

  const subscriberStart = digits[2] ?? ''

  if (digits.length === 11) {
    return subscriberStart === '9'
  }

  return /^[2-5]$/.test(subscriberStart)
}

export function isEmailValid(value: string) {
  const normalized = normalizeEmailInput(value)
  return normalized === '' || EMAIL_REGEX.test(normalized)
}
