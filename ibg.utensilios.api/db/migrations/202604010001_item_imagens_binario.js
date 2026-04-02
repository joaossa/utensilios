const MIGRATION_SQL = `
ALTER TABLE public.item_imagens
  ALTER COLUMN url_imagem DROP NOT NULL;

ALTER TABLE public.item_imagens
  ADD COLUMN IF NOT EXISTS arquivo_binario bytea NULL,
  ADD COLUMN IF NOT EXISTS nome_arquivo varchar(255) NULL,
  ADD COLUMN IF NOT EXISTS mime_type varchar(120) NULL,
  ADD COLUMN IF NOT EXISTS tamanho_bytes integer NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'item_imagens_conteudo_check'
       AND conrelid = 'public.item_imagens'::regclass
  ) THEN
    ALTER TABLE public.item_imagens
      ADD CONSTRAINT item_imagens_conteudo_check
      CHECK (url_imagem IS NOT NULL OR arquivo_binario IS NOT NULL);
  END IF;
END $$;
`

const ROLLBACK_SQL = `
ALTER TABLE public.item_imagens
  DROP CONSTRAINT IF EXISTS item_imagens_conteudo_check;

ALTER TABLE public.item_imagens
  DROP COLUMN IF EXISTS arquivo_binario,
  DROP COLUMN IF EXISTS nome_arquivo,
  DROP COLUMN IF EXISTS mime_type,
  DROP COLUMN IF EXISTS tamanho_bytes;

UPDATE public.item_imagens
   SET url_imagem = COALESCE(url_imagem, 'about:blank')
 WHERE url_imagem IS NULL;

ALTER TABLE public.item_imagens
  ALTER COLUMN url_imagem SET NOT NULL;
`

exports.up = async function up(knex) {
  await knex.raw(MIGRATION_SQL)
}

exports.down = async function down(knex) {
  await knex.raw(ROLLBACK_SQL)
}
