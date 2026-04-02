/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('itens', (table) => {
    table.integer('quantidade_total').notNullable().defaultTo(1)
  })

  await knex.raw(`
    ALTER TABLE public.itens
    ADD CONSTRAINT itens_quantidade_total_check
    CHECK (quantidade_total > 0);
  `)

  await knex.schema.alterTable('emprestimos', (table) => {
    table.integer('quantidade').notNullable().defaultTo(1)
  })

  await knex.raw(`
    ALTER TABLE public.emprestimos
    ADD CONSTRAINT emprestimos_quantidade_check
    CHECK (quantidade > 0);
  `)

  await knex.raw(`
    DROP INDEX IF EXISTS public.uq_item_emprestimo_ativo;
  `)
}

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.raw(`
    ALTER TABLE public.emprestimos
    DROP CONSTRAINT IF EXISTS emprestimos_quantidade_check;
  `)

  await knex.schema.alterTable('emprestimos', (table) => {
    table.dropColumn('quantidade')
  })

  await knex.raw(`
    ALTER TABLE public.itens
    DROP CONSTRAINT IF EXISTS itens_quantidade_total_check;
  `)

  await knex.schema.alterTable('itens', (table) => {
    table.dropColumn('quantidade_total')
  })

  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_item_emprestimo_ativo
      ON public.emprestimos (item_id)
      WHERE status = 'ativo';
  `)
}
