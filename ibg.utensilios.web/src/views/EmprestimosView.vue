<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar, type QTableProps } from 'quasar'

import {
  createEmprestimo,
  deleteEmprestimo,
  getEmprestimo,
  listItens,
  listMembros,
  updateEmprestimo,
  type Emprestimo,
  type EmprestimoItem,
  type EmprestimoPayload,
  type Item,
  type Membro,
} from '@/services/modules'

const EMPRESTIMO_OBSERVACOES_MAX_LENGTH = 2000

type TemporaryLoanItem = {
  item_id: number
  quantidade: number
  item_codigo: string | null
  item_descricao: string | null
}

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const editingId = computed(() => {
  const raw = route.params.id
  const id = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(id) && id > 0 ? id : null
})

const itens = ref<Item[]>([])
const membros = ref<Membro[]>([])
const loading = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const feedback = ref('')
const errorMessage = ref('')
const pendingDeleteLoan = ref<Emprestimo | null>(null)
const emprestimoAtual = ref<Emprestimo | null>(null)
const originalLoanItems = ref<EmprestimoItem[]>([])
const loanItems = ref<TemporaryLoanItem[]>([])
const loanItemsPagination = ref({
  rowsPerPage: 0,
  sortBy: 'item_descricao',
  descending: false,
})

const form = ref<{
  membro_id: number | null
  data_prevista_devolucao: string
  observacoes: string
}>({
  membro_id: null,
  data_prevista_devolucao: '',
  observacoes: '',
})

const itemDraft = ref<{
  item_id: number | null
  quantidade_input: string
}>({
  item_id: null,
  quantidade_input: '',
})

const loanItemsColumns: QTableProps['columns'] = [
  {
    name: 'item_descricao',
    required: true,
    label: 'Item',
    field: (row: TemporaryLoanItem) => row.item_descricao || row.item_codigo || `Item ${row.item_id}`,
    align: 'left',
    sortable: true,
    classes: 'description-column',
    headerClasses: 'description-column',
  },
  {
    name: 'quantidade',
    label: 'Qtd.',
    field: 'quantidade',
    align: 'center',
    sortable: true,
    style: 'width: 88px',
    headerStyle: 'width: 88px',
    classes: 'quantity-column',
    headerClasses: 'quantity-column',
  },
  {
    name: 'acoes',
    label: 'Acoes',
    field: (row: TemporaryLoanItem) => row.item_id,
    align: 'right',
    style: 'width: 52px',
    headerStyle: 'width: 52px',
    classes: 'actions-column',
    headerClasses: 'actions-column',
  },
]

function formatDateTime(value: string | null) {
  if (!value) return 'Nao informado'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function toDateTimeLocal(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const timezoneOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString()
}

function isFutureDateTimeLocal(value: string) {
  if (value.trim() === '') {
    return false
  }

  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now()
}

function resetFormState() {
  form.value = {
    membro_id: null,
    data_prevista_devolucao: '',
    observacoes: '',
  }
  itemDraft.value = {
    item_id: null,
    quantidade_input: '',
  }
  loanItems.value = []
  originalLoanItems.value = []
}

function getOriginalQuantity(itemId: number) {
  return originalLoanItems.value.find((item) => item.item_id === itemId)?.quantidade ?? 0
}

function getMaxAvailableForItem(itemId: number) {
  const item = itens.value.find((entry) => entry.id === itemId)

  if (!item) {
    return 0
  }

  let quantidadeDisponivel = item.quantidade_disponivel

  if (emprestimoAtual.value && emprestimoAtual.value.status !== 'devolvido') {
    quantidadeDisponivel += getOriginalQuantity(itemId)
  }

  return quantidadeDisponivel
}

const selectedDraftItem = computed(() => itens.value.find((item) => item.id === itemDraft.value.item_id) ?? null)
const selectedDraftAvailableQuantity = computed(() => {
  if (selectedDraftItem.value === null) {
    return ''
  }

  return String(getMaxAvailableForItem(selectedDraftItem.value.id))
})

const selectableItems = computed(() => {
  return itens.value.filter((item) => {
    return getMaxAvailableForItem(item.id) > 0 && !loanItems.value.some((loanItem) => loanItem.item_id === item.id)
  })
})

const observacoesTrimmed = computed(() => form.value.observacoes.trim())
const observacoesLength = computed(() => observacoesTrimmed.value.length)
const isObservacoesTooLong = computed(
  () => observacoesLength.value > EMPRESTIMO_OBSERVACOES_MAX_LENGTH,
)

const draftQuantidadeParseResult = computed(() => {
  const rawValue = itemDraft.value.quantidade_input.trim()

  if (rawValue === '') {
    return {
      parsed: null as number | null,
      invalid: true,
      message: 'Informe a quantidade para emprestimo.',
    }
  }

  if (!/^\d+$/.test(rawValue)) {
    return {
      parsed: null as number | null,
      invalid: true,
      message: 'Informe a quantidade para emprestimo.',
    }
  }

  const parsed = Number.parseInt(rawValue, 10)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return {
      parsed: null as number | null,
      invalid: true,
      message: 'Informe a quantidade para emprestimo.',
    }
  }

  return {
    parsed,
    invalid: false,
    message: '',
  }
})

const draftMergedQuantity = computed(() => {
  if (itemDraft.value.item_id === null || draftQuantidadeParseResult.value.parsed === null) {
    return null
  }

  return draftQuantidadeParseResult.value.parsed
})

const draftErrorMessage = computed(() => {
  if (selectedDraftItem.value === null) {
    return 'Selecione um item para adicionar ao emprestimo.'
  }

  if (draftQuantidadeParseResult.value.invalid) {
    return draftQuantidadeParseResult.value.message
  }

  const maxAvailable = getMaxAvailableForItem(selectedDraftItem.value.id)

  if (draftMergedQuantity.value !== null && draftMergedQuantity.value > maxAvailable) {
    return 'Quantidade excede o disponivel.'
  }

  return ''
})

const hasDraftError = computed(() => draftErrorMessage.value !== '')
const draftInlineErrorMessage = computed(() => {
  if (selectedDraftItem.value === null || draftQuantidadeParseResult.value.invalid) {
    return ''
  }

  return draftErrorMessage.value
})

const hasInvalidDate = computed(() => {
  return !isFutureDateTimeLocal(form.value.data_prevista_devolucao)
})

const totalItensSelecionados = computed(() => loanItems.value.length)
const quantidadeTotalSelecionada = computed(() => {
  return loanItems.value.reduce((total, item) => total + item.quantidade, 0)
})

const isFormValid = computed(() => {
  return (
    form.value.membro_id !== null &&
    loanItems.value.length > 0 &&
    !hasInvalidDate.value &&
    !isObservacoesTooLong.value &&
    !hasLoanItemsQuantityError.value
  )
})

function populateForm(emprestimo: Emprestimo) {
  emprestimoAtual.value = emprestimo
  originalLoanItems.value = [...emprestimo.itens]
  loanItems.value = emprestimo.itens.map((item) => ({
    item_id: item.item_id,
    quantidade: item.quantidade,
    item_codigo: item.item_codigo ?? null,
    item_descricao: item.item_descricao ?? null,
  }))
  form.value = {
    membro_id: emprestimo.membro_id,
    data_prevista_devolucao: toDateTimeLocal(emprestimo.data_prevista_devolucao),
    observacoes: emprestimo.observacoes ?? '',
  }
  itemDraft.value = {
    item_id: null,
    quantidade_input: '',
  }
}

async function loadOptions() {
  const [itensData, membrosData] = await Promise.all([listItens(), listMembros()])
  itens.value = itensData
  membros.value = membrosData
}

async function loadLoanForEdit() {
  if (!editingId.value) {
    emprestimoAtual.value = null
    resetFormState()
    return
  }

  const emprestimo = await getEmprestimo(editingId.value)
  populateForm(emprestimo)
}

async function loadScreen() {
  loading.value = true
  feedback.value = ''
  errorMessage.value = ''

  try {
    await Promise.all([loadOptions(), loadLoanForEdit()])
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Nao foi possivel preparar a tela de emprestimos.'
  } finally {
    loading.value = false
  }
}

function handleDraftQuantidadeInput(event: Event) {
  const input = event.target as HTMLInputElement
  itemDraft.value.quantidade_input = input.value.replace(/\D/g, '').slice(0, 3)
}

function resetItemDraft() {
  itemDraft.value = {
    item_id: null,
    quantidade_input: '',
  }
}

function addItemToLoan() {
  if (hasDraftError.value || selectedDraftItem.value === null || draftQuantidadeParseResult.value.parsed === null) {
    errorMessage.value = draftErrorMessage.value || 'Corrija o item antes de adicionar ao emprestimo.'
    return
  }

  errorMessage.value = ''
  loanItems.value = [
    ...loanItems.value,
    {
      item_id: selectedDraftItem.value.id,
      quantidade: draftQuantidadeParseResult.value.parsed,
      item_codigo: selectedDraftItem.value.codigo,
      item_descricao: selectedDraftItem.value.descricao,
    },
  ]

  resetItemDraft()
}

function removeLoanItem(itemId: number) {
  loanItems.value = loanItems.value.filter((item) => item.item_id !== itemId)
}

function updateLoanItemQuantity(itemId: number, value: string) {
  const normalized = value.replace(/\D/g, '').slice(0, 3)

  loanItems.value = loanItems.value.map((item) => {
    if (item.item_id !== itemId) {
      return item
    }

    if (normalized === '') {
      return { ...item, quantidade: 0 }
    }

    const parsed = Number.parseInt(normalized, 10)
    return { ...item, quantidade: Number.isInteger(parsed) ? parsed : item.quantidade }
  })
}

function getLoanItemQuantityError(item: TemporaryLoanItem) {
  if (!Number.isInteger(item.quantidade) || item.quantidade <= 0) {
    return 'Quantidade invalida.'
  }

  const maxAvailable = getMaxAvailableForItem(item.item_id)

  if (item.quantidade > maxAvailable) {
    return 'Quantidade excede o disponivel.'
  }

  return ''
}

const hasLoanItemsQuantityError = computed(() => {
  return loanItems.value.some((item) => getLoanItemQuantityError(item) !== '')
})

async function handleSubmit() {
  if (!isFormValid.value) {
    if (form.value.membro_id === null) {
      errorMessage.value = 'Selecione o membro do emprestimo.'
      return
    }

    if (!isFutureDateTimeLocal(form.value.data_prevista_devolucao)) {
      errorMessage.value = 'A data de devolucao deve ser maior que a data e hora atuais.'
      return
    }

    if (loanItems.value.length === 0) {
      errorMessage.value = 'Adicione ao menos um item ao emprestimo.'
      return
    }

    if (hasLoanItemsQuantityError.value) {
      errorMessage.value = 'Revise as quantidades dos itens selecionados antes de salvar o emprestimo.'
      return
    }

    if (isObservacoesTooLong.value) {
      errorMessage.value = 'As observacoes excederam o limite permitido.'
      return
    }

    errorMessage.value = 'Corrija os campos destacados antes de salvar o emprestimo.'
    return
  }

  submitting.value = true
  feedback.value = ''
  errorMessage.value = ''

  const payload: EmprestimoPayload = {
    membro_id: Number(form.value.membro_id),
    data_prevista_devolucao: toIsoDateTime(form.value.data_prevista_devolucao),
    observacoes: observacoesTrimmed.value === '' ? null : observacoesTrimmed.value,
    itens: loanItems.value.map((item) => ({
      item_id: item.item_id,
      quantidade: item.quantidade,
    })),
  }

  try {
    const emprestimo = editingId.value
      ? await updateEmprestimo(editingId.value, payload)
      : await createEmprestimo(payload)

    feedback.value = editingId.value
      ? 'Emprestimo atualizado com sucesso.'
      : 'Emprestimo registrado com sucesso.'

    if (editingId.value) {
      populateForm(emprestimo)
    } else {
      resetFormState()
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Nao foi possivel salvar o emprestimo.'
  } finally {
    submitting.value = false
  }
}

function requestDelete() {
  if (!editingId.value || !emprestimoAtual.value) {
    return
  }

  pendingDeleteLoan.value = emprestimoAtual.value
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
  feedback.value = ''
  errorMessage.value = ''

  try {
    await deleteEmprestimo(pendingDeleteLoan.value.id)
    closeDeleteModal()
    await router.push({ name: 'loans-list' })
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Nao foi possivel excluir o emprestimo.'
  } finally {
    deleting.value = false
  }
}

function goToDashboard() {
  void router.push({ name: 'dashboard' })
}

function goToList() {
  void router.push({ name: 'loans-list' })
}

function cancelEditing() {
  emprestimoAtual.value = null
  resetFormState()
  feedback.value = ''
  errorMessage.value = ''
  void router.push({ name: 'loans' })
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
          <h1>Empréstimos</h1>
        </div>

        <div class="panel-exit-row">
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
        <div v-if="editingId" class="panel-heading panel-heading-edit">
          <h2 class="edit-label">Editar emprestimo</h2>
        </div>

        <p v-if="loading" class="status-copy">Preparando formulario...</p>

        <form v-else class="form-grid" @submit.prevent="handleSubmit">
          <label class="field field-shell-input">
            <span>Membro</span>
            <select v-model.number="form.membro_id">
              <option :value="null"></option>
              <option v-for="membro in membros" :key="membro.id" :value="membro.id">
                {{ membro.nome }}
              </option>
            </select>
          </label>

          <label class="field field-shell-input">
            <span>Devolver em</span>
            <input v-model="form.data_prevista_devolucao" type="datetime-local" />
          </label>

          <label class="field field-shell-input field-span-2">
            <span>Observações</span>
            <textarea v-model="form.observacoes" rows="4" />
            <small class="field-help">
              {{ observacoesLength }}/{{ EMPRESTIMO_OBSERVACOES_MAX_LENGTH }}
            </small>
            <small v-if="isObservacoesTooLong" class="field-error">
              As observacoes ultrapassaram o limite operacional de {{ EMPRESTIMO_OBSERVACOES_MAX_LENGTH }} caracteres.
            </small>
          </label>

          <section class="items-builder field-span-2">
            <div class="section-heading">
              <div>
                <h3>Itens de empréstimo</h3>
              </div>
              <div class="summary-inline">
                <span class="summary-pill">Itens: {{ totalItensSelecionados }}</span>
                <span class="summary-pill">Quantidade: {{ quantidadeTotalSelecionada }}</span>
              </div>
            </div>

            <div class="builder-grid">
              <label class="field field-shell-input">
                <span>Item</span>
                <select v-model.number="itemDraft.item_id">
                  <option :value="null"></option>
                  <option v-for="item in selectableItems" :key="item.id" :value="item.id">
                    {{ item.descricao }}
                  </option>
                </select>
              </label>

              <div class="quantity-pair">
                <label class="field field-shell-input">
                  <span>Qtde Disp.</span>
                  <input
                    :value="selectedDraftAvailableQuantity"
                    readonly
                    tabindex="-1"
                  />
                </label>

                <label class="field field-shell-input">
                  <span>Quantidade</span>
                  <input
                    :value="itemDraft.quantidade_input"
                    inputmode="numeric"
                    autocomplete="off"
                    maxlength="3"
                    @input="handleDraftQuantidadeInput"
                  />
                  <small v-if="draftInlineErrorMessage" class="field-error">
                    {{ draftInlineErrorMessage }}
                  </small>
                </label>
              </div>

              <div class="builder-action">
                <button type="button" class="ghost-button action-button" @click="addItemToLoan">
                  Adicionar item
                </button>
              </div>
            </div>

            <q-table
              v-model:pagination="loanItemsPagination"
              flat
              bordered
              dense
              hide-bottom
              :rows="loanItems"
              :columns="loanItemsColumns"
              :grid="$q.screen.lt.md"
              row-key="item_id"
              class="loan-items-table"
            >
              <template #body-cell-item_descricao="props">
                <q-td :props="props" class="description-cell">
                  {{ props.row.item_descricao || props.row.item_codigo || `Item ${props.row.item_id}` }}
                </q-td>
              </template>

              <template #body-cell-quantidade="props">
                <q-td :props="props" class="quantity-editor-cell">
                  <div class="quantity-editor">
                    <input
                      :value="props.row.quantidade"
                      inputmode="numeric"
                      autocomplete="off"
                      maxlength="3"
                      @input="updateLoanItemQuantity(props.row.item_id, ($event.target as HTMLInputElement).value)"
                    />
                    <small v-if="getLoanItemQuantityError(props.row)" class="field-error table-error">
                      {{ getLoanItemQuantityError(props.row) }}
                    </small>
                  </div>
                </q-td>
              </template>

              <template #body-cell-acoes="props">
                <q-td :props="props" class="actions-cell">
                  <div class="row-actions">
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      color="negative"
                      aria-label="Remover item"
                      title="Remover item"
                      @click="removeLoanItem(props.row.item_id)"
                    />
                  </div>
                </q-td>
              </template>

              <template #item="props">
                <div class="mobile-grid-item">
                  <article class="mobile-card">
                    <div class="mobile-copy">
                      <h3>{{ props.row.item_descricao || props.row.item_codigo || `Item ${props.row.item_id}` }}</h3>
                      <label class="field mobile-quantity-field">
                        <span>Quantidade</span>
                        <input
                          :value="props.row.quantidade"
                          inputmode="numeric"
                          autocomplete="off"
                          maxlength="3"
                          @input="updateLoanItemQuantity(props.row.item_id, ($event.target as HTMLInputElement).value)"
                        />
                        <small v-if="getLoanItemQuantityError(props.row)" class="field-error">
                          {{ getLoanItemQuantityError(props.row) }}
                        </small>
                      </label>
                    </div>

                    <div class="mobile-actions">
                      <q-btn
                        flat
                        round
                        dense
                        icon="delete"
                        color="negative"
                        aria-label="Remover item"
                        title="Remover item"
                        @click="removeLoanItem(props.row.item_id)"
                      />
                    </div>
                  </article>
                </div>
              </template>

              <template #no-data>
                <div class="status-copy no-data-copy">
                  Adicione itens para montar o emprestimo antes de salvar.
                </div>
              </template>
            </q-table>
          </section>

          <div v-if="emprestimoAtual" class="summary-inline field-span-2">
            <span class="summary-pill">Retirado em: {{ formatDateTime(emprestimoAtual.data_retirada) }}</span>
            <span class="summary-pill">Status: {{ emprestimoAtual.status }}</span>
            <span class="summary-pill">Devolvido em: {{ formatDateTime(emprestimoAtual.data_devolucao) }}</span>
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
            {{ deleting ? 'Excluindo...' : 'Excluir emprestimo' }}
          </button>
        </form>

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
  position: relative;
  min-height: 60px;
  padding: 8px 12px;
  display: block;
}

.module-header-copy,
.modal-copy,
.mobile-copy {
  display: grid;
  gap: 2px;
}

.module-header-copy {
  padding-right: 56px;
}

.module-header h1,
.panel-heading h2,
.section-heading h3,
.modal-copy h2,
.mobile-copy h3 {
  margin: 0;
  color: #172033;
}

.module-header h1 {
  font-size: clamp(1.45rem, 2.8vw, 1.8rem);
}

.section-heading h3 {
  font-size: 1rem;
  line-height: 1.25;
}

.status-copy,
.modal-copy p,
.section-heading p,
.mobile-copy p {
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

.module-exit-icon {
  width: 44px;
  min-width: 44px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #0f766e;
  border-color: rgba(15, 118, 110, 0.18);
  box-shadow: 0 6px 18px rgba(15, 35, 33, 0.06);
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

.panel-heading-edit {
  justify-content: flex-end;
}

.edit-label {
  font-size: 0.55rem;
  font-weight: 800;
  text-align: right;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.field {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.field span {
  color: #314255;
  font-weight: 700;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid #d6e0e4;
  background: #f7fbfb;
  padding: 0 14px;
  font: inherit;
}

.field textarea {
  min-height: 92px;
  padding-top: 12px;
  resize: vertical;
}

.field-shell-input {
  gap: 4px;
  padding: 10px 14px 12px;
  border: 1px solid #d6e0e4;
  border-radius: 14px;
  background: #f7fbfb;
}

.field-shell-input > span {
  font-size: 0.76rem;
  font-weight: 800;
  color: #536579;
}

.field-shell-input input,
.field-shell-input select,
.field-shell-input textarea {
  min-height: auto;
  padding: 0;
  border: 0;
  background: transparent;
}

.field-span-2,
.feedback-group,
.secondary-action,
.button-row {
  grid-column: 1 / -1;
}

.field-help {
  color: #64748b;
}

.field-error {
  color: #b91c1c;
  font-weight: 700;
}

.items-builder {
  display: grid;
  gap: 14px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid #dbe4e8;
  background: #fcfefe;
  min-width: 0;
}

.section-heading {
  display: grid;
  gap: 8px;
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

.builder-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  align-items: start;
  min-width: 0;
}

.builder-action {
  display: grid;
  align-self: stretch;
}

.quantity-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  min-width: 0;
}

.field-shell-input input[readonly] {
  cursor: default;
}

.loan-items-table {
  border-radius: 18px;
  overflow: hidden;
  min-width: 0;
}

.loan-items-table :deep(.q-table__top),
.loan-items-table :deep(.q-table__bottom) {
  display: none;
}

.loan-items-table :deep(.q-table thead tr) {
  background: #f5fbfb;
}

.loan-items-table :deep(.q-table th) {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #0f766e;
}

.loan-items-table :deep(.q-table th),
.loan-items-table :deep(.q-table td) {
  padding: 14px 16px;
}

.loan-items-table :deep(.q-table tbody tr:nth-child(even)) {
  background: #fcfefe;
}

.description-cell {
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.45;
}

.total-cell {
  font-weight: 800;
  color: #172033;
}

.quantity-editor-cell {
  width: 88px;
  min-width: 88px;
}

.actions-cell {
  width: 52px;
  min-width: 52px;
}

.quantity-editor {
  display: grid;
  gap: 6px;
  justify-items: end;
}

.quantity-editor input,
.mobile-quantity-field input {
  width: 72px;
  max-width: 72px;
  text-align: center;
  min-height: 38px;
  border-radius: 12px;
  border: 1px solid #d6e0e4;
  background: #f7fbfb;
  padding: 0 12px;
  font: inherit;
  box-sizing: border-box;
}

.table-error {
  display: block;
  line-height: 1.35;
}

.row-actions,
.modal-actions,
.mobile-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
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

.no-data-copy {
  padding: 18px 10px;
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

.panel-exit-row {
  position: absolute;
  right: 12px;
  bottom: 8px;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
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

.modal-actions {
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

.modal-icon {
  width: 48px;
  height: 48px;
}

@media (max-width: 720px) {
  .module-header,
  .panel-heading {
    flex-direction: column;
  }

  .danger-button {
    width: 100%;
  }

  .module-exit-icon {
    width: 44px;
  }

  .panel-card {
    padding: 16px;
  }

  .button-row {
    grid-template-columns: 1fr;
  }

  .quantity-pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .modal-actions,
  .mobile-actions {
    justify-content: flex-start;
  }
}
</style>
