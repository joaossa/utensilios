<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { type QTableProps } from 'quasar'

import CrudIconDialog from '@/components/crud/CrudIconDialog.vue'
import CrudListShell from '@/components/crud/CrudListShell.vue'
import MobileCrudCard from '@/components/crud/MobileCrudCard.vue'
import { useResponsiveCrudList } from '@/composables/useResponsiveCrudList'
import { deleteMembro, listMembros, type Membro } from '@/services/modules'
import { formatPhoneInput } from '@/utils/membro-fields'

const router = useRouter()
const { tableDense, tableGrid } = useResponsiveCrudList()

const membros = ref<Membro[]>([])
const loading = ref(false)
const errorMessage = ref('')
const searchTerm = ref('')
const pendingDeleteMember = ref<Membro | null>(null)
const deleting = ref(false)
const pagination = ref({
  rowsPerPage: 0,
  sortBy: 'nome',
  descending: false,
})

function normalizeText(value: string | number | boolean | null | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getTipoLabel(tipo: Membro['tipo']) {
  if (tipo === 'lideranca') return 'Lideranca'
  if (tipo === 'visitante_autorizado') return 'Visitante autorizado'
  return 'Membro'
}

const columns: QTableProps['columns'] = [
  {
    name: 'nome',
    required: true,
    label: 'Nome',
    field: 'nome',
    align: 'left',
    sortable: true,
    classes: 'name-column',
    headerClasses: 'name-column',
  },
  {
    name: 'telefone',
    label: 'Telefone',
    field: (row: Membro) => (row.telefone ? formatPhoneInput(row.telefone) : 'Nao informado'),
    align: 'left',
    sortable: true,
    style: 'width: 132px',
    headerStyle: 'width: 132px',
    classes: 'phone-column',
    headerClasses: 'phone-column',
  },
  {
    name: 'acoes',
    label: 'Acoes',
    field: (row: Membro) => row.id,
    align: 'right',
    style: 'width: 96px',
    headerStyle: 'width: 96px',
    classes: 'actions-column',
    headerClasses: 'actions-column',
  },
]

const filteredMembros = computed(() => {
  const term = normalizeText(searchTerm.value)

  if (!term) {
    return membros.value
  }

  return membros.value.filter((membro) => {
    const searchable = [
      membro.nome,
      getTipoLabel(membro.tipo),
      membro.telefone,
      formatPhoneInput(String(membro.telefone ?? '')),
      membro.ativo ? 'ativo' : 'inativo',
    ]

    return searchable.some((value) => normalizeText(value).includes(term))
  })
})

const noDataMessage = computed(() => {
  if (membros.value.length === 0) {
    return 'Nenhum membro cadastrado ate agora.'
  }

  return 'Nenhum membro encontrado para a pesquisa informada.'
})

async function loadMembros() {
  loading.value = true
  errorMessage.value = ''

  try {
    membros.value = await listMembros()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel listar os membros.'
  } finally {
    loading.value = false
  }
}

function goToDashboard() {
  void router.push({ name: 'dashboard' })
}

function goToCreate() {
  void router.push({ name: 'members' })
}

function editMembro(id: number) {
  void router.push({ name: 'members-edit', params: { id } })
}

function requestDelete(membro: Membro) {
  pendingDeleteMember.value = membro
  errorMessage.value = ''
}

function closeDeleteModal() {
  pendingDeleteMember.value = null
}

async function confirmDelete() {
  if (!pendingDeleteMember.value || deleting.value) {
    return
  }

  deleting.value = true
  errorMessage.value = ''

  try {
    await deleteMembro(pendingDeleteMember.value.id)
    closeDeleteModal()
    await loadMembros()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel excluir o membro.'
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  void loadMembros()
})
</script>

<template>
  <CrudListShell
    v-model:search-term="searchTerm"
    title="Membros cadastrados"
    :total="membros.length"
    search-aria-label="Pesquisar membros cadastrados"
    search-placeholder="Pesquisar por nome, tipo, telefone ou status..."
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
      :rows="filteredMembros"
      :columns="columns"
      :loading="loading"
      :grid="tableGrid"
      row-key="id"
      class="crud-list-table members-table"
    >
      <template #body-cell-nome="props">
        <q-td :props="props" class="name-cell">
          {{ props.row.nome }}
        </q-td>
      </template>

      <template #body-cell-telefone="props">
        <q-td :props="props" class="phone-cell">
          {{ props.row.telefone ? formatPhoneInput(props.row.telefone) : 'Nao informado' }}
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
              aria-label="Editar membro"
              title="Editar membro"
              @click="editMembro(props.row.id)"
            />
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              class="action-icon action-icon-delete"
              aria-label="Excluir membro"
              title="Excluir membro"
              @click="requestDelete(props.row)"
            />
          </div>
        </q-td>
      </template>

      <template #item="props">
        <div class="mobile-grid-item">
          <MobileCrudCard :title="props.row.nome">
            <div class="mobile-chip-row">
              <span class="mobile-pill">{{ getTipoLabel(props.row.tipo) }}</span>
              <span :class="['mobile-pill', props.row.ativo ? 'mobile-pill--active' : 'mobile-pill--inactive']">
                {{ props.row.ativo ? 'Ativo' : 'Inativo' }}
              </span>
            </div>
            <p class="mobile-copy-line">
              <span class="mobile-copy-label">Telefone:</span>
              {{ props.row.telefone ? formatPhoneInput(props.row.telefone) : 'Nao informado' }}
            </p>

            <template #actions>
              <q-btn
                flat
                round
                dense
                icon="edit"
                class="action-icon action-icon-edit"
                aria-label="Editar membro"
                title="Editar membro"
                @click="editMembro(props.row.id)"
              />
              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                class="action-icon action-icon-delete"
                aria-label="Excluir membro"
                title="Excluir membro"
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
    v-if="pendingDeleteMember"
    title="Confirmar exclusao"
    confirm-label="Confirmar exclusao"
    cancel-label="Cancelar exclusao"
    confirm-tone="danger"
    :busy="deleting"
    @close="closeDeleteModal"
    @confirm="confirmDelete"
  >
    <p>Deseja excluir o membro <strong>{{ pendingDeleteMember.nome }}</strong>?</p>
  </CrudIconDialog>
</template>

<style scoped>
.name-cell,
.phone-cell {
  max-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.phone-cell {
  text-align: right;
}

.members-table :deep(.phone-column) {
  width: 132px;
}

.members-table :deep(.actions-column) {
  width: 96px;
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

.mobile-pill--inactive {
  background: rgba(148, 163, 184, 0.15);
  color: #475569;
}
</style>
