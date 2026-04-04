<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar, type QTableProps } from 'quasar'

import { deleteEmprestimo, listEmprestimos, returnEmprestimo, type Emprestimo } from '@/services/modules'

const router = useRouter()
const $q = useQuasar()

const emprestimos = ref<Emprestimo[]>([])
const loading = ref(false)
const errorMessage = ref('')
const searchTerm = ref('')
const pendingDeleteLoan = ref<Emprestimo | null>(null)
const pendingReturnLoan = ref<Emprestimo | null>(null)
const deleting = ref(false)
const returning = ref(false)
const pagination = ref({
  rowsPerPage: 0,
  sortBy: 'data_retirada',
  descending: true,
})

function formatDateTime(value: string | null) {
  if (!value) return 'Nao informado'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function normalizeText(value: string | number | null | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getStatusLabel(status: Emprestimo['status']) {
  if (status === 'devolvido') return 'Devolvido'
  if (status === 'atrasado') return 'Atrasado'
  return 'Ativo'
}

function formatLoanItem(item: Emprestimo['itens'][number]) {
  const nome = item.item_descricao || item.item_codigo || `Item ${item.item_id}`
  return item.quantidade > 1 ? `${nome} (${item.quantidade})` : nome
}

function getLoanItemsDisplay(emprestimo: Emprestimo) {
  if (emprestimo.itens.length === 0) {
    return ['Nao informado']
  }

  return emprestimo.itens.map((item) => formatLoanItem(item))
}

const columns: QTableProps['columns'] = [
  {
    name: 'membro_nome',
    required: true,
    label: 'Membro',
    field: (row: Emprestimo) => row.membro_nome || 'Nao informado',
    align: 'left',
    sortable: true,
  },
  {
    name: 'status',
    label: 'Status',
    field: (row: Emprestimo) => getStatusLabel(row.status),
    align: 'center',
    sortable: true,
  },
  {
    name: 'data_prevista_devolucao',
    label: 'Devolver em',
    field: (row: Emprestimo) => formatDateTime(row.data_prevista_devolucao),
    align: 'left',
    sortable: true,
  },
  {
    name: 'acoes',
    label: 'Ações',
    field: (row: Emprestimo) => row.id,
    align: 'right',
  },
]

const filteredEmprestimos = computed(() => {
  const term = normalizeText(searchTerm.value)

  if (!term) {
    return emprestimos.value
  }

  return emprestimos.value.filter((emprestimo) => {
    const searchable = [
      emprestimo.id,
      emprestimo.membro_nome,
      emprestimo.itens_resumo,
      emprestimo.quantidade_total,
      emprestimo.total_itens,
      getStatusLabel(emprestimo.status),
      emprestimo.observacoes,
      emprestimo.data_retirada,
      formatDateTime(emprestimo.data_retirada),
      emprestimo.data_prevista_devolucao,
      formatDateTime(emprestimo.data_prevista_devolucao),
      emprestimo.data_devolucao,
      formatDateTime(emprestimo.data_devolucao),
    ]

    return searchable.some((value) => normalizeText(value).includes(term))
  })
})

const noDataMessage = computed(() => {
  if (emprestimos.value.length === 0) {
    return 'Nenhum emprestimo cadastrado ate agora.'
  }

  return 'Nenhum emprestimo encontrado para a pesquisa informada.'
})

async function loadEmprestimos() {
  loading.value = true
  errorMessage.value = ''

  try {
    emprestimos.value = await listEmprestimos()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Nao foi possivel listar os emprestimos.'
  } finally {
    loading.value = false
  }
}

function goToDashboard() {
  void router.push({ name: 'dashboard' })
}

function goToCreate() {
  void router.push({ name: 'loans' })
}

function editEmprestimo(id: number) {
  void router.push({ name: 'loans-edit', params: { id } })
}

function requestDelete(emprestimo: Emprestimo) {
  pendingDeleteLoan.value = emprestimo
  errorMessage.value = ''
}

function closeDeleteModal() {
  pendingDeleteLoan.value = null
}

async function confirmDelete() {
  if (!pendingDeleteLoan.value || deleting.value) {
    return
  }

  deleting.value = true
  errorMessage.value = ''

  try {
    await deleteEmprestimo(pendingDeleteLoan.value.id)
    closeDeleteModal()
    await loadEmprestimos()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Nao foi possivel excluir o emprestimo.'
  } finally {
    deleting.value = false
  }
}

function requestReturn(emprestimo: Emprestimo) {
  pendingReturnLoan.value = emprestimo
  errorMessage.value = ''
}

function closeReturnModal() {
  pendingReturnLoan.value = null
}

async function confirmReturn() {
  if (!pendingReturnLoan.value || returning.value) {
    return
  }

  returning.value = true
  errorMessage.value = ''

  try {
    await returnEmprestimo(pendingReturnLoan.value.id)
    closeReturnModal()
    await loadEmprestimos()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Nao foi possivel registrar a devolucao.'
  } finally {
    returning.value = false
  }
}

onMounted(() => {
  void loadEmprestimos()
})
</script>

<template>
  <main class="module-page">
    <section class="module-shell">
      <header class="module-header">
        <div class="module-header-copy">
          <h1>Empréstimos cadastrados</h1>
          <p class="module-total">(Total: {{ emprestimos.length }})</p>
        </div>

        <label class="search-box" aria-label="Pesquisar emprestimos cadastrados">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm8.9 11.5 1.4 1.4-2 2-1.4-1.4-2.8-2.8 2-2 2.8 2.8Z"/>
          </svg>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Pesquisar por membro, item, status ou data..."
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
          :rows="filteredEmprestimos"
          :columns="columns"
          :loading="loading"
          :grid="$q.screen.lt.md"
          row-key="id"
          class="loans-table"
        >
          <template #body-cell-membro_nome="props">
            <q-td :props="props" class="member-cell">
              {{ props.row.membro_nome || 'Nao informado' }}
            </q-td>
          </template>

          <template #body-cell-status="props">
            <q-td :props="props">
              <span class="status-chip" :class="`status-${props.row.status}`">
                {{ getStatusLabel(props.row.status) }}
              </span>
            </q-td>
          </template>

          <template #body-cell-data_prevista_devolucao="props">
            <q-td :props="props" class="date-cell">
              {{ formatDateTime(props.row.data_prevista_devolucao) }}
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
                  aria-label="Editar emprestimo"
                  title="Editar emprestimo"
                  @click="editEmprestimo(props.row.id)"
                />
                <q-btn
                  v-if="props.row.status !== 'devolvido'"
                  flat
                  round
                  dense
                  icon="keyboard_return"
                  class="action-icon action-icon-return"
                  aria-label="Registrar devolucao"
                  title="Registrar devolucao"
                  @click="requestReturn(props.row)"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  class="action-icon action-icon-delete"
                  aria-label="Excluir emprestimo"
                  title="Excluir emprestimo"
                  @click="requestDelete(props.row)"
                />
              </div>
            </q-td>
          </template>

          <template #item="props">
            <div class="mobile-grid-item">
              <article class="mobile-card">
                <div class="mobile-copy">
                  <h2>{{ props.row.membro_nome || 'Nao informado' }}</h2>
                  <p><strong>Status:</strong> {{ getStatusLabel(props.row.status) }}</p>
                  <p><strong>Devolver em:</strong> {{ formatDateTime(props.row.data_prevista_devolucao) }}</p>
                </div>

                <div class="mobile-actions">
                  <q-btn
                    flat
                    round
                    dense
                    icon="edit"
                    class="action-icon action-icon-edit"
                    aria-label="Editar emprestimo"
                    title="Editar emprestimo"
                    @click="editEmprestimo(props.row.id)"
                  />
                  <q-btn
                    v-if="props.row.status !== 'devolvido'"
                    flat
                    round
                    dense
                    icon="keyboard_return"
                    class="action-icon action-icon-return"
                    aria-label="Registrar devolucao"
                    title="Registrar devolucao"
                    @click="requestReturn(props.row)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    color="negative"
                    class="action-icon action-icon-delete"
                    aria-label="Excluir emprestimo"
                    title="Excluir emprestimo"
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

    <div v-if="pendingDeleteLoan" class="modal-backdrop" @click.self="closeDeleteModal">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-loan-title">
        <div class="modal-copy">
          <h2 id="delete-loan-title">Confirmar exclusao</h2>
          <p>
            Deseja excluir o emprestimo
            <strong>#{{ pendingDeleteLoan.id }}</strong>
            de
            <strong>{{ pendingDeleteLoan.membro_nome || 'membro selecionado' }}</strong>?
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

    <div v-if="pendingReturnLoan" class="modal-backdrop" @click.self="closeReturnModal">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="return-loan-title">
        <div class="modal-copy">
          <h2 id="return-loan-title">Registrar devolucao</h2>
          <p>
            Confirmar devolucao do emprestimo
            <strong>#{{ pendingReturnLoan.id }}</strong>
            para
            <strong>{{ pendingReturnLoan.membro_nome || 'membro selecionado' }}</strong>?
          </p>
        </div>
        <div class="modal-actions">
          <button
            type="button"
            class="icon-button modal-icon"
            title="Confirmar devolucao"
            aria-label="Confirmar devolucao"
            :disabled="returning"
            @click="confirmReturn"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9.55 18.2 4.8 13.45l1.4-1.4 3.35 3.35 8.25-8.25 1.4 1.4-9.65 9.65Z"/>
            </svg>
          </button>
          <button
            type="button"
            class="icon-button modal-icon"
            title="Cancelar devolucao"
            aria-label="Cancelar devolucao"
            @click="closeReturnModal"
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

.loans-table {
  border-radius: 20px;
  overflow: hidden;
}

.loans-table :deep(.q-table__top),
.loans-table :deep(.q-table__bottom) {
  display: none;
}

.loans-table :deep(.q-table thead tr) {
  background: #f5fbfb;
}

.loans-table :deep(.q-table th) {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #0f766e;
}

.loans-table :deep(.q-table th),
.loans-table :deep(.q-table td) {
  padding: 10px 12px;
  font-size: 0.8rem;
}

.loans-table :deep(.q-table tbody tr:nth-child(even)) {
  background: #fcfefe;
}

.member-cell,
.date-cell {
  max-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 800;
}

.status-ativo {
  background: rgba(0, 138, 124, 0.1);
  color: #0f766e;
}

.status-devolvido {
  background: rgba(148, 163, 184, 0.15);
  color: #475569;
}

.status-atrasado {
  background: rgba(249, 115, 22, 0.15);
  color: #c2410c;
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

:deep(.action-icon-return) {
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
