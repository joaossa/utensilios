const CREATE_TABLES_SQL = `
CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE IF NOT EXISTS public.itens (
  id serial PRIMARY KEY,
  codigo varchar(50) NOT NULL UNIQUE,
  descricao varchar(255) NOT NULL,
  categoria varchar(100) NULL,
  estado varchar(20) NOT NULL DEFAULT 'bom',
  localizacao varchar(150) NULL,
  data_cadastro timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT itens_estado_check
    CHECK (estado IN ('novo', 'bom', 'manutencao', 'danificado'))
);

CREATE INDEX IF NOT EXISTS idx_itens_categoria ON public.itens (categoria);

CREATE TABLE IF NOT EXISTS public.item_imagens (
  id serial PRIMARY KEY,
  item_id integer NOT NULL REFERENCES public.itens(id) ON DELETE CASCADE,
  url_imagem text NOT NULL,
  descricao varchar(255) NULL,
  ordem integer NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.membros (
  id serial PRIMARY KEY,
  nome varchar(150) NOT NULL,
  telefone varchar(20) NULL,
  cpf varchar(11) NULL,
  email varchar(150) NULL,
  senha_hash varchar(255) NULL,
  role varchar(20) NOT NULL DEFAULT 'OPERADOR',
  tipo varchar(30) NOT NULL DEFAULT 'membro',
  ativo boolean NOT NULL DEFAULT true,
  ultimo_login timestamp NULL,
  data_cadastro timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT membros_role_check
    CHECK (role IN ('ADMIN', 'OPERADOR', 'LEITURA')),
  CONSTRAINT membros_tipo_check
    CHECK (tipo IN ('membro', 'lideranca', 'visitante_autorizado'))
);

CREATE INDEX IF NOT EXISTS idx_membros_nome ON public.membros (nome);
CREATE UNIQUE INDEX IF NOT EXISTS idx_membros_email_unique
  ON public.membros (lower(email))
  WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_membros_cpf_unique
  ON public.membros (cpf)
  WHERE cpf IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.emprestimos (
  id serial PRIMARY KEY,
  item_id integer NOT NULL REFERENCES public.itens(id) ON DELETE RESTRICT,
  membro_id integer NOT NULL REFERENCES public.membros(id) ON DELETE RESTRICT,
  data_retirada timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_prevista_devolucao timestamp NOT NULL,
  data_devolucao timestamp NULL,
  status varchar(20) NOT NULL DEFAULT 'ativo',
  observacoes text NULL,
  CONSTRAINT emprestimos_status_check
    CHECK (status IN ('ativo', 'devolvido', 'atrasado'))
);

CREATE INDEX IF NOT EXISTS idx_emprestimos_status ON public.emprestimos (status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_item_emprestimo_ativo
  ON public.emprestimos (item_id)
  WHERE status = 'ativo';

CREATE TABLE IF NOT EXISTS public.historico_item (
  id serial PRIMARY KEY,
  item_id integer NOT NULL REFERENCES public.itens(id) ON DELETE CASCADE,
  tipo_evento varchar(30) NOT NULL,
  descricao text NULL,
  data_evento timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_responsavel varchar(150) NULL,
  CONSTRAINT historico_item_tipo_evento_check
    CHECK (tipo_evento IN ('emprestado', 'devolvido', 'manutencao', 'cadastro', 'atualizacao'))
);

CREATE INDEX IF NOT EXISTS idx_historico_item ON public.historico_item (item_id);
`

const DROP_TABLES_SQL = `
DROP TABLE IF EXISTS public.historico_item;
DROP TABLE IF EXISTS public.emprestimos;
DROP TABLE IF EXISTS public.item_imagens;
DROP TABLE IF EXISTS public.itens;
DROP TABLE IF EXISTS public.membros;
`

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.raw(CREATE_TABLES_SQL)
}

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.raw(DROP_TABLES_SQL)
}
