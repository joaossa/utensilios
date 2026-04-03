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
  private async findUsuarioByEmail(email: string) {
    return db('membros')
      .select<MembroAuthRow[]>('id', 'nome', 'email', 'senha_hash', 'role', 'ativo')
      .whereRaw('lower(email) = ?', [email.toLowerCase()])
      .first()
  }

  async checkEmail(email: string) {
    const usuario = await this.findUsuarioByEmail(email)

    if (!usuario) {
      throw new Error('Nenhuma conta foi encontrada com este e-mail.')
    }

    if (!usuario.ativo) {
      throw new Error('Esta conta está inativa e não pode iniciar sessão.')
    }

    if (!usuario.senha_hash) {
      throw new Error('Esta conta ainda não possui palavra-passe cadastrada.')
    }

    return {
      encontrado: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    }
  }

  async login(email: string, senha: string) {
    const usuario = await this.findUsuarioByEmail(email)

    if (!usuario || !usuario.ativo || !usuario.senha_hash) {
      throw new Error('Não foi possível iniciar a sessão com este e-mail.')
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash)

    if (!senhaValida) {
      throw new Error('E-mail ou palavra-passe inválidos.')
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
