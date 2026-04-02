<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  createHistorico,
  deleteHistorico,
  listHistorico,
  listItens,
  updateHistorico,
  type Historico,
  type HistoricoPayload,
  type Item,
} from '@/services/modules'

const router = useRouter()

const historicos = ref<Historico[]>([])
const itens = ref<Item[]>([])
const loading = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)
const feedback = ref('')
const errorMessage = ref('')

type HistoricoFormState = {
  item_id: number | null
  tipo_evento: Historico['tipo_evento']
  descricao: string
  usuario_responsavel: string
}

const defaultFormState = (): HistoricoFormState => ({
  item_id: null,
  tipo_evento: 'atualizacao',
  descricao: '',
  usuario_responsavel: '',
})

const form = ref<HistoricoFormState>(defaultFormState())
const totalRegistros = computed(() => historicos.value.length)

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function resetForm() {
  form.value = defaultFormState()
  editingId.value = null
}

function populateForm(historico: Historico) {
  editingId.value = historico.id
  form.value = {
    item_id: historico.item_id,
    tipo_evento: historico.tipo_evento,
    descricao: historico.descricao ?? '',
    usuario_responsavel: historico.usuario_responsavel ?? '',
  }
  feedback.value = ''
  errorMessage.value = ''
}

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [historicoData, itensData] = await Promise.all([listHistorico(), listItens()])
    historicos.value = historicoData
    itens.value = itensData
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Não foi possível carregar o histórico.'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!form.value.item_id) {
    errorMessage.value = 'Selecione um item para o histórico.'
    return
  }

  submitting.value = true
  feedback.value = ''
  errorMessage.value = ''

  const payload: HistoricoPayload = {
    item_id: form.value.item_id,
    tipo_evento: form.value.tipo_evento,
    descricao: form.value.descricao.trim() || null,
    usuario_responsavel: form.value.usuario_responsavel.trim() || null,
  }

  try {
    if (editingId.value) {
      await updateHistorico(editingId.value, payload)
      feedback.value = 'Histórico atualizado com sucesso.'
    } else {
      await createHistorico(payload)
      feedback.value = 'Histórico cadastrado com sucesso.'
    }
    resetForm()
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Não foi possível salvar o histórico.'
  } finally {
    submitting.value = false
  }
}

async function handleDelete(historico: Historico) {
  if (!window.confirm(`Excluir o registro de histórico ${historico.id}?`)) return
  try {
    await deleteHistorico(historico.id)
    if (editingId.value === historico.id) resetForm()
    feedback.value = 'Histórico excluído com sucesso.'
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Não foi possível excluir o histórico.'
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
          <p class="module-eyebrow">CRUD de Histórico</p>
          <h1>Histórico</h1>
          <p class="module-description">Rastreabilidade dos eventos dos itens com gestão manual quando necessário.</p>
        </div>
        <button type="button" class="module-exit" @click="goToDashboard">Sair</button>
      </header>

      <section class="summary-grid">
        <article class="summary-card">
          <span class="summary-label">Registros</span>
          <strong>{{ totalRegistros }}</strong>
        </article>
      </section>

      <section class="workspace-grid">
        <article class="panel-card">
          <div class="panel-heading">
            <div>
              <p class="panel-kicker">{{ editingId ? 'Edição' : 'Novo registro' }}</p>
              <h2>{{ editingId ? 'Editar histórico' : 'Cadastrar histórico' }}</h2>
            </div>
            <button v-if="editingId" type="button" class="ghost-button" @click="resetForm">Cancelar edição</button>
          </div>

          <form class="form-grid" @submit.prevent="handleSubmit">
            <label class="field field-span-2">
              <span>Item</span>
              <select v-model.number="form.item_id">
                <option :value="null">Selecione</option>
                <option v-for="item in itens" :key="item.id" :value="item.id">{{ item.codigo }} - {{ item.descricao }}</option>
              </select>
            </label>

            <label class="field field-span-2">
              <span>Tipo de evento</span>
              <select v-model="form.tipo_evento">
                <option value="cadastro">Cadastro</option>
                <option value="atualizacao">Atualização</option>
                <option value="manutencao">Manutenção</option>
                <option value="emprestado">Emprestado</option>
                <option value="devolvido">Devolvido</option>
              </select>
            </label>

            <label class="field field-span-2">
              <span>Descrição</span>
              <textarea v-model="form.descricao" rows="4" />
            </label>

            <label class="field field-span-2">
              <span>Usuário responsável</span>
              <input v-model="form.usuario_responsavel" maxlength="150" />
            </label>

            <div class="feedback-group">
              <p v-if="feedback" class="feedback success">{{ feedback }}</p>
              <p v-if="errorMessage" class="feedback error">{{ errorMessage }}</p>
            </div>

            <button type="submit" class="primary-button" :disabled="submitting">
              {{ submitting ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar histórico' }}
            </button>
          </form>
        </article>

        <article class="panel-card">
          <div class="panel-heading">
            <div>
              <p class="panel-kicker">Consulta</p>
              <h2>Registros do histórico</h2>
            </div>
          </div>

          <p v-if="loading" class="status-copy">Carregando histórico...</p>
          <p v-else-if="historicos.length === 0" class="status-copy">Nenhum registro de histórico cadastrado até agora.</p>

          <div v-else class="list-grid">
            <article v-for="historico in historicos" :key="historico.id" class="list-card">
              <div class="list-card-top">
                <div>
                  <p class="list-card-kicker">{{ historico.tipo_evento }}</p>
                  <h3>{{ historico.item_codigo }} - {{ historico.item_descricao }}</h3>
                </div>
                <span class="status-chip">{{ formatDate(historico.data_evento) }}</span>
              </div>

              <dl class="meta-grid">
                <div><dt>Descrição</dt><dd>{{ historico.descricao || 'Não informada' }}</dd></div>
                <div><dt>Responsável</dt><dd>{{ historico.usuario_responsavel || 'Não informado' }}</dd></div>
              </dl>

              <div class="list-actions">
                <button type="button" class="ghost-button" @click="populateForm(historico)">Editar</button>
                <button type="button" class="danger-button" @click="handleDelete(historico)">Excluir</button>
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
.module-description, .status-copy, .meta-grid dd { margin: 0; color: #536579; line-height: 1.6; }
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
.feedback-group { display: grid; gap: 10px; }
.feedback { margin: 0; padding: 12px 14px; border-radius: 14px; font-weight: 700; }
.feedback.success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.feedback.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.list-grid { display: grid; gap: 14px; }
.list-card { border-radius: 20px; border: 1px solid #dbe4e8; background: #fcfefe; padding: 18px; display: grid; gap: 14px; }
.list-card-top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.status-chip { display: inline-flex; align-items: center; justify-content: center; min-height: 28px; padding: 0 12px; border-radius: 999px; background: rgba(0, 138, 124, 0.1); color: #0f766e; font-size: 0.84rem; font-weight: 800; }
.meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 0; }
.list-actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
@media (max-width: 940px) { .workspace-grid { grid-template-columns: 1fr; } }
@media (max-width: 720px) { .module-header, .panel-heading, .list-card-top { flex-direction: column; } .module-exit, .primary-button, .ghost-button, .danger-button { width: 100%; } .form-grid, .meta-grid { grid-template-columns: 1fr; } }
</style>
