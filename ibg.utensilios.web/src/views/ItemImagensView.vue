<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  createItemImagem,
  deleteItemImagem,
  getItem,
  listItemImagens,
  updateItemImagem,
  type Item,
  type ItemImagem,
  type ItemImagemPayload,
} from '@/services/modules'

const router = useRouter()
const route = useRoute()

const cameraInputRef = useTemplateRef<HTMLInputElement>('cameraInput')
const libraryInputRef = useTemplateRef<HTMLInputElement>('libraryInput')

const itemId = computed(() => {
  const raw = route.params.id
  const id = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(id) && id > 0 ? id : null
})

const editingId = ref<number | null>(null)
const loading = ref(false)
const submitting = ref(false)
const feedback = ref('')
const errorMessage = ref('')
const pendingDeleteId = ref<number | null>(null)
const imagens = ref<ItemImagem[]>([])
const item = ref<Item | null>(null)
const selectedFileLabel = ref('')

const form = ref<{
  arquivo_base64: string | null
  nome_arquivo: string | null
  mime_type: string | null
  tamanho_bytes: number | null
  url_imagem: string | null
  descricao: string
  ordem_input: string
}>({
  arquivo_base64: null,
  nome_arquivo: null,
  mime_type: null,
  tamanho_bytes: null,
  url_imagem: null,
  descricao: '',
  ordem_input: '',
})

function resetNativeInputs() {
  if (cameraInputRef.value) {
    cameraInputRef.value.value = ''
  }

  if (libraryInputRef.value) {
    libraryInputRef.value.value = ''
  }
}

function resetForm() {
  editingId.value = null
  selectedFileLabel.value = ''
  resetNativeInputs()
  form.value = {
    arquivo_base64: null,
    nome_arquivo: null,
    mime_type: null,
    tamanho_bytes: null,
    url_imagem: null,
    descricao: '',
    ordem_input: '',
  }
}

function clearDeleteRequest() {
  pendingDeleteId.value = null
}

function populateForm(imagem: ItemImagem) {
  editingId.value = imagem.id
  selectedFileLabel.value = imagem.nome_arquivo || 'Imagem cadastrada'
  resetNativeInputs()
  form.value = {
    arquivo_base64: null,
    nome_arquivo: imagem.nome_arquivo ?? null,
    mime_type: imagem.mime_type ?? null,
    tamanho_bytes: imagem.tamanho_bytes ?? null,
    url_imagem: imagem.url_imagem ?? null,
    descricao: imagem.descricao ?? '',
    ordem_input: imagem.ordem === null || imagem.ordem === undefined ? '' : String(imagem.ordem),
  }
  feedback.value = ''
  errorMessage.value = ''
  clearDeleteRequest()
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result

      if (typeof result !== 'string') {
        reject(new Error('Nao foi possivel ler o arquivo selecionado.'))
        return
      }

      const [, base64 = ''] = result.split(',')
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Nao foi possivel ler o arquivo selecionado.'))
    reader.readAsDataURL(file)
  })
}

async function setSelectedFile(file: File | null | undefined) {
  if (!file) {
    selectedFileLabel.value = ''
    form.value.arquivo_base64 = null
    form.value.nome_arquivo = null
    form.value.mime_type = null
    form.value.tamanho_bytes = null
    return
  }

  selectedFileLabel.value = file.name
  form.value.arquivo_base64 = await fileToBase64(file)
  form.value.nome_arquivo = file.name
  form.value.mime_type = file.type || null
  form.value.tamanho_bytes = file.size
  form.value.url_imagem = null
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  await setSelectedFile(input.files?.[0])
}

function openCameraPicker() {
  cameraInputRef.value?.click()
}

function openLibraryPicker() {
  libraryInputRef.value?.click()
}

function getParsedOrder() {
  const rawValue = form.value.ordem_input.trim()

  if (rawValue === '') {
    return { value: undefined as number | undefined, invalid: false }
  }

  if (!/^\d+$/.test(rawValue)) {
    return { value: undefined as number | undefined, invalid: true }
  }

  const parsed = Number.parseInt(rawValue, 10)
  return { value: parsed, invalid: !Number.isInteger(parsed) || parsed < 0 }
}

const ordemState = computed(() => getParsedOrder())
const pendingDeleteImage = computed(() => {
  return imagens.value.find((imagem) => imagem.id === pendingDeleteId.value) ?? null
})
const hasImageInForm = computed(() => {
  return Boolean(form.value.arquivo_base64 || form.value.nome_arquivo || form.value.url_imagem)
})
const hasDescricaoPreenchida = computed(() => form.value.descricao.trim().length > 0)
const canSubmit = computed(() => {
  return !submitting.value && !ordemState.value.invalid && hasImageInForm.value && hasDescricaoPreenchida.value
})

async function loadScreen() {
  if (!itemId.value) {
    errorMessage.value = 'Identificador do item invalido.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const [itemData, imagensData] = await Promise.all([
      getItem(itemId.value),
      listItemImagens(itemId.value),
    ])
    item.value = itemData
    imagens.value = imagensData
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Nao foi possivel carregar as imagens do item.'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!itemId.value) {
    errorMessage.value = 'Identificador do item invalido.'
    return
  }

  submitting.value = true
  feedback.value = ''
  errorMessage.value = ''
  clearDeleteRequest()

  try {
    if (ordemState.value.invalid) {
      throw new Error('Ordem de exibicao aceita apenas numeros inteiros iguais ou maiores que zero.')
    }

    if (!hasImageInForm.value) {
      throw new Error('Selecione um arquivo de imagem antes de cadastrar.')
    }

    if (!hasDescricaoPreenchida.value) {
      throw new Error('Informe a descricao da imagem antes de salvar.')
    }

    const payload: ItemImagemPayload = {
      item_id: itemId.value,
      descricao: form.value.descricao.trim() || null,
      ...(ordemState.value.value !== undefined ? { ordem: ordemState.value.value } : {}),
    }

    const hasNewFile = Boolean(form.value.arquivo_base64)

    if (hasNewFile) {
      payload.arquivo_base64 = form.value.arquivo_base64
      payload.nome_arquivo = form.value.nome_arquivo
      payload.mime_type = form.value.mime_type
      payload.tamanho_bytes = form.value.tamanho_bytes
      payload.url_imagem = null
    } else if (!editingId.value && form.value.url_imagem) {
      payload.url_imagem = form.value.url_imagem
    } else if (editingId.value && form.value.url_imagem) {
      payload.url_imagem = form.value.url_imagem
    }

    if (editingId.value) {
      await updateItemImagem(editingId.value, payload)
      feedback.value = 'Imagem atualizada com sucesso.'
    } else {
      await createItemImagem(payload)
      feedback.value = 'Imagem cadastrada com sucesso.'
    }

    resetForm()
    await loadScreen()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel salvar a imagem.'
  } finally {
    submitting.value = false
  }
}

async function handleDelete(imagem: ItemImagem) {
  if (pendingDeleteId.value !== imagem.id) {
    pendingDeleteId.value = imagem.id
    feedback.value = ''
    errorMessage.value = ''
    return
  }

  try {
    await deleteItemImagem(imagem.id)

    if (editingId.value === imagem.id) {
      resetForm()
    }

    clearDeleteRequest()
    feedback.value = 'Imagem excluida com sucesso.'
    await loadScreen()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel excluir a imagem.'
  }
}

async function confirmDelete() {
  if (!pendingDeleteImage.value) {
    clearDeleteRequest()
    return
  }

  await handleDelete(pendingDeleteImage.value)
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
          <h1>Imagens</h1>
          <p v-if="item" class="module-total">{{ item.codigo }} - <strong>{{ item.descricao }}</strong></p>
        </div>
        <button type="button" class="module-exit" @click="goToList">Voltar para lista</button>
      </header>

      <section class="panel-card">
        <form class="form-grid" @submit.prevent="handleSubmit">
          <label class="field field-span-2">
            <input
              ref="cameraInput"
              class="native-file-input"
              type="file"
              accept="image/*"
              capture="environment"
              @change="handleFileChange"
            />
            <input
              ref="libraryInput"
              class="native-file-input"
              type="file"
              accept="image/*"
              @change="handleFileChange"
            />

            <div class="upload-actions">
              <button type="button" class="upload-button upload-button-primary" @click="openCameraPicker">
                Usar camera
              </button>
              <button type="button" class="upload-button upload-button-secondary" @click="openLibraryPicker">
                Escolher arquivo
              </button>
            </div>

            <small v-if="selectedFileLabel" class="field-help">{{ selectedFileLabel }}</small>
          </label>

          <label class="field field-span-2">
            <span>Descrição</span>
            <input v-model="form.descricao" maxlength="255" />
          </label>

          <label class="field">
            <span>Ordem de exibicao</span>
            <input v-model="form.ordem_input" inputmode="numeric" autocomplete="off" />
          </label>

          <div class="feedback-group">
            <p v-if="feedback" class="feedback success">{{ feedback }}</p>
            <p v-if="errorMessage" class="feedback error">{{ errorMessage }}</p>
            <div v-if="pendingDeleteId !== null" class="feedback warning">
              <p class="confirm-copy">Confirme a exclusao da imagem selecionada.</p>
              <div class="confirm-actions">
                <button type="button" class="danger-button" @click="confirmDelete">
                  Confirmar exclusao
                </button>
                <button type="button" class="ghost-button" @click="clearDeleteRequest">
                  Cancelar
                </button>
              </div>
            </div>
          </div>

          <button type="submit" class="primary-button" :disabled="!canSubmit">
            {{ submitting ? 'Salvando...' : editingId ? 'Salvar imagem' : 'Cadastrar imagem' }}
          </button>
        </form>
      </section>

      <section class="panel-card">
        <p v-if="loading" class="status-copy">Carregando imagens...</p>
        <div v-else-if="imagens.length > 0" class="list-grid">
          <article v-for="imagem in imagens" :key="imagem.id" class="list-card">
            <img
              v-if="imagem.imagem_src"
              class="image-preview"
              :src="imagem.imagem_src"
              :alt="imagem.descricao || 'Imagem do item'"
            />
            <p class="status-copy">{{ imagem.nome_arquivo || 'Imagem sem nome de arquivo' }}</p>
            <p class="status-copy">{{ imagem.descricao || 'Sem descricao' }}</p>
            <div class="list-actions">
              <button type="button" class="ghost-button" @click="populateForm(imagem)">Editar</button>
              <button type="button" class="danger-button" @click="handleDelete(imagem)">Excluir</button>
            </div>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.module-page { min-height: 100vh; background:
  radial-gradient(circle at top left, rgba(0, 138, 124, 0.12), transparent 34%),
  linear-gradient(180deg, #f3f7f7 0%, #edf3f4 100%); padding: clamp(16px, 3vw, 28px); box-sizing: border-box; }
.module-shell { width: min(100%, 1180px); margin: 0 auto; display: grid; gap: 18px; }
.module-header, .panel-card { background: rgba(255, 255, 255, 0.94); border: 1px solid rgba(219, 228, 232, 0.95); border-radius: 24px; box-shadow: 0 14px 30px rgba(15, 35, 33, 0.07); }
.module-header { padding: clamp(18px, 2.8vw, 28px); display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }
.module-header-copy { display: grid; gap: 8px; }
.module-header h1 { margin: 0; font-size: clamp(1.8rem, 3vw, 2.4rem); color: #172033; }
.module-total, .status-copy, .field-help { margin: 0; color: #536579; line-height: 1.6; }
.module-exit, .primary-button, .ghost-button, .danger-button, .upload-button { min-height: 44px; border-radius: 999px; padding: 0 16px; font-weight: 700; font: inherit; }
.module-exit, .ghost-button, .upload-button-secondary { border: 1px solid #c8d5d9; background: #fff; color: #172033; }
.primary-button, .upload-button-primary { border: 0; background: linear-gradient(135deg, #008a7c 0%, #0f766e 100%); color: #fff; }
.danger-button { border: 1px solid #fecaca; background: #fff1f2; color: #b91c1c; }
.panel-card { padding: 24px; display: grid; gap: 20px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.field { display: grid; gap: 8px; }
.field span { color: #314255; font-weight: 700; }
.field input { min-height: 46px; border-radius: 14px; border: 1px solid #d6e0e4; background: #f7fbfb; padding: 0 14px; font: inherit; }
.native-file-input { display: none; }
.upload-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.upload-button { display: inline-flex; align-items: center; justify-content: center; }
.field-span-2, .feedback-group, .primary-button { grid-column: 1 / -1; }
.feedback-group { display: grid; gap: 10px; }
.feedback { margin: 0; padding: 12px 14px; border-radius: 14px; font-weight: 700; }
.feedback.success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.feedback.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.feedback.warning { background: #fff7ed; color: #9a3412; border: 1px solid #fdba74; display: grid; gap: 12px; }
.confirm-copy { margin: 0; font-weight: 700; }
.confirm-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.list-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; }
.list-card { border-radius: 20px; border: 1px solid #dbe4e8; background: #fcfefe; padding: 18px; display: grid; gap: 12px; }
.image-preview { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 16px; background: #e5eef0; }
.list-actions { display: flex; gap: 10px; flex-wrap: wrap; }
@media (max-width: 720px) {
  .module-header { flex-direction: column; }
  .module-exit, .primary-button, .ghost-button, .danger-button, .upload-button { width: 100%; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
