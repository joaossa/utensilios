const APPLY_AUTH_TO_MEMBROS_SQL = `
ALTER TABLE public.membros
  ADD COLUMN IF NOT EXISTS senha_hash varchar(255) NULL;

ALTER TABLE public.membros
  ADD COLUMN IF NOT EXISTS role varchar(20) NOT NULL DEFAULT 'OPERADOR';

ALTER TABLE public.membros
  ADD COLUMN IF NOT EXISTS ultimo_login timestamp NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'membros_role_check'
      AND conrelid = 'public.membros'::regclass
  ) THEN
    ALTER TABLE public.membros
      ADD CONSTRAINT membros_role_check
      CHECK (role IN ('ADMIN', 'OPERADOR', 'LEITURA'));
  END IF;
END $$;

DROP INDEX IF EXISTS public.idx_membros_email_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_membros_email_unique
  ON public.membros (lower(email))
  WHERE email IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'usuarios_auth'
  ) THEN
    UPDATE public.membros AS m
       SET nome = COALESCE(NULLIF(ua.nome, ''), m.nome),
           email = COALESCE(NULLIF(ua.email, ''), m.email),
           senha_hash = ua.senha_hash,
           role = COALESCE(ua.role, m.role),
           ativo = ua.ativo,
           ultimo_login = COALESCE(ua.ultimo_login, m.ultimo_login)
      FROM public.usuarios_auth AS ua
     WHERE ua.membro_id = m.id
        OR (
          ua.membro_id IS NULL
          AND m.email IS NOT NULL
          AND lower(m.email) = lower(ua.email)
        );

    INSERT INTO public.membros (
      nome,
      email,
      senha_hash,
      role,
      tipo,
      ativo,
      ultimo_login
    )
    SELECT ua.nome,
           ua.email,
           ua.senha_hash,
           COALESCE(ua.role, 'OPERADOR'),
           'membro',
           ua.ativo,
           ua.ultimo_login
      FROM public.usuarios_auth AS ua
     WHERE NOT EXISTS (
       SELECT 1
         FROM public.membros AS m
        WHERE m.id = ua.membro_id
           OR (
             m.email IS NOT NULL
             AND lower(m.email) = lower(ua.email)
           )
     );

    DROP TABLE public.usuarios_auth;
  END IF;
END $$;
`

const REVERT_AUTH_TO_MEMBROS_SQL = `
DROP INDEX IF EXISTS public.idx_membros_email_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_membros_email_unique
  ON public.membros (email)
  WHERE email IS NOT NULL;

ALTER TABLE public.membros
  DROP CONSTRAINT IF EXISTS membros_role_check;

ALTER TABLE public.membros
  DROP COLUMN IF EXISTS ultimo_login;

ALTER TABLE public.membros
  DROP COLUMN IF EXISTS role;

ALTER TABLE public.membros
  DROP COLUMN IF EXISTS senha_hash;
`

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.raw(APPLY_AUTH_TO_MEMBROS_SQL)
}

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.raw(REVERT_AUTH_TO_MEMBROS_SQL)
}
