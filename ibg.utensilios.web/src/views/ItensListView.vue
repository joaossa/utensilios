<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar, type QTableProps } from 'quasar'

import { deleteItem, listItens, type Item } from '@/services/modules'

const router = useRouter()
const $q = useQuasar()

const items = ref<Item[]>([])
const loading = ref(false)
const errorMessage = ref('')
const searchTerm = ref('')
const pendingDeleteItem = ref<Item | null>(null)
const pagination = ref({
  rowsPerPage: 0,
  sortBy: 'descricao',
  descending: false,
})

const columns: QTableProps['columns'] = [
  {
    name: 'descricao',
    required: true,
    label: 'DESCRICAO',
    field: 'descricao',
    align: 'left',
    sortable: true,
  },
  {
    name: 'quantidade_total',
    label: 'TOTAL',
    field: 'quantidade_total',
    align: 'center',
    sortable: true,
  },
  {
    name: 'acoes',
    label: 'ACOES',
    field: (row: Item) => row.id,
    align: 'right',
  },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function normalizeText(value: string | number | null | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const filteredItems = computed(() => {
  const term = normalizeText(searchTerm.value)

  if (!term) {
    return items.value
  }

  return items.value.filter((item) => {
    const searchable = [
      item.codigo,
      item.descricao,
      item.categoria,
      item.estado,
      item.localizacao,
      item.quantidade_total,
      item.quantidade_emprestada,
      item.quantidade_disponivel,
      item.data_cadastro,
      formatDate(item.data_cadastro),
    ]

    return searchable.some((value) => normalizeText(value).includes(term))
  })
})

const noDataMessage = computed(() => {
  if (items.value.length === 0) {
    return 'Nenhum item cadastrado atÃ© agora.'
  }

  return 'Nenhum item encontrado para a pesquisa informada.'
})

async function loadItems() {
  loading.value = true
  errorMessage.value = ''
  try {
    items.value = await listItens()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'NÃ£o foi possÃ­vel listar os itens.'
  } finally {
    loading.value = false
  }
}

function goToDashboard() {
  void router.push({ name: 'dashboard' })
}

function goToCreate() {
  void router.push({ name: 'items-create' })
}

function editItem(id: number) {
  void router.push({ name: 'items-edit', params: { id } })
}

function openImages(id: number) {
  void router.push({ name: 'item-images', params: { id } })
}

function requestDelete(item: Item) {
  pendingDeleteItem.value = item
  errorMessage.value = ''
}

function closeDeleteModal() {
  pendingDeleteItem.value = null
}

async function confirmDelete() {
  if (!pendingDeleteItem.value) {
    return
  }

  try {
    await deleteItem(pendingDeleteItem.value.id)
    closeDeleteModal()
    await loadItems()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'NÃ£o foi possÃ­vel excluir o item.'
  }
}

onMounted(() => {
  void loadItems()
})
</script>

<template>
  <main class="module-page">
    <section class="module-shell">
      <header class="module-header">
        <div class="module-header-copy">
          <h1>Itens cadastrados</h1>
          <p class="module-total">(Total: {{ items.length }})</p>
        </div>

        <label class="search-box" aria-label="Pesquisar itens cadastrados">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm8.9 11.5 1.4 1.4-2 2-1.4-1.4-2.8-2.8 2-2 2.8 2.8Z"/>
          </svg>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Pesquisar por descricao ou total..."
          />
        </label>

        <div class="header-actions">
          <q-btn
            no-caps
            unelevated
            icon="add"
            label="Novo"
            class="header-action-primary"
            @click="goToCreate"
          />
          <q-btn
            round
            unelevated
            icon="logout"
            class="module-exit module-exit-icon"
            aria-label="Sair do sistema"
            @click="goToDashboard"
          />
        </div>
      </header>

      <section class="panel-card">
        <p v-if="errorMessage" class="feedback error">{{ errorMessage }}</p>

        <q-table
          v-else
          v-model:pagination="pagination"
          flat
          bordered
          dense
          hide-bottom
          :rows="filteredItems"
          :columns="columns"
          :loading="loading"
          :grid="$q.screen.lt.md"
          row-key="id"
          class="items-table"
        >
          <template #body-cell-descricao="props">
            <q-td :props="props" class="description-cell">
              {{ props.row.descricao }}
            </q-td>
          </template>

          <template #body-cell-quantidade_total="props">
            <q-td :props="props" class="total-cell">
              {{ props.row.quantidade_total }}
            </q-td>
          </template>

          <template #body-cell-acoes="props">
            <q-td :props="props">
              <div class="row-actions">
                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  class="action-icon action-icon-edit"
                  aria-label="Editar item"
                  title="Editar item"
                  @click="editItem(props.row.id)"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="image"
                  class="action-icon action-icon-image"
                  aria-label="Imagens do item"
                  title="Imagens do item"
                  @click="openImages(props.row.id)"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  class="action-icon action-icon-delete"
                  aria-label="Excluir item"
                  title="Excluir item"
                  @click="requestDelete(props.row)"
                />
              </div>
            </q-td>
          </template>

          <template #item="props">
            <div class="mobile-grid-item">
              <article class="mobile-card">
                <div class="mobile-copy">
                  <h2>{{ props.row.descricao }}</h2>
                  <p><strong>Total:</strong> {{ props.row.quantidade_total }}</p>
                </div>

                <div class="mobile-actions">
                  <q-btn
                    flat
                    round
                    dense
                    icon="edit"
                    class="action-icon action-icon-edit"
                    aria-label="Editar item"
                    title="Editar item"
                    @click="editItem(props.row.id)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="image"
                    class="action-icon action-icon-image"
                    aria-label="Imagens do item"
                    title="Imagens do item"
                    @click="openImages(props.row.id)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    color="negative"
                    class="action-icon action-icon-delete"
                    aria-label="Excluir item"
                    title="Excluir item"
                    @click="requestDelete(props.row)"
                  />
                </div>
              </article>
            </div>
          </template>

          <template #no-data>
            <div class="status-copy no-data-copy">
              {{ noDataMessage }}
            </div>
          </template>
        </q-table>
      </section>
    </section>

    <div v-if="pendingDeleteItem" class="modal-backdrop" @click.self="closeDeleteModal">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-item-title">
        <div class="modal-copy">
          <h2 id="delete-item-title">Confirmar exclusÃ£o</h2>
          <p>Deseja excluir o item <strong>{{ pendingDeleteItem.descricao }}</strong>?</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="icon-button icon-button-danger modal-icon" title="Confirmar exclusÃ£o" aria-label="Confirmar exclusÃ£o" @click="confirmDelete">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9.55 18.2 4.8 13.45l1.4-1.4 3.35 3.35 8.25-8.25 1.4 1.4-9.65 9.65Z"/>
            </svg>
          </button>
          <button type="button" class="icon-button modal-icon" title="Cancelar exclusÃ£o" aria-label="Cancelar exclusÃ£o" @click="closeDeleteModal">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m12 10.6 4.95-4.95 1.4 1.4L13.4 12l4.95 4.95-1.4 1.4L12 13.4l-4.95 4.95-1.4-1.4L10.6 12 5.65 7.05l1.4-1.4L12 10.6Z"/>
            </svg>
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.module-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(0, 138, 124, 0.12), transparent 34%),
    linear-gradient(180deg, #f3f7f7 0%, #edf3f4 100%);
  padding: clamp(16px, 3vw, 28px);
  box-sizing: border-box;
}

.module-shell {
  width: min(100%, 1180px);
  margin: 0 auto;
  display: grid;
  gap: 18px;
}

.module-header,
.panel-card,
.modal-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(219, 228, 232, 0.95);
  border-radius: 24px;
  box-shadow: 0 14px 30px rgba(15, 35, 33, 0.07);
}

.module-header {
  width: min(100%, 560px);
  box-sizing: border-box;
  justify-self: center;
  padding: clamp(18px, 2.8vw, 28px);
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  align-items: stretch;
}

.module-header-copy {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.module-header h1,
.modal-copy h2,
.mobile-copy h2 {
  margin: 0;
  color: #172033;
}

.module-header h1 {
  font-size: clamp(1.35rem, 1rem + 0.9vw, 1.85rem);
  font-weight: 800;
  line-height: 1.2;
}

.module-total,
.status-copy,
.modal-copy p,
.mobile-copy p {
  margin: 0;
  color: #536579;
  line-height: 1.6;
}

.search-box {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid #c8d5d9;
  background: #fff;
}

.search-box svg {
  width: 18px;
  height: 18px;
  fill: #536579;
  flex: 0 0 auto;
}

.search-box input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #172033;
  font: inherit;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.module-exit,
.ghost-button {
  min-height: 44px;
  border-radius: 999px;
  padding: 0 16px;
  font-weight: 700;
  font: inherit;
  border: 1px solid #c8d5d9;
  background: #fff;
  color: #172033;
}

.header-action-primary {
  min-height: 44px;
  border-radius: 999px;
  padding: 0 18px;
  background: linear-gradient(135deg, #008a7c 0%, #0f766e 100%);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 10px 22px rgba(15, 35, 33, 0.08);
}

.module-exit-icon {
  width: 44px;
  min-width: 44px;
  padding: 0;
  color: #0f766e;
  border-color: rgba(15, 118, 110, 0.18);
  box-shadow: 0 6px 18px rgba(15, 35, 33, 0.06);
}

.panel-card {
  width: min(100%, 560px);
  box-sizing: border-box;
  justify-self: center;
  padding: 20px;
  display: grid;
  gap: 14px;
}

.feedback.error {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 700;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.items-table {
  border-radius: 20px;
  overflow: hidden;
}

.items-table :deep(.q-table__top),
.items-table :deep(.q-table__bottom) {
  display: none;
}

.items-table :deep(.q-table thead tr) {
  background: #f5fbfb;
}

.items-table :deep(.q-table th) {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #0f766e;
}

.items-table :deep(.q-table th),
.items-table :deep(.q-table td) {
  padding: 10px 12px;
  font-size: 0.8rem;
}

.items-table :deep(.q-table tbody tr:nth-child(even)) {
  background: #fcfefe;
}

.description-cell {
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.45;
}

.description-cell {
  font-size: 0.86rem;
  font-weight: 600;
  color: #172033;
}

.total-cell {
  font-weight: 800;
  color: #172033;
}

.row-actions,
.modal-actions,
.mobile-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

:deep(.action-icon) {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 12px;
}

:deep(.action-icon .q-icon) {
  font-size: 1.1rem;
}

:deep(.action-icon-edit) {
  color: #0f766e;
  background: rgba(0, 138, 124, 0.1);
}

:deep(.action-icon-image) {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
}

:deep(.action-icon-delete) {
  background: rgba(239, 68, 68, 0.1);
}

.mobile-grid-item {
  width: 100%;
  padding: 2px;
}

.mobile-card {
  border: 1px solid #dbe4e8;
  border-radius: 18px;
  background: #fcfefe;
  padding: 16px;
  display: grid;
  gap: 14px;
}

.mobile-copy {
  display: grid;
  gap: 6px;
}

.mobile-copy h2 {
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.35;
}

.mobile-copy strong {
  color: #172033;
}

.no-data-copy {
  padding: 18px 10px;
}

.icon-button {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid #c8d5d9;
  background: #fff;
  color: #172033;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.icon-button svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.icon-button-danger {
  border-color: #fecaca;
  background: #fff1f2;
  color: #b91c1c;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.34);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  width: min(100%, 420px);
  padding: 22px;
  display: grid;
  gap: 18px;
}

.modal-copy {
  display: grid;
  gap: 8px;
}

.modal-icon {
  width: 48px;
  height: 48px;
}

@media (max-width: 920px) {
  .header-actions {
    justify-content: flex-end;
    width: 100%;
  }
}

@media (max-width: 720px) {
  .panel-card {
    padding: 16px;
  }

  .module-exit,
  .ghost-button {
    width: 100%;
  }

  .module-exit-icon {
    width: 44px;
  }

  .header-action-primary {
    flex: 1 1 auto;
  }

  .modal-actions,
  .mobile-actions {
    justify-content: flex-start;
  }

  .mobile-actions {
    flex-wrap: wrap;
    gap: 10px;
  }

  .icon-button {
    width: 36px;
    height: 36px;
  }
}
</style>

