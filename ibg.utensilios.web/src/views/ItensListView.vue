<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { type QTableProps } from 'quasar'

import CrudIconDialog from '@/components/crud/CrudIconDialog.vue'
import CrudListShell from '@/components/crud/CrudListShell.vue'
import MobileCrudCard from '@/components/crud/MobileCrudCard.vue'
import { useResponsiveCrudList } from '@/composables/useResponsiveCrudList'
import { deleteItem, listItens, type Item } from '@/services/modules'

const router = useRouter()
const { tableDense, tableGrid } = useResponsiveCrudList()

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
    return 'Nenhum item cadastrado ate agora.'
  }

  return 'Nenhum item encontrado para a pesquisa informada.'
})

async function loadItems() {
  loading.value = true
  errorMessage.value = ''

  try {
    items.value = await listItens()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel listar os itens.'
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
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel excluir o item.'
  }
}

onMounted(() => {
  void loadItems()
})
</script>

<template>
  <CrudListShell
    v-model:search-term="searchTerm"
    title="Itens cadastrados"
    :total="items.length"
    search-aria-label="Pesquisar itens cadastrados"
    search-placeholder="Pesquisar por descricao, estado, categoria ou total..."
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
      :rows="filteredItems"
      :columns="columns"
      :loading="loading"
      :grid="tableGrid"
      row-key="id"
      class="crud-list-table items-table"
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
          <MobileCrudCard :title="props.row.descricao">
            <div class="mobile-chip-row">
              <span class="mobile-pill">{{ props.row.estado || 'Sem estado' }}</span>
              <span class="mobile-pill mobile-pill-secondary">{{ props.row.categoria || 'Sem categoria' }}</span>
            </div>
            <p class="mobile-copy-line">
              <span class="mobile-copy-label">Total:</span>
              {{ props.row.quantidade_total }}
            </p>

            <template #actions>
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
    v-if="pendingDeleteItem"
    title="Confirmar exclusao"
    confirm-label="Confirmar exclusao"
    cancel-label="Cancelar exclusao"
    confirm-tone="danger"
    @close="closeDeleteModal"
    @confirm="confirmDelete"
  >
    <p>Deseja excluir o item <strong>{{ pendingDeleteItem.descricao }}</strong>?</p>
  </CrudIconDialog>
</template>

<style scoped>
.description-cell {
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.45;
  font-size: 0.86rem;
  font-weight: 600;
  color: #172033;
}

.total-cell {
  font-weight: 800;
  color: #172033;
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

.mobile-pill-secondary {
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}
</style>
