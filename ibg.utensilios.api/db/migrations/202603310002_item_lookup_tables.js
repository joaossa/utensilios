const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS public.item_estados (
  id serial PRIMARY KEY,
  descricao varchar(50) NOT NULL,
  ativo char(1) NOT NULL DEFAULT 'S',
  CONSTRAINT item_estados_ativo_check CHECK (ativo IN ('S', 'N'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_item_estados_descricao_unique
  ON public.item_estados (lower(descricao));

CREATE TABLE IF NOT EXISTS public.item_categorias (
  id serial PRIMARY KEY,
  descricao varchar(100) NOT NULL,
  ativo char(1) NOT NULL DEFAULT 'S',
  CONSTRAINT item_categorias_ativo_check CHECK (ativo IN ('S', 'N'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_item_categorias_descricao_unique
  ON public.item_categorias (lower(descricao));

INSERT INTO public.item_estados (descricao, ativo)
SELECT x.descricao, 'S'
  FROM (VALUES ('Novo'), ('Bom'), ('Manutenção'), ('Danificado')) AS x(descricao)
 WHERE NOT EXISTS (
   SELECT 1 FROM public.item_estados e WHERE lower(e.descricao) = lower(x.descricao)
 );

INSERT INTO public.item_categorias (descricao, ativo)
SELECT x.descricao, 'S'
  FROM (VALUES ('Áudio'), ('Vídeo'), ('Iluminação'), ('Mobiliário'), ('Instrumentos'), ('Diversos')) AS x(descricao)
 WHERE NOT EXISTS (
   SELECT 1 FROM public.item_categorias c WHERE lower(c.descricao) = lower(x.descricao)
 );

INSERT INTO public.item_categorias (descricao, ativo)
SELECT DISTINCT trim(i.categoria), 'S'
  FROM public.itens i
 WHERE i.categoria IS NOT NULL
   AND trim(i.categoria) <> ''
   AND NOT EXISTS (
     SELECT 1
       FROM public.item_categorias c
      WHERE lower(c.descricao) = lower(trim(i.categoria))
   );

ALTER TABLE public.itens
  ADD COLUMN IF NOT EXISTS categoria_id integer NULL REFERENCES public.item_categorias(id),
  ADD COLUMN IF NOT EXISTS estado_id integer NULL REFERENCES public.item_estados(id);

UPDATE public.itens i
   SET estado_id = e.id
  FROM public.item_estados e
 WHERE i.estado_id IS NULL
   AND (
     (i.estado = 'novo' AND lower(e.descricao) = 'novo')
     OR (i.estado = 'bom' AND lower(e.descricao) = 'bom')
     OR (i.estado = 'manutencao' AND lower(e.descricao) = lower('Manutenção'))
     OR (i.estado = 'danificado' AND lower(e.descricao) = 'danificado')
   );

UPDATE public.itens i
   SET categoria_id = c.id
  FROM public.item_categorias c
 WHERE i.categoria_id IS NULL
   AND i.categoria IS NOT NULL
   AND trim(i.categoria) <> ''
   AND lower(c.descricao) = lower(trim(i.categoria));

UPDATE public.itens
   SET estado_id = (
     SELECT id FROM public.item_estados WHERE lower(descricao) = 'bom' LIMIT 1
   )
 WHERE estado_id IS NULL;
`

const ROLLBACK_SQL = `
ALTER TABLE public.itens
  DROP COLUMN IF EXISTS categoria_id,
  DROP COLUMN IF EXISTS estado_id;

DROP TABLE IF EXISTS public.item_categorias;
DROP TABLE IF EXISTS public.item_estados;
`

exports.up = async function up(knex) {
  await knex.raw(MIGRATION_SQL)
}

exports.down = async function down(knex) {
  await knex.raw(ROLLBACK_SQL)
}
