<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { type QTableProps } from 'quasar'

import CrudIconDialog from '@/components/crud/CrudIconDialog.vue'
import CrudListShell from '@/components/crud/CrudListShell.vue'
import MobileCrudCard from '@/components/crud/MobileCrudCard.vue'
import { useResponsiveCrudList } from '@/composables/useResponsiveCrudList'
import {
  deleteEmprestimo,
  listEmprestimos,
  returnEmprestimo,
  type Emprestimo,
} from '@/services/modules'

const router = useRouter()
const { tableDense, tableGrid } = useResponsiveCrudList()

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
    label: 'Acoes',
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
  <CrudListShell
    v-model:search-term="searchTerm"
    title="Emprestimos cadastrados"
    :total="emprestimos.length"
    search-aria-label="Pesquisar emprestimos cadastrados"
    search-placeholder="Pesquisar por membro, item, status ou data..."
  >
    <template #actions>
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
        class="module-exit-icon"
        aria-label="Sair do sistema"
        @click="goToDashboard"
      />
    </template>

    <template #status>
      <p v-if="errorMessage" class="feedback error">{{ errorMessage }}</p>
    </template>

    <q-table
      v-if="!errorMessage"
      v-model:pagination="pagination"
      flat
      bordered
      hide-bottom
      :dense="tableDense"
      :rows="filteredEmprestimos"
      :columns="columns"
      :loading="loading"
      :grid="tableGrid"
      row-key="id"
      class="crud-list-table loans-table"
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
          <MobileCrudCard :title="props.row.membro_nome || 'Nao informado'">
            <div class="mobile-chip-row">
              <span class="mobile-pill" :class="`mobile-pill--${props.row.status}`">
                {{ getStatusLabel(props.row.status) }}
              </span>
            </div>
            <p class="mobile-copy-line">
              <span class="mobile-copy-label">Devolver em:</span>
              {{ formatDateTime(props.row.data_prevista_devolucao) }}
            </p>
            <p class="mobile-copy-line">
              <span class="mobile-copy-label">Itens:</span>
              {{ getLoanItemsDisplay(props.row).join(' • ') }}
            </p>

            <template #actions>
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
            </template>
          </MobileCrudCard>
        </div>
      </template>

      <template #no-data>
        <p class="crud-list-no-data">{{ noDataMessage }}</p>
      </template>
    </q-table>
  </CrudListShell>

  <CrudIconDialog
    v-if="pendingDeleteLoan"
    title="Confirmar exclusao"
    confirm-label="Confirmar exclusao"
    cancel-label="Cancelar exclusao"
    confirm-tone="danger"
    :busy="deleting"
    @close="closeDeleteModal"
    @confirm="confirmDelete"
  >
    <p>
      Deseja excluir o emprestimo <strong>#{{ pendingDeleteLoan.id }}</strong> de
      <strong>{{ pendingDeleteLoan.membro_nome || 'membro selecionado' }}</strong>?
    </p>
  </CrudIconDialog>

  <CrudIconDialog
    v-if="pendingReturnLoan"
    title="Registrar devolucao"
    confirm-label="Confirmar devolucao"
    cancel-label="Cancelar devolucao"
    :busy="returning"
    @close="closeReturnModal"
    @confirm="confirmReturn"
  >
    <p>
      Confirmar devolucao do emprestimo <strong>#{{ pendingReturnLoan.id }}</strong> para
      <strong>{{ pendingReturnLoan.membro_nome || 'membro selecionado' }}</strong>?
    </p>
  </CrudIconDialog>
</template>

<style scoped>
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

.status-ativo,
.mobile-pill--ativo {
  background: rgba(0, 138, 124, 0.1);
  color: #0f766e;
}

.status-devolvido,
.mobile-pill--devolvido {
  background: rgba(148, 163, 184, 0.15);
  color: #475569;
}

.status-atrasado,
.mobile-pill--atrasado {
  background: rgba(249, 115, 22, 0.15);
  color: #c2410c;
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
</style>
