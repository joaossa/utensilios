const SQL = `
INSERT INTO public.item_categorias (descricao, ativo)
SELECT 'Utensílios Cozinha', 'S'
WHERE NOT EXISTS (
  SELECT 1
    FROM public.item_categorias
   WHERE lower(descricao) = lower('Utensílios Cozinha')
);
`

exports.up = async function up(knex) {
  await knex.raw(SQL)
}

exports.down = async function down(knex) {
  await knex('item_categorias')
    .whereRaw('lower(descricao) = lower(?)', ['Utensílios Cozinha'])
    .del()
}
