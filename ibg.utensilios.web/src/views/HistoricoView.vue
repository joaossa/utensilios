<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  createHistorico,
  deleteHistorico,
  getHistorico,
  listHistorico,
  listItens,
  updateHistorico,
  type Historico,
  type HistoricoPayload,
  type Item,
} from '@/services/modules'

const HISTORICO_DESCRICAO_MAX_LENGTH = 2000
const RESPONSAVEL_MAX_LENGTH = 150

const router = useRouter()
const route = useRoute()

const editingId = computed(() => {
  const raw = route.params.id
  const id = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(id) && id > 0 ? id : null
})

const itens = ref<Item[]>([])
const totalHistoricos = ref<number | null>(null)
const loading = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const feedback = ref('')
const errorMessage = ref('')
const pendingDeleteRecord = ref<Historico | null>(null)
const historicoAtual = ref<Historico | null>(null)

const form = ref<{
  item_id: number | null
  tipo_evento: Historico['tipo_evento']
  descricao: string
  usuario_responsavel: string
}>({
  item_id: null,
  tipo_evento: 'atualizacao',
  descricao: '',
  usuario_responsavel: '',
})

const descricaoTrimmed = computed(() => form.value.descricao.trim())
const usuarioTrimmed = computed(() => form.value.usuario_responsavel.trim())
const descricaoLength = computed(() => descricaoTrimmed.value.length)
const usuarioLength = computed(() => usuarioTrimmed.value.length)
const isDescricaoTooLong = computed(() => descricaoLength.value > HISTORICO_DESCRICAO_MAX_LENGTH)
const isUsuarioTooLong = computed(() => usuarioLength.value > RESPONSAVEL_MAX_LENGTH)
const selectedItem = computed(() => itens.value.find((item) => item.id === form.value.item_id) ?? null)

const isFormValid = computed(() => {
  return (
    form.value.item_id !== null &&
    !isDescricaoTooLong.value &&
    !isUsuarioTooLong.value
  )
})

const submitLabel = computed(() => {
  if (submitting.value) return 'Salvando...'
  return editingId.value ? 'Salvar historico' : 'Cadastrar historico'
})

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function getTipoLabel(tipo: Historico['tipo_evento']) {
  if (tipo === 'cadastro') return 'Cadastro'
  if (tipo === 'atualizacao') return 'Atualizacao'
  if (tipo === 'manutencao') return 'Manutencao'
  if (tipo === 'emprestado') return 'Emprestado'
  return 'Devolvido'
}

function resetFormState() {
  form.value = {
    item_id: null,
    tipo_evento: 'atualizacao',
    descricao: '',
    usuario_responsavel: '',
  }
}

function populateForm(historico: Historico) {
  historicoAtual.value = historico
  form.value = {
    item_id: historico.item_id,
    tipo_evento: historico.tipo_evento,
    descricao: historico.descricao ?? '',
    usuario_responsavel: historico.usuario_responsavel ?? '',
  }
}

async function loadItems() {
  itens.value = await listItens()
}

async function loadHistoryCount() {
  totalHistoricos.value = (await listHistorico()).length
}

async function loadHistoryForEdit() {
  if (!editingId.value) {
    historicoAtual.value = null
    resetFormState()
    return
  }

  const historico = await getHistorico(editingId.value)
  populateForm(historico)
}

async function loadScreen() {
  loading.value = true
  feedback.value = ''
  errorMessage.value = ''

  try {
    await Promise.all([loadItems(), loadHistoryCount(), loadHistoryForEdit()])
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Nao foi possivel preparar a tela de historico.'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!isFormValid.value) {
    errorMessage.value = 'Corrija os campos destacados antes de salvar o historico.'
    return
  }

  submitting.value = true
  feedback.value = ''
  errorMessage.value = ''

  const payload: HistoricoPayload = {
    item_id: Number(form.value.item_id),
    tipo_evento: form.value.tipo_evento,
    descricao: descricaoTrimmed.value === '' ? null : descricaoTrimmed.value,
    usuario_responsavel: usuarioTrimmed.value === '' ? null : usuarioTrimmed.value,
  }

  try {
    if (editingId.value) {
      await updateHistorico(editingId.value, payload)
      feedback.value = 'Historico atualizado com sucesso.'
      historicoAtual.value = {
        ...(historicoAtual.value as Historico),
        ...payload,
        id: editingId.value,
        data_evento: historicoAtual.value?.data_evento ?? new Date().toISOString(),
      }
    } else {
      await createHistorico(payload)
      feedback.value = 'Historico cadastrado com sucesso.'
      resetFormState()
      totalHistoricos.value = (totalHistoricos.value ?? 0) + 1
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Nao foi possivel salvar o historico.'
  } finally {
    submitting.value = false
  }
}

function requestDelete() {
  if (!editingId.value || !historicoAtual.value) {
    return
  }

  pendingDeleteRecord.value = historicoAtual.value
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
  feedback.value = ''
  errorMessage.value = ''

  try {
    await deleteHistorico(pendingDeleteRecord.value.id)
    closeDeleteModal()
    await router.push({ name: 'history-list' })
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Nao foi possivel excluir o historico.'
  } finally {
    deleting.value = false
  }
}

function goToDashboard() {
  void router.push({ name: 'dashboard' })
}

function goToList() {
  void router.push({ name: 'history-list' })
}

function cancelEditing() {
  historicoAtual.value = null
  resetFormState()
  feedback.value = ''
  errorMessage.value = ''
  void router.push({ name: 'history' })
}

onMounted(() => {
  void loadScreen()
})
</script>

<template>
  <main class="module-page">
    <section class="module-shell">
      <header class="module-header">
        <div class="module-header-copy">
          <h1>Historico</h1>
          <p v-if="totalHistoricos !== null" class="module-total">Total cadastrado: {{ totalHistoricos }}</p>
        </div>

        <button type="button" class="module-exit" @click="goToDashboard">Sair</button>
      </header>

      <section class="panel-card">
        <div class="panel-heading">
          <div>
            <p class="panel-kicker">{{ editingId ? 'Edicao' : 'Novo registro' }}</p>
            <h2>{{ editingId ? 'Editar historico' : 'Novo historico' }}</h2>
            <p v-if="editingId" class="panel-support">
              Revise item, tipo de evento e descricao do registro selecionado.
            </p>
          </div>

          <button v-if="editingId" type="button" class="ghost-button heading-action" @click="cancelEditing">
            Cancelar edicao
          </button>
        </div>

        <p v-if="loading" class="status-copy">Preparando formulario...</p>

        <form v-else class="form-grid" @submit.prevent="handleSubmit">
          <label class="field field-span-2">
            <span>Item</span>
            <select v-model.number="form.item_id">
              <option :value="null">Selecione</option>
              <option v-for="item in itens" :key="item.id" :value="item.id">
                {{ item.descricao }}
              </option>
            </select>
            <small v-if="selectedItem" class="field-help">
              Item selecionado: {{ selectedItem.codigo }} - {{ selectedItem.descricao }}
            </small>
          </label>

          <label class="field field-span-2">
            <span>Tipo de evento</span>
            <select v-model="form.tipo_evento">
              <option value="cadastro">Cadastro</option>
              <option value="atualizacao">Atualizacao</option>
              <option value="manutencao">Manutencao</option>
              <option value="emprestado">Emprestado</option>
              <option value="devolvido">Devolvido</option>
            </select>
            <small class="field-help">{{ getTipoLabel(form.tipo_evento) }}</small>
          </label>

          <label class="field field-span-2">
            <span>Descricao</span>
            <textarea v-model="form.descricao" rows="4" />
            <small class="field-help">
              {{ descricaoLength }}/{{ HISTORICO_DESCRICAO_MAX_LENGTH }}
            </small>
            <small v-if="isDescricaoTooLong" class="field-error">
              A descricao ultrapassou o limite operacional de {{ HISTORICO_DESCRICAO_MAX_LENGTH }} caracteres.
            </small>
          </label>

          <label class="field field-span-2">
            <span>Usuario responsavel</span>
            <input v-model="form.usuario_responsavel" :maxlength="RESPONSAVEL_MAX_LENGTH" />
            <small class="field-help">
              {{ usuarioLength }}/{{ RESPONSAVEL_MAX_LENGTH }}
            </small>
            <small v-if="isUsuarioTooLong" class="field-error">
              O nome do responsavel ultrapassou o limite de {{ RESPONSAVEL_MAX_LENGTH }} caracteres.
            </small>
          </label>

          <div v-if="historicoAtual" class="summary-inline">
            <span class="summary-pill">Evento: {{ getTipoLabel(historicoAtual.tipo_evento) }}</span>
            <span class="summary-pill">Registrado em: {{ formatDateTime(historicoAtual.data_evento) }}</span>
          </div>

          <div class="feedback-group">
            <p v-if="feedback" class="feedback success">{{ feedback }}</p>
            <p v-if="errorMessage" class="feedback error">{{ errorMessage }}</p>
          </div>

          <button type="submit" class="primary-button" :disabled="submitting || !isFormValid">
            {{ submitLabel }}
          </button>

          <button type="button" class="ghost-button secondary-action" @click="goToList">
            Listar historico
          </button>

          <button
            v-if="editingId"
            type="button"
            class="danger-button secondary-action"
            :disabled="deleting"
            @click="requestDelete"
          >
            {{ deleting ? 'Excluindo...' : 'Excluir historico' }}
          </button>
        </form>
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
  width: min(100%, 900px);
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
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.module-header-copy {
  display: grid;
  gap: 8px;
}

.module-header h1,
.panel-heading h2,
.modal-copy h2 {
  margin: 0;
  color: #172033;
}

.module-header h1 {
  font-size: clamp(1.8rem, 3vw, 2.4rem);
}

.module-total,
.status-copy,
.panel-support,
.modal-copy p {
  margin: 0;
  color: #536579;
  line-height: 1.6;
}

.module-total {
  font-weight: 800;
}

.module-exit,
.primary-button,
.ghost-button,
.danger-button {
  min-height: 44px;
  border-radius: 999px;
  padding: 0 16px;
  font-weight: 700;
  font: inherit;
}

.module-exit,
.ghost-button {
  border: 1px solid #c8d5d9;
  background: #fff;
  color: #172033;
}

.primary-button {
  border: 0;
  background: linear-gradient(135deg, #008a7c 0%, #0f766e 100%);
  color: #fff;
}

.primary-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.danger-button {
  border: 1px solid #fecaca;
  background: #fff1f2;
  color: #b91c1c;
}

.panel-card {
  padding: 20px;
  display: grid;
  gap: 18px;
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.panel-kicker {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.74rem;
  font-weight: 800;
  color: #0f766e;
}

.heading-action {
  white-space: nowrap;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: #314255;
  font-weight: 700;
}

.field input,
.field select,
.field textarea {
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid #d6e0e4;
  background: #f7fbfb;
  padding: 0 14px;
  font: inherit;
}

.field textarea {
  min-height: 120px;
  padding-top: 12px;
  resize: vertical;
}

.field-span-2,
.feedback-group,
.primary-button,
.secondary-action,
.summary-inline {
  grid-column: 1 / -1;
}

.field-help {
  color: #64748b;
}

.field-error {
  color: #b91c1c;
  font-weight: 700;
}

.summary-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.summary-pill {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(0, 138, 124, 0.08);
  color: #0f766e;
  font-weight: 700;
}

.feedback-group {
  display: grid;
  gap: 10px;
}

.feedback {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 700;
}

.feedback.success {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.feedback.error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
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

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.icon-button {
  width: 48px;
  height: 48px;
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

@media (max-width: 720px) {
  .module-header,
  .panel-heading {
    flex-direction: column;
  }

  .module-exit,
  .primary-button,
  .ghost-button,
  .danger-button {
    width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    justify-content: flex-start;
  }
}
</style>
