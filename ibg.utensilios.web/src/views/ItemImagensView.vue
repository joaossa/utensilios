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

function clearMessages() {
  feedback.value = ''
  errorMessage.value = ''
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

  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('Selecione apenas arquivos de imagem.')
  }

  selectedFileLabel.value = file.name
  form.value.arquivo_base64 = await fileToBase64(file)
  form.value.nome_arquivo = file.name
  form.value.mime_type = file.type || null
  form.value.tamanho_bytes = file.size
  form.value.url_imagem = null
}

async function handleFileChange(event: Event) {
  clearMessages()
  const input = event.target as HTMLInputElement
  await setSelectedFile(input.files?.[0])
}

function openCameraPicker() {
  clearMessages()
  cameraInputRef.value?.click()
}

function openLibraryPicker() {
  clearMessages()
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
  clearMessages()

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
      <header class="module-header module-header-compact">
        <div class="module-header-copy">
          <h1>Imagens</h1>
          <p v-if="item" class="module-total">{{ item.codigo }} - <strong>{{ item.descricao }}</strong></p>
        </div>
        <q-btn
          round
          unelevated
          icon="arrow_back"
          class="module-exit module-exit-icon"
          aria-label="Voltar para lista"
          @click="goToList"
        />
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
              <q-btn
                no-caps
                unelevated
                stack
                icon="photo_camera"
                label="Câmara"
                class="upload-shortcut"
                @click="openCameraPicker"
              />
              <q-btn
                no-caps
                unelevated
                stack
                icon="photo_library"
                label="Arquivos"
                class="upload-shortcut"
                @click="openLibraryPicker"
              />
              <button type="button" class="upload-button upload-button-primary" @click="openCameraPicker">
                Câmara
              </button>
              <button type="button" class="upload-button upload-button-secondary" @click="openLibraryPicker">
                Arquivos
              </button>
            </div>

            <small v-if="selectedFileLabel" class="field-help">{{ selectedFileLabel }}</small>
          </label>

          <div class="field-row field-span-2">
            <label class="field field-shell-input descricao-field">
              <span>Descrição</span>
              <input v-model="form.descricao" maxlength="255" />
            </label>

            <label class="field field-shell-input ordem-field">
              <span>Ordem</span>
              <input v-model="form.ordem_input" inputmode="numeric" autocomplete="off" />
            </label>
          </div>

          <div class="feedback-group">
            <p v-if="feedback" class="feedback success">{{ feedback }}</p>
            <p v-if="errorMessage" class="feedback error">{{ errorMessage }}</p>
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
            <div class="image-frame">
              <img
                v-if="imagem.imagem_src"
                class="image-preview"
                :src="imagem.imagem_src"
                :alt="imagem.descricao || 'Imagem do item'"
              />

              <div class="image-actions">
                <button
                  type="button"
                  class="icon-button"
                  title="Editar imagem"
                  aria-label="Editar imagem"
                  @click="populateForm(imagem)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 20h4l10-10-4-4L4 16v4Zm3.2-1.5H5.5v-1.7l8.1-8.1 1.7 1.7-8.1 8.1ZM19 9l-4-4 1.2-1.2a1.7 1.7 0 0 1 2.4 0l1.6 1.6a1.7 1.7 0 0 1 0 2.4L19 9Z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  class="icon-button icon-button-danger"
                  title="Excluir imagem"
                  aria-label="Excluir imagem"
                  @click="handleDelete(imagem)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm-1 11h12l1-13H5l1 13Z"/>
                  </svg>
                </button>
              </div>
            </div>

            <p class="status-copy">{{ imagem.descricao || 'Sem descricao' }}</p>
          </article>
        </div>
      </section>
    </section>

    <div v-if="pendingDeleteImage" class="modal-backdrop" @click.self="clearDeleteRequest">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-image-title">
        <div class="modal-copy">
          <h2 id="delete-image-title">Confirmar exclusao</h2>
          <p>Deseja excluir a imagem selecionada?</p>
        </div>
        <div class="modal-actions">
          <button
            type="button"
            class="icon-button icon-button-danger modal-icon"
            title="Confirmar exclusao"
            aria-label="Confirmar exclusao"
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
            @click="clearDeleteRequest"
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
.module-page { min-height: 100vh; background:
  radial-gradient(circle at top left, rgba(0, 138, 124, 0.12), transparent 34%),
  linear-gradient(180deg, #f3f7f7 0%, #edf3f4 100%); padding: clamp(12px, 2.4vw, 18px); box-sizing: border-box; }
.module-shell { width: min(100%, 480px); margin: 0 auto; display: grid; gap: 12px; }
.module-header, .panel-card { background: rgba(255, 255, 255, 0.94); border: 1px solid rgba(219, 228, 232, 0.95); border-radius: 20px; box-shadow: 0 10px 22px rgba(15, 35, 33, 0.07); }
.module-header { padding: clamp(14px, 2.4vw, 18px); display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; }
.module-header-compact { position: relative; min-height: 60px; padding: 8px 12px; display: block; }
.module-header-copy { display: grid; gap: 2px; align-content: start; padding-right: 56px; }
.module-header h1 { margin: 0; font-size: clamp(1.45rem, 2.8vw, 1.8rem); color: #172033; }
.module-total, .status-copy, .field-help { margin: 0; color: #536579; line-height: 1.4; }
.module-exit, .primary-button, .ghost-button, .danger-button, .upload-button { min-height: 44px; border-radius: 999px; padding: 0 16px; font-weight: 700; font: inherit; }
.module-exit, .ghost-button, .upload-button-secondary { border: 1px solid #c8d5d9; background: #fff; color: #172033; }
.primary-button, .upload-button-primary { border: 0; background: linear-gradient(135deg, #008a7c 0%, #0f766e 100%); color: #fff; }
.module-exit-icon { width: 44px; min-width: 44px; padding: 0; display: inline-flex; align-items: center; justify-content: center; align-self: flex-end; color: #0f766e; border-color: rgba(15, 118, 110, 0.18); box-shadow: 0 6px 18px rgba(15, 35, 33, 0.06); }
.module-header-compact .module-exit-icon { position: absolute; right: 12px; bottom: 8px; align-self: auto; }
.danger-button { border: 1px solid #fecaca; background: #fff1f2; color: #b91c1c; }
.panel-card { padding: 14px; display: grid; gap: 14px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.field { display: grid; gap: 8px; }
.field span { color: #314255; font-weight: 700; }
.field input { width: 100%; max-width: 100%; box-sizing: border-box; min-height: 46px; border-radius: 14px; border: 1px solid #d6e0e4; background: #f7fbfb; padding: 0 14px; font: inherit; }
.field-shell-input { gap: 4px; padding: 10px 14px 12px; border: 1px solid #d6e0e4; border-radius: 14px; background: #f7fbfb; }
.field-shell-input > span { font-size: 0.76rem; font-weight: 800; color: #536579; }
.field-shell-input input { min-height: auto; padding: 0; border: 0; background: transparent; }
.field-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 84px); gap: 12px; align-items: end; }
.descricao-field, .ordem-field { min-width: 0; }
.native-file-input { display: none; }
.upload-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.upload-button { display: none; }
:deep(.upload-shortcut) { width: 96px; min-height: 98px; border-radius: 22px; background: #1f1f1f; color: #ffffff; box-shadow: 0 10px 24px rgba(15, 35, 33, 0.14); }
:deep(.upload-shortcut .q-btn__content) { gap: 10px; }
:deep(.upload-shortcut .q-icon) { width: 52px; height: 52px; border-radius: 999px; background: rgba(255, 255, 255, 0.08); font-size: 1.7rem; }
:deep(.upload-shortcut .block) { font-size: 0.88rem; font-weight: 700; }
.field-span-2, .feedback-group, .primary-button { grid-column: 1 / -1; }
.feedback-group { display: grid; gap: 10px; }
.feedback { margin: 0; padding: 12px 14px; border-radius: 14px; font-weight: 700; }
.feedback.success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.feedback.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.list-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; }
.list-card { border-radius: 20px; border: 1px solid #dbe4e8; background: #fcfefe; padding: 18px; display: grid; gap: 12px; }
.image-frame { position: relative; }
.image-preview { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 16px; background: #e5eef0; }
.image-actions { position: absolute; right: 10px; bottom: 10px; display: flex; gap: 8px; }
.icon-button { width: 40px; height: 40px; border-radius: 12px; border: 1px solid rgba(200, 213, 217, 0.96); background: rgba(255, 255, 255, 0.96); color: #172033; display: inline-flex; align-items: center; justify-content: center; padding: 0; box-shadow: 0 8px 20px rgba(15, 35, 33, 0.16); }
.icon-button svg { width: 18px; height: 18px; fill: currentColor; }
.icon-button-danger { border-color: rgba(254, 202, 202, 0.96); background: rgba(255, 241, 242, 0.98); color: #b91c1c; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.34); display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-card { width: min(100%, 420px); background: rgba(255, 255, 255, 0.98); border: 1px solid rgba(219, 228, 232, 0.95); border-radius: 20px; box-shadow: 0 14px 30px rgba(15, 35, 33, 0.12); padding: 22px; display: grid; gap: 18px; }
.modal-copy { display: grid; gap: 8px; }
.modal-copy h2 { margin: 0; color: #172033; }
.modal-copy p { margin: 0; color: #536579; line-height: 1.6; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.modal-icon { width: 48px; height: 48px; }
@media (max-width: 720px) {
  .module-header { flex-direction: column; }
  .module-exit, .primary-button, .ghost-button, .danger-button, .upload-button { width: 100%; }
  .module-exit-icon { width: 44px; align-self: flex-end; }
  .form-grid { grid-template-columns: 1fr; }
  .field-row { grid-template-columns: 1fr; }
  .upload-actions { justify-content: center; }
  .modal-actions { justify-content: flex-start; }
}
</style>
