import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { db } from '../../db/knex'

type MembroAuthRow = {
  id: number
  nome: string
  email: string
  senha_hash: string | null
  role: 'ADMIN' | 'OPERADOR' | 'LEITURA'
  ativo: boolean
}

export class AuthService {
  async login(email: string, senha: string) {
    const usuario = await db('membros')
      .select<MembroAuthRow[]>('id', 'nome', 'email', 'senha_hash', 'role', 'ativo')
      .whereRaw('lower(email) = ?', [email.toLowerCase()])
      .first()

    if (!usuario || !usuario.ativo || !usuario.senha_hash) {
      throw new Error('Usuario nao encontrado ou inativo.')
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash)

    if (!senhaValida) {
      throw new Error('E-mail ou senha invalidos.')
    }

    await db('membros').where({ id: usuario.id }).update({
      ultimo_login: new Date(),
    })

    const token = jwt.sign(
      {
        sub: usuario.id.toString(),
        email: usuario.email,
        role: usuario.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' },
    )

    return {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
    }
  }
}
