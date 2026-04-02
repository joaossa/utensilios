<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  createMembro,
  deleteMembro,
  listMembros,
  updateMembro,
  type Membro,
  type MembroPayload,
} from '@/services/modules'

const router = useRouter()

const membros = ref<Membro[]>([])
const loading = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)
const feedback = ref('')
const errorMessage = ref('')

const defaultFormState = (): MembroPayload => ({
  nome: '',
  telefone: '',
  cpf: '',
  email: '',
  tipo: 'membro',
  ativo: true,
})

const form = ref<MembroPayload>(defaultFormState())

const totalAtivos = computed(() => membros.value.filter((membro) => membro.ativo).length)

function normalizeOptional(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? null : trimmed
}

function resetForm() {
  form.value = defaultFormState()
  editingId.value = null
}

function populateForm(membro: Membro) {
  editingId.value = membro.id
  form.value = {
    nome: membro.nome,
    telefone: membro.telefone ?? '',
    cpf: membro.cpf ?? '',
    email: membro.email ?? '',
    tipo: membro.tipo,
    ativo: membro.ativo,
  }
  feedback.value = ''
  errorMessage.value = ''
}

async function loadMembros() {
  loading.value = true
  errorMessage.value = ''

  try {
    membros.value = await listMembros()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Não foi possível carregar os membros.'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  submitting.value = true
  feedback.value = ''
  errorMessage.value = ''

  const payload: MembroPayload = {
    nome: form.value.nome.trim(),
    telefone: normalizeOptional(form.value.telefone),
    cpf: normalizeOptional(form.value.cpf),
    email: normalizeOptional(form.value.email),
    tipo: form.value.tipo,
    ativo: form.value.ativo,
  }

  try {
    if (editingId.value) {
      await updateMembro(editingId.value, payload)
      feedback.value = 'Membro atualizado com sucesso.'
    } else {
      await createMembro(payload)
      feedback.value = 'Membro cadastrado com sucesso.'
    }

    resetForm()
    await loadMembros()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Não foi possível salvar o membro.'
  } finally {
    submitting.value = false
  }
}

async function handleDelete(membro: Membro) {
  const confirmed = window.confirm(`Excluir o membro ${membro.nome}?`)

  if (!confirmed) {
    return
  }

  try {
    await deleteMembro(membro.id)
    if (editingId.value === membro.id) {
      resetForm()
    }
    feedback.value = 'Membro excluído com sucesso.'
    await loadMembros()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Não foi possível excluir o membro.'
  }
}

function goToDashboard() {
  void router.push({ name: 'dashboard' })
}

onMounted(() => {
  void loadMembros()
})
</script>

<template>
  <main class="module-page">
    <section class="module-shell">
      <header class="module-header">
        <div class="module-header-copy">
          <p class="module-eyebrow">CRUD de Membros</p>
          <h1>Membros</h1>
          <p class="module-description">Cadastro, edição, ativação e manutenção dos membros autorizados.</p>
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
              <h2>{{ editingId ? 'Editar membro' : 'Cadastrar membro' }}</h2>
            </div>

            <button v-if="editingId" type="button" class="ghost-button" @click="resetForm">
              Cancelar edição
            </button>
          </div>

          <form class="form-grid" @submit.prevent="handleSubmit">
            <label class="field field-span-2">
              <span>Nome</span>
              <input v-model="form.nome" maxlength="150" required />
            </label>

            <label class="field">
              <span>Telefone</span>
              <input v-model="form.telefone" maxlength="20" />
            </label>

            <label class="field">
              <span>CPF</span>
              <input v-model="form.cpf" maxlength="11" />
            </label>

            <label class="field field-span-2">
              <span>E-mail</span>
              <input v-model="form.email" type="email" maxlength="150" />
            </label>

            <label class="field">
              <span>Tipo</span>
              <select v-model="form.tipo">
                <option value="membro">Membro</option>
                <option value="lideranca">Liderança</option>
                <option value="visitante_autorizado">Visitante autorizado</option>
              </select>
            </label>

            <label class="field checkbox-field">
              <span>Ativo</span>
              <input v-model="form.ativo" type="checkbox" />
            </label>

            <div class="feedback-group">
              <p v-if="feedback" class="feedback success">{{ feedback }}</p>
              <p v-if="errorMessage" class="feedback error">{{ errorMessage }}</p>
            </div>

            <button type="submit" class="primary-button" :disabled="submitting">
              {{ submitting ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar membro' }}
            </button>
          </form>
        </article>

        <article class="panel-card">
          <div class="panel-heading">
            <div>
              <p class="panel-kicker">Consulta</p>
              <h2>Membros cadastrados</h2>
            </div>
          </div>

          <p v-if="loading" class="status-copy">Carregando membros...</p>
          <p v-else-if="membros.length === 0" class="status-copy">Nenhum membro cadastrado até agora.</p>

          <div v-else class="list-grid">
            <article v-for="membro in membros" :key="membro.id" class="list-card">
              <div class="list-card-top">
                <div>
                  <p class="list-card-kicker">{{ membro.tipo }}</p>
                  <h3>{{ membro.nome }}</h3>
                </div>

                <span class="status-chip" :class="{ 'status-chip-off': !membro.ativo }">
                  {{ membro.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </div>

              <dl class="meta-grid">
                <div>
                  <dt>E-mail</dt>
                  <dd>{{ membro.email || 'Não informado' }}</dd>
                </div>
                <div>
                  <dt>Telefone</dt>
                  <dd>{{ membro.telefone || 'Não informado' }}</dd>
                </div>
                <div>
                  <dt>CPF</dt>
                  <dd>{{ membro.cpf || 'Não informado' }}</dd>
                </div>
              </dl>

              <div class="list-actions">
                <button type="button" class="ghost-button" @click="populateForm(membro)">
                  Editar
                </button>
                <button type="button" class="danger-button" @click="handleDelete(membro)">
                  Excluir
                </button>
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
.field input, .field select { min-height: 46px; border-radius: 14px; border: 1px solid #d6e0e4; background: #f7fbfb; padding: 0 14px; font: inherit; }
.checkbox-field input { width: 22px; min-height: 22px; padding: 0; }
.field-span-2, .feedback-group, .primary-button { grid-column: 1 / -1; }
.feedback-group { display: grid; gap: 10px; }
.feedback { margin: 0; padding: 12px 14px; border-radius: 14px; font-weight: 700; }
.feedback.success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.feedback.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.list-grid { display: grid; gap: 14px; }
.list-card { border-radius: 20px; border: 1px solid #dbe4e8; background: #fcfefe; padding: 18px; display: grid; gap: 14px; }
.list-card-top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.status-chip { display: inline-flex; align-items: center; justify-content: center; min-height: 28px; padding: 0 12px; border-radius: 999px; background: rgba(0, 138, 124, 0.1); color: #0f766e; font-size: 0.84rem; font-weight: 800; }
.status-chip-off { background: rgba(148, 163, 184, 0.15); color: #475569; }
.meta-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 0; }
.list-actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
@media (max-width: 940px) { .workspace-grid { grid-template-columns: 1fr; } }
@media (max-width: 720px) { .module-header, .panel-heading, .list-card-top { flex-direction: column; } .module-exit, .primary-button, .ghost-button, .danger-button { width: 100%; } .form-grid, .meta-grid { grid-template-columns: 1fr; } }
</style>
