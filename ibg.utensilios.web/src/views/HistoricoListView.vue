<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar, type QTableProps } from 'quasar'

import { deleteHistorico, listHistorico, type Historico } from '@/services/modules'

const router = useRouter()
const $q = useQuasar()

const historicos = ref<Historico[]>([])
const loading = ref(false)
const errorMessage = ref('')
const searchTerm = ref('')
const pendingDeleteRecord = ref<Historico | null>(null)
const deleting = ref(false)
const pagination = ref({
  rowsPerPage: 0,
  sortBy: 'item_descricao',
  descending: false,
})

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function normalizeText(value: string | number | null | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getTipoLabel(tipo: Historico['tipo_evento']) {
  if (tipo === 'cadastro') return 'Cadastro'
  if (tipo === 'atualizacao') return 'Atualizacao'
  if (tipo === 'manutencao') return 'Manutencao'
  if (tipo === 'emprestado') return 'Emprestado'
  return 'Devolvido'
}

const columns: QTableProps['columns'] = [
  {
    name: 'item_descricao',
    required: true,
    label: 'Item',
    field: (row: Historico) => row.item_descricao || 'Item sem descricao',
    align: 'left',
    sortable: true,
  },
  {
    name: 'tipo_evento',
    label: 'Evento',
    field: (row: Historico) => getTipoLabel(row.tipo_evento),
    align: 'center',
    sortable: true,
  },
  {
    name: 'descricao',
    label: 'Descricao',
    field: (row: Historico) => row.descricao || 'Nao informada',
    align: 'left',
    sortable: true,
  },
  {
    name: 'usuario_responsavel',
    label: 'Responsavel',
    field: (row: Historico) => row.usuario_responsavel || 'Nao informado',
    align: 'left',
    sortable: true,
  },
  {
    name: 'data_evento',
    label: 'Data',
    field: (row: Historico) => formatDateTime(row.data_evento),
    align: 'left',
    sortable: true,
  },
  {
    name: 'acoes',
    label: 'Acoes',
    field: (row: Historico) => row.id,
    align: 'right',
  },
]

const filteredHistoricos = computed(() => {
  const term = normalizeText(searchTerm.value)

  if (!term) {
    return historicos.value
  }

  return historicos.value.filter((historico) => {
    const searchable = [
      historico.id,
      historico.item_codigo,
      historico.item_descricao,
      getTipoLabel(historico.tipo_evento),
      historico.descricao,
      historico.usuario_responsavel,
      historico.data_evento,
      formatDateTime(historico.data_evento),
    ]

    return searchable.some((value) => normalizeText(value).includes(term))
  })
})

const noDataMessage = computed(() => {
  if (historicos.value.length === 0) {
    return 'Nenhum registro de historico cadastrado ate agora.'
  }

  return 'Nenhum registro encontrado para a pesquisa informada.'
})

async function loadHistorico() {
  loading.value = true
  errorMessage.value = ''

  try {
    historicos.value = await listHistorico()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Nao foi possivel listar o historico.'
  } finally {
    loading.value = false
  }
}

function goToDashboard() {
  void router.push({ name: 'dashboard' })
}

function goToCreate() {
  void router.push({ name: 'history' })
}

function editHistorico(id: number) {
  void router.push({ name: 'history-edit', params: { id } })
}

function requestDelete(historico: Historico) {
  pendingDeleteRecord.value = historico
  errorMessage.value = ''
}

function closeDeleteModal() {
  pendingDeleteRecord.value = null
}

async function confirmDelete() {
  if (!pendingDeleteRecord.value || deleting.value) {
    return
  }

  deleting.value = true
  errorMessage.value = ''

  try {
    await deleteHistorico(pendingDeleteRecord.value.id)
    closeDeleteModal()
    await loadHistorico()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Nao foi possivel excluir o historico.'
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  void loadHistorico()
})
</script>

<template>
  <main class="module-page">
    <section class="module-shell">
      <header class="module-header">
        <div class="module-header-copy">
          <h1 class="list-title">Historico cadastrado</h1>
          <p class="module-total">(Total: {{ historicos.length }})</p>
        </div>

        <label class="search-box" aria-label="Pesquisar registros de historico">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm8.9 11.5 1.4 1.4-2 2-1.4-1.4-2.8-2.8 2-2 2.8 2.8Z"/>
          </svg>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Pesquisar por item, evento, descricao, responsavel..."
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
          :rows="filteredHistoricos"
          :columns="columns"
          :loading="loading"
          :grid="$q.screen.lt.md"
          row-key="id"
          class="items-table history-table"
        >
          <template #body-cell-item_descricao="props">
            <q-td :props="props" class="item-cell">
              {{ props.row.item_descricao || 'Item sem descricao' }}
            </q-td>
          </template>

          <template #body-cell-tipo_evento="props">
            <q-td :props="props">
              <span class="status-chip">{{ getTipoLabel(props.row.tipo_evento) }}</span>
            </q-td>
          </template>

          <template #body-cell-descricao="props">
            <q-td :props="props" class="description-cell">
              {{ props.row.descricao || 'Nao informada' }}
            </q-td>
          </template>

          <template #body-cell-usuario_responsavel="props">
            <q-td :props="props" class="responsible-cell">
              {{ props.row.usuario_responsavel || 'Nao informado' }}
            </q-td>
          </template>

          <template #body-cell-data_evento="props">
            <q-td :props="props" class="date-cell">
              {{ formatDateTime(props.row.data_evento) }}
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
                  aria-label="Editar historico"
                  title="Editar historico"
                  @click="editHistorico(props.row.id)"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  class="action-icon action-icon-delete"
                  aria-label="Excluir historico"
                  title="Excluir historico"
                  @click="requestDelete(props.row)"
                />
              </div>
            </q-td>
          </template>

          <template #item="props">
            <div class="mobile-grid-item">
              <article class="mobile-card">
                <div class="mobile-copy">
                  <h2>{{ props.row.item_descricao || 'Item sem descricao' }}</h2>
                  <p><strong>Evento:</strong> {{ getTipoLabel(props.row.tipo_evento) }}</p>
                  <p><strong>Descricao:</strong> {{ props.row.descricao || 'Nao informada' }}</p>
                  <p><strong>Responsavel:</strong> {{ props.row.usuario_responsavel || 'Nao informado' }}</p>
                  <p><strong>Data:</strong> {{ formatDateTime(props.row.data_evento) }}</p>
                </div>

                <div class="mobile-actions">
                  <q-btn
                    flat
                    round
                    dense
                    icon="edit"
                    class="action-icon action-icon-edit"
                    aria-label="Editar historico"
                    title="Editar historico"
                    @click="editHistorico(props.row.id)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    color="negative"
                    class="action-icon action-icon-delete"
                    aria-label="Excluir historico"
                    title="Excluir historico"
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

    <div v-if="pendingDeleteRecord" class="modal-backdrop" @click.self="closeDeleteModal">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-history-title">
        <div class="modal-copy">
          <h2 id="delete-history-title">Confirmar exclusao</h2>
          <p>
            Deseja excluir o registro
            <strong>#{{ pendingDeleteRecord.id }}</strong>
            do item
            <strong>{{ pendingDeleteRecord.item_descricao || 'selecionado' }}</strong>?
          </p>
        </div>
        <div class="modal-actions">
          <button
            type="button"
            class="icon-button icon-button-danger modal-icon"
            title="Confirmar exclusao"
            aria-label="Confirmar exclusao"
            :disabled="deleting"
            @click="confirmDelete"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9.55 18.2 4.8 13.45l1.4-1.4 3.35 3.35 8.25-8.25 1.4 1.4-9.65 9.65Z"/>
            </svg>
          </button>
          <button
            type="button"
            class="icon-button modal-icon"
            title="Cancelar exclusao"
            aria-label="Cancelar exclusao"
            @click="closeDeleteModal"
          >
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
  padding: clamp(18px, 2.8vw, 28px);
  display: grid;
  grid-template-columns: auto minmax(280px, 1fr) auto;
  gap: 20px;
  align-items: center;
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

.list-title {
  font-size: clamp(1.35rem, 1rem + 0.9vw, 1.85rem) !important;
  font-weight: 800 !important;
  line-height: 1.2 !important;
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

.items-table,
.history-table {
  border-radius: 20px;
  overflow: hidden;
}

.items-table :deep(.q-table__top),
.items-table :deep(.q-table__bottom),
.history-table :deep(.q-table__top),
.history-table :deep(.q-table__bottom) {
  display: none;
}

.items-table :deep(.q-table thead tr),
.history-table :deep(.q-table thead tr) {
  background: #f5fbfb;
}

.items-table :deep(.q-table th),
.history-table :deep(.q-table th) {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #0f766e;
}

.items-table :deep(.q-table th),
.items-table :deep(.q-table td),
.history-table :deep(.q-table th),
.history-table :deep(.q-table td) {
  padding: 14px 16px;
}

.items-table :deep(.q-table tbody tr:nth-child(even)),
.history-table :deep(.q-table tbody tr:nth-child(even)) {
  background: #fcfefe;
}

.item-cell,
.description-cell,
.responsible-cell {
  max-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-cell {
  font-size: 0.94rem;
  font-weight: 600;
  color: #172033;
}

.date-cell {
  white-space: nowrap;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(0, 138, 124, 0.1);
  color: #0f766e;
  font-size: 0.84rem;
  font-weight: 800;
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
  .module-header {
    grid-template-columns: 1fr;
  }

  .header-actions {
    justify-content: flex-start;
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

  .status-chip {
    min-height: 26px;
    padding: 0 10px;
    font-size: 0.78rem;
  }

  .icon-button {
    width: 36px;
    height: 36px;
  }
}
</style>
