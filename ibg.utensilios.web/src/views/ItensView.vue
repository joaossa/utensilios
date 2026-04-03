<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  createItem,
  deleteItem,
  getItem,
  getItemFormOptions,
  listItens,
  updateItem,
  type ItemPayload,
  type LookupOption,
} from '@/services/modules'

const DESCRIPTION_MAX_LENGTH = 255
const QUANTIDADE_INVALID_MESSAGE = 'Informe uma quantidade total maior que zero.'

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
const estados = ref<LookupOption[]>([])
const categorias = ref<LookupOption[]>([])
const totalItens = ref<number | null>(null)
const quantidadeEmprestadaAtual = ref(0)

const form = ref<{
  descricao: string
  categoria_id: number | null
  estado_id: number | null
  quantidade_total_input: string
}>({
  descricao: '',
  categoria_id: null,
  estado_id: null,
  quantidade_total_input: '',
})

const quantidadeTotalTrimmed = computed(() => form.value.quantidade_total_input.trim())

const quantidadeTotalParseResult = computed(() => {
  const rawValue = quantidadeTotalTrimmed.value

  if (rawValue === '') {
    return {
      parsed: null as number | null,
      invalid: false,
      message: '',
    }
  }

  if (!/^\d+$/.test(rawValue)) {
    return {
      parsed: null as number | null,
      invalid: true,
      message: QUANTIDADE_INVALID_MESSAGE,
    }
  }

  const parsed = Number.parseInt(rawValue, 10)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return {
      parsed: null as number | null,
      invalid: true,
      message: QUANTIDADE_INVALID_MESSAGE,
    }
  }

  if (editingId.value !== null && parsed < quantidadeEmprestadaAtual.value) {
    return {
      parsed,
      invalid: true,
      message: `A quantidade total nao pode ser menor que ${quantidadeEmprestadaAtual.value}, pois existem unidades emprestadas.`,
    }
  }

  return {
    parsed,
    invalid: false,
    message: '',
  }
})

const isDescriptionTooLong = computed(() => form.value.descricao.trim().length > DESCRIPTION_MAX_LENGTH)
const shouldShowQuantidadeError = computed(
  () => quantidadeTotalTrimmed.value !== '' && quantidadeTotalParseResult.value.invalid,
)

const isFormValid = computed(() => {
  return (
    form.value.descricao.trim().length > 0 &&
    !isDescriptionTooLong.value &&
    !quantidadeTotalParseResult.value.invalid &&
    quantidadeTotalParseResult.value.parsed !== null &&
    form.value.categoria_id !== null &&
    form.value.estado_id !== null
  )
})

const submitLabel = computed(() => {
  if (submitting.value) return 'Salvando...'
  return 'Salvar item'
})

async function loadOptions() {
  const options = await getItemFormOptions()
  estados.value = options.estados
  categorias.value = options.categorias
}

async function loadItemForEdit() {
  if (!editingId.value) {
    quantidadeEmprestadaAtual.value = 0
    return
  }

  const item = await getItem(editingId.value)
  form.value = {
    descricao: item.descricao,
    categoria_id: item.categoria_id,
    estado_id: item.estado_id,
    quantidade_total_input: String(item.quantidade_total),
  }
  quantidadeEmprestadaAtual.value = item.quantidade_emprestada
}

async function loadItemCount() {
  totalItens.value = (await listItens()).length
}

async function loadScreen() {
  loading.value = true
  errorMessage.value = ''

  try {
    await Promise.all([loadOptions(), loadItemForEdit(), loadItemCount()])
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Nao foi possivel preparar a tela de itens.'
  } finally {
    loading.value = false
  }
}

function handleQuantidadeTotalInput(event: Event) {
  const input = event.target as HTMLInputElement
  form.value.quantidade_total_input = input.value
}

async function handleSubmit() {
  if (!isFormValid.value) {
    errorMessage.value = 'Preencha os campos obrigatorios antes de salvar.'
    return
  }

  submitting.value = true
  feedback.value = ''
  errorMessage.value = ''

  const payload: ItemPayload = {
    descricao: form.value.descricao.trim(),
    categoria_id: Number(form.value.categoria_id),
    estado_id: Number(form.value.estado_id),
    quantidade_total: Number(quantidadeTotalParseResult.value.parsed),
  }

  try {
    const item = editingId.value
      ? await updateItem(editingId.value, payload)
      : await createItem(payload)

    feedback.value = editingId.value
      ? 'Item atualizado com sucesso.'
      : 'Item salvo com sucesso.'

    totalItens.value = (totalItens.value ?? 0) + (editingId.value ? 0 : 1)

    await router.push({ name: 'item-images', params: { id: item.id } })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel salvar o item.'
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  if (!editingId.value) return
  if (!window.confirm('Excluir este item?')) return

  deleting.value = true
  feedback.value = ''
  errorMessage.value = ''

  try {
    await deleteItem(editingId.value)
    await router.push({ name: 'items-list' })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel excluir o item.'
  } finally {
    deleting.value = false
  }
}

function goToDashboard() {
  void router.push({ name: 'dashboard' })
}

function goToList() {
  void router.push({ name: 'items-list' })
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
          <h1>Itens</h1>
        </div>

        <button type="button" class="module-exit" @click="goToDashboard">Sair</button>
      </header>

      <section class="panel-card">
        <div v-if="editingId" class="panel-heading">
          <div>
            <h2>Editar item</h2>
          </div>
        </div>

        <p v-if="loading" class="status-copy">Preparando formulario...</p>

        <form v-else class="form-grid" @submit.prevent="handleSubmit">
          <label class="field">
            <span>Descrição</span>
            <textarea v-model="form.descricao" rows="2" />
            <small class="field-help">{{ form.descricao.length }}/{{ DESCRIPTION_MAX_LENGTH }}</small>
            <small v-if="isDescriptionTooLong" class="field-error">
              A descricao ultrapassou o limite de {{ DESCRIPTION_MAX_LENGTH }} caracteres do banco.
            </small>
          </label>

          <label class="field">
            <span>Quantidade</span>
            <input
              :value="form.quantidade_total_input"
              inputmode="numeric"
              autocomplete="off"
              @input="handleQuantidadeTotalInput"
            />
            <small v-if="shouldShowQuantidadeError" class="field-error">
              {{ quantidadeTotalParseResult.message }}
            </small>
          </label>

          <label class="field">
            <span>Estado</span>
            <select v-model.number="form.estado_id">
              <option :value="null">Selecione</option>
              <option v-for="estado in estados" :key="estado.id" :value="estado.id">
                {{ estado.descricao }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Categoria</span>
            <select v-model.number="form.categoria_id">
              <option :value="null">Selecione</option>
              <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
                {{ categoria.descricao }}
              </option>
            </select>
          </label>

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
            class="danger-button secondary-action"
            :disabled="deleting"
            @click="handleDelete"
          >
            {{ deleting ? 'Excluindo...' : 'Excluir item' }}
          </button>
        </form>
      </section>
    </section>
  </main>
</template>

<style scoped>
.module-page { min-height: 100vh; background:
  radial-gradient(circle at top left, rgba(0, 138, 124, 0.12), transparent 34%),
  linear-gradient(180deg, #f3f7f7 0%, #edf3f4 100%); padding: clamp(12px, 2.4vw, 18px); box-sizing: border-box; }
.module-shell { width: min(100%, 480px); margin: 0 auto; display: grid; gap: 12px; }
.module-header, .panel-card { background: rgba(255, 255, 255, 0.94); border: 1px solid rgba(219, 228, 232, 0.95); border-radius: 20px; box-shadow: 0 10px 22px rgba(15, 35, 33, 0.07); }
.module-header { padding: clamp(14px, 2.4vw, 18px); display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; }
.module-header-copy { display: grid; gap: 8px; }
.module-header h1, .panel-heading h2 { margin: 0; color: #172033; }
.module-header h1 { font-size: clamp(1.45rem, 2.8vw, 1.8rem); }
.module-total, .status-copy { margin: 0; color: #536579; line-height: 1.6; }
.module-total { font-weight: 800; }
.module-exit, .primary-button, .ghost-button, .danger-button { min-height: 44px; border-radius: 999px; padding: 0 16px; font-weight: 700; font: inherit; }
.module-exit, .ghost-button { border: 1px solid #c8d5d9; background: #fff; color: #172033; }
.primary-button { border: 0; background: linear-gradient(135deg, #008a7c 0%, #0f766e 100%); color: #fff; }
.primary-button:disabled { opacity: 0.65; cursor: not-allowed; }
.danger-button { border: 1px solid #fecaca; background: #fff1f2; color: #b91c1c; }
.panel-card { padding: 14px; display: grid; gap: 14px; }
.panel-heading { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.panel-kicker { margin: 0; text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.74rem; font-weight: 800; color: #0f766e; }
.form-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.field { display: grid; gap: 8px; }
.field span { color: #314255; font-weight: 700; }
.field input, .field select, .field textarea { min-height: 46px; border-radius: 14px; border: 1px solid #d6e0e4; background: #f7fbfb; padding: 0 14px; font: inherit; }
.field textarea { min-height: 92px; padding-top: 12px; resize: vertical; }
.feedback-group, .secondary-action, .button-row { grid-column: 1 / -1; }
.button-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.action-button { width: 100%; }
.field-help { color: #64748b; }
.field-error { color: #b91c1c; font-weight: 700; }
.feedback-group { display: grid; gap: 10px; }
.feedback { margin: 0; padding: 12px 14px; border-radius: 14px; font-weight: 700; }
.feedback.success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.feedback.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
@media (max-width: 720px) { .module-header { flex-direction: column; } .module-exit, .danger-button { width: 100%; } .button-row { grid-template-columns: 1fr; } }
</style>
