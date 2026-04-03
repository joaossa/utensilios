/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('item_emprestimos', (table) => {
    table.increments('id').primary()
    table.integer('emprestimo_id').notNullable().references('id').inTable('emprestimos').onDelete('CASCADE')
    table.integer('item_id').notNullable().references('id').inTable('itens').onDelete('RESTRICT')
    table.integer('quantidade').notNullable()
    table.unique(['emprestimo_id', 'item_id'], { indexName: 'uq_item_emprestimos_emprestimo_item' })
    table.index(['emprestimo_id'], 'idx_item_emprestimos_emprestimo_id')
    table.index(['item_id'], 'idx_item_emprestimos_item_id')
  })

  await knex.raw(`
    ALTER TABLE public.item_emprestimos
    ADD CONSTRAINT item_emprestimos_quantidade_check
    CHECK (quantidade > 0);
  `)

  await knex.raw(`
    INSERT INTO public.item_emprestimos (emprestimo_id, item_id, quantidade)
    SELECT id, item_id, quantidade
    FROM public.emprestimos;
  `)

  await knex.schema.alterTable('emprestimos', (table) => {
    table.dropColumn('item_id')
    table.dropColumn('quantidade')
  })
}

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.alterTable('emprestimos', (table) => {
    table.integer('item_id')
    table.integer('quantidade')
  })

  await knex.raw(`
    WITH ranked AS (
      SELECT
        ie.emprestimo_id,
        ie.item_id,
        ie.quantidade,
        row_number() OVER (PARTITION BY ie.emprestimo_id ORDER BY ie.id) AS rn
      FROM public.item_emprestimos ie
    )
    UPDATE public.emprestimos e
       SET item_id = ranked.item_id,
           quantidade = ranked.quantidade
      FROM ranked
     WHERE ranked.emprestimo_id = e.id
       AND ranked.rn = 1;
  `)

  await knex.raw(`
    WITH ranked AS (
      SELECT
        ie.emprestimo_id,
        ie.item_id,
        ie.quantidade,
        row_number() OVER (PARTITION BY ie.emprestimo_id ORDER BY ie.id) AS rn
      FROM public.item_emprestimos ie
    )
    INSERT INTO public.emprestimos (
      membro_id,
      data_retirada,
      data_prevista_devolucao,
      data_devolucao,
      status,
      observacoes,
      item_id,
      quantidade
    )
    SELECT
      e.membro_id,
      e.data_retirada,
      e.data_prevista_devolucao,
      e.data_devolucao,
      e.status,
      e.observacoes,
      ranked.item_id,
      ranked.quantidade
    FROM ranked
    JOIN public.emprestimos e
      ON e.id = ranked.emprestimo_id
    WHERE ranked.rn > 1;
  `)

  await knex.raw(`
    ALTER TABLE public.emprestimos
    ALTER COLUMN item_id SET NOT NULL;

    ALTER TABLE public.emprestimos
    ALTER COLUMN quantidade SET NOT NULL;

    ALTER TABLE public.emprestimos
    DROP CONSTRAINT IF EXISTS emprestimos_item_id_fkey;

    ALTER TABLE public.emprestimos
    ADD CONSTRAINT emprestimos_item_id_fkey
    FOREIGN KEY (item_id) REFERENCES public.itens(id) ON DELETE RESTRICT;

    ALTER TABLE public.emprestimos
    DROP CONSTRAINT IF EXISTS emprestimos_quantidade_check;

    ALTER TABLE public.emprestimos
    ADD CONSTRAINT emprestimos_quantidade_check
    CHECK (quantidade > 0);
  `)

  await knex.raw(`
    DROP TABLE IF EXISTS public.item_emprestimos;
  `)
}
