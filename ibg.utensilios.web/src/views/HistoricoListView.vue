<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { deleteHistorico, listHistorico, type Historico } from '@/services/modules'

const router = useRouter()

const historicos = ref<Historico[]>([])
const loading = ref(false)
const errorMessage = ref('')
const searchTerm = ref('')
const pendingDeleteRecord = ref<Historico | null>(null)
const deleting = ref(false)

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
          <h1>Historico cadastrado</h1>
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
          <button type="button" class="ghost-button" @click="goToCreate">Novo historico</button>
          <button type="button" class="module-exit" @click="goToDashboard">Sair</button>
        </div>
      </header>

      <section class="panel-card">
        <p v-if="loading" class="status-copy">Carregando historico...</p>
        <p v-else-if="errorMessage" class="feedback error">{{ errorMessage }}</p>
        <p v-else-if="historicos.length === 0" class="status-copy">Nenhum registro de historico cadastrado ate agora.</p>
        <p v-else-if="filteredHistoricos.length === 0" class="status-copy">
          Nenhum registro encontrado para a pesquisa informada.
        </p>

        <div v-else class="list-grid">
          <article v-for="historico in filteredHistoricos" :key="historico.id" class="list-row">
            <div class="item-main">
              <h3>{{ historico.item_descricao || 'Item sem descricao' }}</h3>
            </div>

            <div class="item-cell item-state">
              <span class="status-chip">{{ getTipoLabel(historico.tipo_evento) }}</span>
            </div>

            <dl class="item-cell info-cell">
              <dt>Descricao</dt>
              <dd>{{ historico.descricao || 'Nao informada' }}</dd>
            </dl>

            <dl class="item-cell info-cell">
              <dt>Responsavel</dt>
              <dd>{{ historico.usuario_responsavel || 'Nao informado' }}</dd>
            </dl>

            <dl class="item-cell info-cell">
              <dt>Data</dt>
              <dd>{{ formatDateTime(historico.data_evento) }}</dd>
            </dl>

            <div class="row-actions">
              <button
                type="button"
                class="icon-button"
                title="Editar historico"
                aria-label="Editar historico"
                @click="editHistorico(historico.id)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 20h4l10-10-4-4L4 16v4Zm3.2-1.5H5.5v-1.7l8.1-8.1 1.7 1.7-8.1 8.1ZM19 9l-4-4 1.2-1.2a1.7 1.7 0 0 1 2.4 0l1.6 1.6a1.7 1.7 0 0 1 0 2.4L19 9Z"/>
                </svg>
              </button>
              <button
                type="button"
                class="icon-button icon-button-danger"
                title="Excluir historico"
                aria-label="Excluir historico"
                @click="requestDelete(historico)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm-1 11h12l1-13H5l1 13Z"/>
                </svg>
              </button>
            </div>
          </article>
        </div>
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
.item-main h3,
.modal-copy h2 {
  margin: 0;
  color: #172033;
}

.module-total,
.status-copy,
.modal-copy p {
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

.list-grid {
  display: grid;
  gap: 12px;
}

.list-row {
  border-radius: 20px;
  border: 1px solid #dbe4e8;
  background: #fcfefe;
  padding: 16px 18px;
  display: grid;
  grid-template-columns:
    minmax(190px, 1.4fr)
    minmax(120px, 0.9fr)
    minmax(220px, 1.6fr)
    minmax(160px, 1.1fr)
    minmax(130px, 1fr)
    auto;
  gap: 12px;
  align-items: center;
}

.item-main h3 {
  font-size: 1rem;
  line-height: 1.35;
}

.item-cell {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.item-cell dt {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.68rem;
  font-weight: 800;
  color: #0f766e;
}

.item-cell dd {
  margin: 0;
  color: #536579;
  line-height: 1.35;
  font-size: 0.92rem;
}

.info-cell dd {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-state {
  display: flex;
  justify-content: center;
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
.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
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
  }
}

@media (max-width: 860px) {
  .list-row {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
  }

  .item-main,
  .item-cell,
  .item-state {
    grid-column: 1 / -1;
  }

  .row-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }

  .item-state {
    justify-content: flex-start;
  }

  .info-cell dd {
    white-space: normal;
  }
}

@media (max-width: 720px) {
  .module-exit,
  .ghost-button {
    width: 100%;
  }

  .modal-actions {
    justify-content: flex-start;
  }
}
</style>
