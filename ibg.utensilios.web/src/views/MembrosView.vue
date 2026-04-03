<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  createMembro,
  deleteMembro,
  getMembro,
  updateMembro,
  type Membro,
  type MembroPayload,
} from '@/services/modules'
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  formatCpfInput,
  formatPhoneInput,
  isCpfValid,
  isEmailValid,
  isPhoneValid,
  normalizeCpfForPayload,
  normalizeEmailInput,
  normalizeMemberName,
  normalizePhoneForPayload,
} from '@/utils/membro-fields'

const router = useRouter()
const route = useRoute()

const editingId = computed(() => {
  const raw = route.params.id
  const id = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(id) && id > 0 ? id : null
})

const loading = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const feedback = ref('')
const errorMessage = ref('')
const pendingDeleteMember = ref<Membro | null>(null)

const form = ref<{
  nome: string
  telefone: string
  cpf: string
  email: string
  tipo: Membro['tipo']
  ativo: boolean
}>({
  nome: '',
  telefone: '',
  cpf: '',
  email: '',
  tipo: 'membro',
  ativo: true,
})

const normalizedNome = computed(() => normalizeMemberName(form.value.nome))
const normalizedEmail = computed(() => normalizeEmailInput(form.value.email))

const isNameTooLong = computed(() => normalizedNome.value.length > NAME_MAX_LENGTH)
const hasInvalidPhone = computed(() => form.value.telefone.trim() !== '' && !isPhoneValid(form.value.telefone))
const hasInvalidCpf = computed(() => form.value.cpf.trim() !== '' && !isCpfValid(form.value.cpf))
const hasInvalidEmail = computed(() => normalizedEmail.value !== '' && !isEmailValid(form.value.email))

const isFormValid = computed(() => {
  return (
    normalizedNome.value.length > 0 &&
    !isNameTooLong.value &&
    !hasInvalidPhone.value &&
    !hasInvalidCpf.value &&
    !hasInvalidEmail.value
  )
})

function resetFormState() {
  form.value = {
    nome: '',
    telefone: '',
    cpf: '',
    email: '',
    tipo: 'membro',
    ativo: true,
  }
}

function populateForm(membro: Membro) {
  form.value = {
    nome: membro.nome,
    telefone: formatPhoneInput(String(membro.telefone ?? '')),
    cpf: formatCpfInput(String(membro.cpf ?? '')),
    email: membro.email ?? '',
    tipo: membro.tipo,
    ativo: membro.ativo,
  }
}

async function loadMemberForEdit() {
  if (!editingId.value) {
    resetFormState()
    return
  }

  const membro = await getMembro(editingId.value)
  populateForm(membro)
}

async function loadScreen() {
  loading.value = true
  feedback.value = ''
  errorMessage.value = ''

  try {
    await loadMemberForEdit()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Nao foi possivel preparar a tela de membros.'
  } finally {
    loading.value = false
  }
}

function handlePhoneInput(event: Event) {
  const input = event.target as HTMLInputElement
  form.value.telefone = formatPhoneInput(input.value)
}

function handleCpfInput(event: Event) {
  const input = event.target as HTMLInputElement
  form.value.cpf = formatCpfInput(input.value)
}

function handleEmailInput(event: Event) {
  const input = event.target as HTMLInputElement
  form.value.email = normalizeEmailInput(input.value)
}

async function handleSubmit() {
  if (!isFormValid.value) {
    errorMessage.value = 'Corrija os campos destacados antes de salvar o membro.'
    return
  }

  submitting.value = true
  feedback.value = ''
  errorMessage.value = ''

  const payload: MembroPayload = {
    nome: normalizedNome.value,
    telefone: normalizePhoneForPayload(form.value.telefone),
    cpf: normalizeCpfForPayload(form.value.cpf),
    email: normalizedEmail.value === '' ? null : normalizedEmail.value,
    tipo: form.value.tipo,
    ativo: form.value.ativo,
  }

  try {
    const membro = editingId.value
      ? await updateMembro(editingId.value, payload)
      : await createMembro(payload)

    feedback.value = editingId.value
      ? 'Membro atualizado com sucesso.'
      : 'Membro cadastrado com sucesso.'

    if (editingId.value) {
      populateForm(membro)
    } else {
      resetFormState()
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel salvar o membro.'
  } finally {
    submitting.value = false
  }
}

function requestDelete() {
  if (!editingId.value) {
    return
  }

  pendingDeleteMember.value = {
    id: editingId.value,
    nome: normalizedNome.value || 'membro selecionado',
    telefone: normalizePhoneForPayload(form.value.telefone),
    cpf: normalizeCpfForPayload(form.value.cpf),
    email: normalizedEmail.value || null,
    tipo: form.value.tipo,
    ativo: form.value.ativo,
    data_cadastro: '',
  }
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
  feedback.value = ''
  errorMessage.value = ''

  try {
    await deleteMembro(pendingDeleteMember.value.id)
    closeDeleteModal()
    await router.push({ name: 'members-list' })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel excluir o membro.'
  } finally {
    deleting.value = false
  }
}

function goToDashboard() {
  void router.push({ name: 'dashboard' })
}

function goToList() {
  void router.push({ name: 'members-list' })
}

function cancelEditing() {
  resetFormState()
  feedback.value = ''
  errorMessage.value = ''
  void router.push({ name: 'members' })
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
          <h1>Membros</h1>
        </div>

        <button type="button" class="module-exit" @click="goToDashboard">Sair</button>
      </header>

      <section class="panel-card">
        <div v-if="editingId" class="panel-heading">
          <div>
            <h2>Editar membro</h2>
          </div>
        </div>

        <p v-if="loading" class="status-copy">Preparando formulario...</p>

        <form v-else class="form-grid" @submit.prevent="handleSubmit">
          <label class="field">
            <span>Nome</span>
            <input
              v-model="form.nome"
              :maxlength="NAME_MAX_LENGTH"
              autocomplete="name"
              required
            />
            <small class="field-help">{{ normalizedNome.length }}/{{ NAME_MAX_LENGTH }}</small>
            <small v-if="isNameTooLong" class="field-error">
              O nome ultrapassou o limite de {{ NAME_MAX_LENGTH }} caracteres do banco.
            </small>
          </label>

          <label class="field">
            <span>Telefone</span>
            <input
              :value="form.telefone"
              :maxlength="PHONE_MAX_LENGTH"
              inputmode="tel"
              autocomplete="tel"
              placeholder="(71) 99999-0001"
              @input="handlePhoneInput"
            />
            <small v-if="hasInvalidPhone" class="field-error">
              Informe um telefone brasileiro valido com DDD.
            </small>
          </label>

          <label class="field">
            <span>CPF</span>
            <input
              :value="form.cpf"
              maxlength="14"
              inputmode="numeric"
              autocomplete="off"
              placeholder="000.000.000-00"
              @input="handleCpfInput"
            />
            <small v-if="hasInvalidCpf" class="field-error">
              Informe um CPF valido.
            </small>
          </label>

          <label class="field">
            <span>E-mail</span>
            <input
              :value="form.email"
              type="email"
              :maxlength="EMAIL_MAX_LENGTH"
              autocomplete="email"
              placeholder="nome@dominio.com.br"
              @input="handleEmailInput"
            />
            <small v-if="hasInvalidEmail" class="field-error">
              Informe um e-mail valido.
            </small>
          </label>

          <label class="field">
            <span>Tipo</span>
            <select v-model="form.tipo">
              <option value="membro">Membro</option>
              <option value="lideranca">Lideranca</option>
              <option value="visitante_autorizado">Visitante autorizado</option>
            </select>
          </label>

          <div class="field checkbox-field checkbox-inline">
            <span>Status</span>
            <label class="status-toggle">
              <input v-model="form.ativo" type="checkbox" />
              <strong>{{ form.ativo ? 'Ativo' : 'Inativo' }}</strong>
            </label>
          </div>

          <div class="feedback-group">
            <p v-if="feedback" class="feedback success">{{ feedback }}</p>
            <p v-if="errorMessage" class="feedback error">{{ errorMessage }}</p>
          </div>

          <div class="button-row">
            <button type="submit" class="primary-button action-button" :disabled="submitting || !isFormValid">
              {{ submitting ? 'Salvando...' : 'Salvar' }}
            </button>

            <button type="button" class="ghost-button action-button" @click="goToList">
              Listar
            </button>
          </div>

          <button
            v-if="editingId"
            type="button"
            class="ghost-button secondary-action"
            @click="cancelEditing"
          >
            Cancelar edicao
          </button>

          <button
            v-if="editingId"
            type="button"
            class="danger-button secondary-action"
            :disabled="deleting"
            @click="requestDelete"
          >
            {{ deleting ? 'Excluindo...' : 'Excluir membro' }}
          </button>
        </form>
      </section>
    </section>

    <div v-if="pendingDeleteMember" class="modal-backdrop" @click.self="closeDeleteModal">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-member-title">
        <div class="modal-copy">
          <h2 id="delete-member-title">Confirmar exclusao</h2>
          <p>Deseja excluir o membro <strong>{{ pendingDeleteMember.nome }}</strong>?</p>
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
  width: min(100%, 480px);
  margin: 0 auto;
  display: grid;
  gap: 12px;
}

.module-header,
.panel-card,
.modal-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(219, 228, 232, 0.95);
  border-radius: 20px;
  box-shadow: 0 10px 22px rgba(15, 35, 33, 0.07);
}

.module-header {
  padding: clamp(14px, 2.4vw, 18px);
  display: flex;
  justify-content: space-between;
  gap: 14px;
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
  font-size: clamp(1.45rem, 2.8vw, 1.8rem);
}

.status-copy,
.modal-copy p {
  margin: 0;
  color: #536579;
  line-height: 1.6;
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
  padding: 14px;
  display: grid;
  gap: 14px;
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
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
.field select {
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid #d6e0e4;
  background: #f7fbfb;
  padding: 0 14px;
  font: inherit;
}

.feedback-group,
.secondary-action,
.button-row {
  grid-column: 1 / -1;
}

.checkbox-field {
  align-content: start;
}

.checkbox-inline {
  grid-template-columns: auto 1fr;
  align-items: center;
  column-gap: 12px;
}

.checkbox-inline > span {
  margin: 0;
}

.status-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  border-radius: 14px;
  padding: 0 2px;
  cursor: pointer;
}

.status-toggle input {
  width: 18px;
  min-height: 18px;
  margin: 0;
}

.status-toggle strong {
  color: #172033;
}

.field-help {
  color: #64748b;
}

.field-error {
  color: #b91c1c;
  font-weight: 700;
}

.feedback-group {
  display: grid;
  gap: 10px;
}

.button-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.action-button {
  width: 100%;
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
  .danger-button {
    width: 100%;
  }

  .button-row {
    grid-template-columns: 1fr;
  }

  .checkbox-inline {
    grid-template-columns: 1fr;
    align-items: start;
    row-gap: 8px;
  }

  .modal-actions {
    justify-content: flex-start;
  }
}
</style>
