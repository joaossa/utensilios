<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { type QTableProps } from 'quasar'

import CrudIconDialog from '@/components/crud/CrudIconDialog.vue'
import CrudListShell from '@/components/crud/CrudListShell.vue'
import MobileCrudCard from '@/components/crud/MobileCrudCard.vue'
import { useResponsiveCrudList } from '@/composables/useResponsiveCrudList'
import { deleteHistorico, listHistorico, type Historico } from '@/services/modules'

const router = useRouter()
const { tableDense, tableGrid } = useResponsiveCrudList()

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
  <CrudListShell
    v-model:search-term="searchTerm"
    title="Historico cadastrado"
    :total="historicos.length"
    search-aria-label="Pesquisar registros de historico"
    search-placeholder="Pesquisar por item, evento, descricao ou responsavel..."
    layout="wide"
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
      :rows="filteredHistoricos"
      :columns="columns"
      :loading="loading"
      :grid="tableGrid"
      row-key="id"
      class="crud-list-table history-table"
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
          <MobileCrudCard :title="props.row.item_descricao || 'Item sem descricao'">
            <div class="mobile-chip-row">
              <span class="mobile-pill">{{ getTipoLabel(props.row.tipo_evento) }}</span>
            </div>
            <p class="mobile-copy-line">
              <span class="mobile-copy-label">Descricao:</span>
              {{ props.row.descricao || 'Nao informada' }}
            </p>
            <p class="mobile-copy-line">
              <span class="mobile-copy-label">Responsavel:</span>
              {{ props.row.usuario_responsavel || 'Nao informado' }}
            </p>
            <p class="mobile-copy-line">
              <span class="mobile-copy-label">Data:</span>
              {{ formatDateTime(props.row.data_evento) }}
            </p>

            <template #actions>
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
    v-if="pendingDeleteRecord"
    title="Confirmar exclusao"
    confirm-label="Confirmar exclusao"
    cancel-label="Cancelar exclusao"
    confirm-tone="danger"
    :busy="deleting"
    @close="closeDeleteModal"
    @confirm="confirmDelete"
  >
    <p>
      Deseja excluir o registro <strong>#{{ pendingDeleteRecord.id }}</strong> do item
      <strong>{{ pendingDeleteRecord.item_descricao || 'selecionado' }}</strong>?
    </p>
  </CrudIconDialog>
</template>

<style scoped>
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
</style>
