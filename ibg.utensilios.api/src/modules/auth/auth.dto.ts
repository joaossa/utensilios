import { z } from 'zod'

export const LoginDTO = z.object({
  email: z.string().trim().toLowerCase().email(),
  senha: z.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
})

export const CheckEmailDTO = z.object({
  email: z.string().trim().toLowerCase().email(),
})

export type LoginInput = z.infer<typeof LoginDTO>
export type CheckEmailInput = z.infer<typeof CheckEmailDTO>
