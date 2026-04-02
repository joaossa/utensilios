<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  createEmprestimo,
  deleteEmprestimo,
  listEmprestimos,
  listItens,
  listMembros,
  returnEmprestimo,
  updateEmprestimo,
  type Emprestimo,
  type EmprestimoPayload,
  type Item,
  type Membro,
} from '@/services/modules'

const router = useRouter()

const emprestimos = ref<Emprestimo[]>([])
const itens = ref<Item[]>([])
const membros = ref<Membro[]>([])
const loading = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)
const feedback = ref('')
const errorMessage = ref('')

type EmprestimoFormState = {
  item_id: number | null
  membro_id: number | null
  quantidade: number | null
  data_prevista_devolucao: string
  observacoes: string
}

const defaultFormState = (): EmprestimoFormState => ({
  item_id: null,
  membro_id: null,
  quantidade: null,
  data_prevista_devolucao: '',
  observacoes: '',
})

const form = ref<EmprestimoFormState>(defaultFormState())
const totalAtivos = computed(() => emprestimos.value.filter((item) => item.status === 'ativo').length)
const emprestimoAtual = computed(() => emprestimos.value.find((item) => item.id === editingId.value) ?? null)
const itemSelecionado = computed(() => itens.value.find((item) => item.id === form.value.item_id) ?? null)
const disponibilidadeSelecionada = computed(() => {
  if (!itemSelecionado.value) return null

  let quantidadeDisponivel = itemSelecionado.value.quantidade_disponivel

  if (
    emprestimoAtual.value &&
    emprestimoAtual.value.status !== 'devolvido' &&
    emprestimoAtual.value.item_id === itemSelecionado.value.id
  ) {
    quantidadeDisponivel += emprestimoAtual.value.quantidade
  }

  return quantidadeDisponivel
})

const isQuantidadeInvalida = computed(() => {
  const quantidade = form.value.quantidade

  if (quantidade === null || !Number.isInteger(quantidade) || quantidade <= 0) {
    return true
  }

  return disponibilidadeSelecionada.value !== null && quantidade > disponibilidadeSelecionada.value
})

const isFormValid = computed(() => {
  return (
    form.value.item_id !== null &&
    form.value.membro_id !== null &&
    form.value.data_prevista_devolucao.trim() !== '' &&
    !isQuantidadeInvalida.value
  )
})

function toIsoDateTime(value: string) {
  return new Date(value).toISOString()
}

function toDateTimeLocal(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const timezoneOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function formatDate(value: string | null) {
  if (!value) return 'Não informado'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function resetForm() {
  form.value = defaultFormState()
  editingId.value = null
}

function populateForm(emprestimo: Emprestimo) {
  editingId.value = emprestimo.id
  form.value = {
    item_id: emprestimo.item_id,
    membro_id: emprestimo.membro_id,
    quantidade: emprestimo.quantidade,
    data_prevista_devolucao: toDateTimeLocal(emprestimo.data_prevista_devolucao),
    observacoes: emprestimo.observacoes ?? '',
  }
  feedback.value = ''
  errorMessage.value = ''
}

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [emprestimosData, itensData, membrosData] = await Promise.all([listEmprestimos(), listItens(), listMembros()])
    emprestimos.value = emprestimosData
    itens.value = itensData
    membros.value = membrosData
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Não foi possível carregar os empréstimos.'
  } finally {
    loading.value = false
  }
}

function handleQuantidadeInput(event: Event) {
  const value = (event.target as HTMLInputElement).value.trim()

  if (value === '') {
    form.value.quantidade = null
    return
  }

  const parsed = Number.parseInt(value, 10)
  form.value.quantidade = Number.isFinite(parsed) ? parsed : null
}

async function handleSubmit() {
  if (!isFormValid.value) {
    errorMessage.value = 'Selecione item, membro, quantidade válida e data prevista de devolução.'
    return
  }

  submitting.value = true
  feedback.value = ''
  errorMessage.value = ''

  const payload: EmprestimoPayload = {
    item_id: Number(form.value.item_id),
    membro_id: Number(form.value.membro_id),
    quantidade: Number(form.value.quantidade),
    data_prevista_devolucao: toIsoDateTime(form.value.data_prevista_devolucao),
    observacoes: form.value.observacoes.trim() || null,
  }

  try {
    if (editingId.value) {
      await updateEmprestimo(editingId.value, payload)
      feedback.value = 'Empréstimo atualizado com sucesso.'
    } else {
      await createEmprestimo(payload)
      feedback.value = 'Empréstimo registrado com sucesso.'
    }
    resetForm()
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Não foi possível salvar o empréstimo.'
  } finally {
    submitting.value = false
  }
}

async function handleDelete(emprestimo: Emprestimo) {
  if (!window.confirm(`Excluir o empréstimo ${emprestimo.id}?`)) return
  try {
    await deleteEmprestimo(emprestimo.id)
    if (editingId.value === emprestimo.id) resetForm()
    feedback.value = 'Empréstimo excluído com sucesso.'
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Não foi possível excluir o empréstimo.'
  }
}

async function handleReturn(emprestimo: Emprestimo) {
  try {
    await returnEmprestimo(emprestimo.id)
    feedback.value = 'Devolução registrada com sucesso.'
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Não foi possível registrar a devolução.'
  }
}

function goToDashboard() {
  void router.push({ name: 'dashboard' })
}

onMounted(() => {
  void loadData()
})
</script>

<template>
  <main class="module-page">
    <section class="module-shell">
      <header class="module-header">
        <div class="module-header-copy">
          <p class="module-eyebrow">CRUD de Empréstimos</p>
          <h1>Empréstimos</h1>
          <p class="module-description">Controle de retirada, previsão de devolução e fechamento dos empréstimos.</p>
        </div>
        <button type="button" class="module-exit" @click="goToDashboard">Sair</button>
      </header>

      <section class="summary-grid">
        <article class="summary-card">
          <span class="summary-label">Ativos</span>
          <strong>{{ totalAtivos }}</strong>
        </article>
      </section>

      <section class="workspace-grid">
        <article class="panel-card">
          <div class="panel-heading">
            <div>
              <p class="panel-kicker">{{ editingId ? 'Edição' : 'Novo registro' }}</p>
              <h2>{{ editingId ? 'Editar empréstimo' : 'Registrar empréstimo' }}</h2>
            </div>
            <button v-if="editingId" type="button" class="ghost-button" @click="resetForm">Cancelar edição</button>
          </div>

          <form class="form-grid" @submit.prevent="handleSubmit">
            <label class="field">
              <span>Item</span>
              <select v-model.number="form.item_id">
                <option :value="null">Selecione</option>
                <option v-for="item in itens" :key="item.id" :value="item.id">
                  {{ item.codigo }} - {{ item.descricao }} (disponível: {{ item.quantidade_disponivel }})
                </option>
              </select>
            </label>

            <label class="field">
              <span>Membro</span>
              <select v-model.number="form.membro_id">
                <option :value="null">Selecione</option>
                <option v-for="membro in membros" :key="membro.id" :value="membro.id">{{ membro.nome }}</option>
              </select>
            </label>

            <label class="field">
              <span>Quantidade</span>
              <input
                :value="form.quantidade ?? ''"
                type="number"
                min="1"
                step="1"
                @input="handleQuantidadeInput"
              />
              <small v-if="disponibilidadeSelecionada !== null" class="field-help">
                Disponível para este empréstimo: {{ disponibilidadeSelecionada }}
              </small>
              <small v-if="isQuantidadeInvalida && form.quantidade !== null" class="field-error">
                A quantidade informada precisa ser maior que zero e não pode ultrapassar a disponível.
              </small>
            </label>

            <label class="field">
              <span>Data prevista de devolução</span>
              <input v-model="form.data_prevista_devolucao" type="datetime-local" />
            </label>

            <label class="field field-span-2">
              <span>Observações</span>
              <textarea v-model="form.observacoes" rows="4" />
            </label>

            <div class="feedback-group">
              <p v-if="feedback" class="feedback success">{{ feedback }}</p>
              <p v-if="errorMessage" class="feedback error">{{ errorMessage }}</p>
            </div>

            <button type="submit" class="primary-button" :disabled="submitting || !isFormValid">
              {{ submitting ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Registrar empréstimo' }}
            </button>
          </form>
        </article>

        <article class="panel-card">
          <div class="panel-heading">
            <div>
              <p class="panel-kicker">Consulta</p>
              <h2>Empréstimos cadastrados</h2>
            </div>
          </div>

          <p v-if="loading" class="status-copy">Carregando empréstimos...</p>
          <p v-else-if="emprestimos.length === 0" class="status-copy">Nenhum empréstimo cadastrado até agora.</p>

          <div v-else class="list-grid">
            <article v-for="emprestimo in emprestimos" :key="emprestimo.id" class="list-card">
              <div class="list-card-top">
                <div>
                  <p class="list-card-kicker">Empréstimo #{{ emprestimo.id }}</p>
                  <h3>{{ emprestimo.item_codigo }} - {{ emprestimo.item_descricao }}</h3>
                </div>
                <span class="status-chip" :class="`status-${emprestimo.status}`">{{ emprestimo.status }}</span>
              </div>

              <dl class="meta-grid">
                <div><dt>Membro</dt><dd>{{ emprestimo.membro_nome || 'Não informado' }}</dd></div>
                <div><dt>Quantidade</dt><dd>{{ emprestimo.quantidade }}</dd></div>
                <div><dt>Retirada</dt><dd>{{ formatDate(emprestimo.data_retirada) }}</dd></div>
                <div><dt>Prevista</dt><dd>{{ formatDate(emprestimo.data_prevista_devolucao) }}</dd></div>
                <div><dt>Devolução</dt><dd>{{ formatDate(emprestimo.data_devolucao) }}</dd></div>
              </dl>

              <p v-if="emprestimo.observacoes" class="status-copy">{{ emprestimo.observacoes }}</p>

              <div class="list-actions">
                <button type="button" class="ghost-button" @click="populateForm(emprestimo)">Editar</button>
                <button v-if="emprestimo.status !== 'devolvido'" type="button" class="ghost-button" @click="handleReturn(emprestimo)">Devolver</button>
                <button type="button" class="danger-button" @click="handleDelete(emprestimo)">Excluir</button>
              </div>
            </article>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>

<style scoped>
.module-page { min-height: 100vh; background:
  radial-gradient(circle at top left, rgba(0, 138, 124, 0.12), transparent 34%),
  linear-gradient(180deg, #f3f7f7 0%, #edf3f4 100%); padding: clamp(16px, 3vw, 28px); box-sizing: border-box; }
.module-shell { width: min(100%, 1160px); margin: 0 auto; display: grid; gap: 18px; }
.module-header, .panel-card, .summary-card { background: rgba(255, 255, 255, 0.94); border: 1px solid rgba(219, 228, 232, 0.95); border-radius: 24px; box-shadow: 0 14px 30px rgba(15, 35, 33, 0.07); }
.module-header { padding: clamp(18px, 2.8vw, 28px); display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }
.module-header-copy { display: grid; gap: 8px; }
.module-eyebrow, .panel-kicker, .summary-label, .list-card-kicker, .meta-grid dt { margin: 0; text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.74rem; font-weight: 800; color: #0f766e; }
.module-header h1, .panel-heading h2, .list-card h3 { margin: 0; color: #172033; }
.module-header h1 { font-size: clamp(1.8rem, 3vw, 2.4rem); }
.module-description, .status-copy, .meta-grid dd, .field-help { margin: 0; color: #536579; line-height: 1.6; }
.module-exit, .primary-button, .ghost-button, .danger-button { min-height: 44px; border-radius: 999px; padding: 0 16px; font-weight: 700; font: inherit; }
.module-exit, .ghost-button { border: 1px solid #c8d5d9; background: #fff; color: #172033; }
.primary-button { border: 0; background: linear-gradient(135deg, #008a7c 0%, #0f766e 100%); color: #fff; }
.danger-button { border: 1px solid #fecaca; background: #fff1f2; color: #b91c1c; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 220px)); gap: 16px; }
.summary-card { padding: 18px 20px; display: grid; gap: 8px; }
.summary-card strong { font-size: 2rem; color: #172033; }
.workspace-grid { display: grid; grid-template-columns: minmax(320px, 420px) minmax(0, 1fr); gap: 18px; }
.panel-card { padding: 20px; display: grid; gap: 18px; }
.panel-heading { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.field { display: grid; gap: 8px; }
.field span { color: #314255; font-weight: 700; }
.field input, .field select, .field textarea { min-height: 46px; border-radius: 14px; border: 1px solid #d6e0e4; background: #f7fbfb; padding: 0 14px; font: inherit; }
.field textarea { min-height: 120px; padding-top: 12px; resize: vertical; }
.field-span-2, .feedback-group, .primary-button { grid-column: 1 / -1; }
.field-error { margin: 0; color: #b91c1c; font-weight: 700; }
.feedback-group { display: grid; gap: 10px; }
.feedback { margin: 0; padding: 12px 14px; border-radius: 14px; font-weight: 700; }
.feedback.success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.feedback.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.list-grid { display: grid; gap: 14px; }
.list-card { border-radius: 20px; border: 1px solid #dbe4e8; background: #fcfefe; padding: 18px; display: grid; gap: 14px; }
.list-card-top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.status-chip { display: inline-flex; align-items: center; justify-content: center; min-height: 28px; padding: 0 12px; border-radius: 999px; font-size: 0.84rem; font-weight: 800; text-transform: capitalize; }
.status-ativo { background: rgba(0, 138, 124, 0.1); color: #0f766e; }
.status-devolvido { background: rgba(148, 163, 184, 0.15); color: #475569; }
.status-atrasado { background: rgba(249, 115, 22, 0.15); color: #c2410c; }
.meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 0; }
.list-actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
@media (max-width: 940px) { .workspace-grid { grid-template-columns: 1fr; } }
@media (max-width: 720px) { .module-header, .panel-heading, .list-card-top { flex-direction: column; } .module-exit, .primary-button, .ghost-button, .danger-button { width: 100%; } .form-grid, .meta-grid { grid-template-columns: 1fr; } }
</style>
