<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import ibgLogo from '@/assets/ibg-logo-login.png'
import { ApiError, apiRequest } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

type CheckEmailResponse = {
  encontrado: boolean
  usuario: {
    id: number
    nome: string
    email: string
  }
}

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const senha = ref('')
const erro = ref<string | null>(null)
const emailConfirmado = ref(false)
const emailVerificado = ref('')
const verificandoEmail = ref(false)
const passwordInput = ref<HTMLInputElement | null>(null)

const normalizedEmail = computed(() => email.value.trim().toLowerCase())
const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail.value))
const isPasswordValid = computed(() => senha.value.trim().length >= 6)
const isLoading = computed(() => verificandoEmail.value || authStore.loading)
const submitLabel = computed(() => {
  if (verificandoEmail.value) {
    return 'A verificar e-mail...'
  }

  if (authStore.loading) {
    return 'A iniciar sessão...'
  }

  return emailConfirmado.value ? 'Iniciar sessão' : 'Continuar'
})

const isSubmitDisabled = computed(() => {
  if (isLoading.value) {
    return true
  }

  if (!isEmailValid.value) {
    return true
  }

  return emailConfirmado.value ? !isPasswordValid.value : false
})

watch(normalizedEmail, (value) => {
  erro.value = null

  if (emailConfirmado.value && value !== emailVerificado.value) {
    emailConfirmado.value = false
    emailVerificado.value = ''
    senha.value = ''
  }
})

async function verificarEmail(emailInformado: string) {
  return apiRequest<CheckEmailResponse>('/auth/check-email', {
    method: 'POST',
    body: { email: emailInformado },
  })
}

async function handleSubmit() {
  erro.value = null

  if (!isEmailValid.value) {
    erro.value = 'Informe um e-mail válido para continuar.'
    return
  }

  const emailValue = normalizedEmail.value

  if (!emailConfirmado.value) {
    verificandoEmail.value = true

    try {
      await verificarEmail(emailValue)
      email.value = emailValue
      emailConfirmado.value = true
      emailVerificado.value = emailValue
      senha.value = ''

      await nextTick()
      passwordInput.value?.focus()
      return
    } catch (error) {
      erro.value =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Não foi possível verificar o e-mail informado.'
      return
    } finally {
      verificandoEmail.value = false
    }
  }

  if (!isPasswordValid.value) {
    erro.value = 'Informe a palavra-passe com pelo menos 6 caracteres.'
    return
  }

  try {
    await authStore.login(emailValue, senha.value)
    await router.push({ name: 'dashboard' })
  } catch (error) {
    erro.value =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Não foi possível iniciar a sessão.'
  }
}
</script>

<template>
  <main class="login-page">
    <div class="login-bg" aria-hidden="true">
      <div class="login-bg-orb login-bg-orb-left" />
      <div class="login-bg-orb login-bg-orb-right" />
    </div>

    <section class="login-shell" aria-label="Acesso ao sistema IBG Utensílios">
      <header class="login-brand">
        <div class="login-brand-icon-wrap">
          <img :src="ibgLogo" alt="Logo Igreja Batista da Graça" class="login-brand-image" />
        </div>
        <h1>IBG UTENSÍLIOS</h1>
      </header>

      <section class="login-card">
        <div class="auth-card-copy">
          <p class="auth-eyebrow">Inicie sessão</p>
        </div>

        <form class="login-form" @submit.prevent="handleSubmit" novalidate>
          <label class="field-shell" :class="{ 'field-shell-active': emailConfirmado }">
            <span class="field-inline-label">E-mail</span>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="seu@email.com"
              :aria-invalid="erro ? 'true' : 'false'"
              required
            />
          </label>

          <label v-if="emailConfirmado" class="field-shell">
            <span class="field-inline-label">Palavra-passe</span>
            <input
              ref="passwordInput"
              v-model="senha"
              type="password"
              autocomplete="current-password"
              placeholder="Digite a sua palavra-passe"
              :aria-invalid="erro ? 'true' : 'false'"
              required
            />
          </label>

          <p v-if="erro" class="feedback error" role="alert">
            {{ erro }}
          </p>

          <button class="login-submit" type="submit" :disabled="isSubmitDisabled">
            <span>{{ submitLabel }}</span>
          </button>
        </form>
      </section>
    </section>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap');

:global(:root) {
  color: #f8fafc;
  background: #0b1017;
  font-family: 'Manrope', sans-serif;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(32, 189, 196, 0.14), transparent 30%),
    radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.12), transparent 28%),
    #0b1017;
}

:global(button),
:global(input) {
  font: inherit;
}

.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  box-sizing: border-box;
}

.login-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}

.login-bg-orb {
  position: absolute;
  width: min(40vw, 320px);
  height: min(40vw, 320px);
  border-radius: 999px;
  filter: blur(72px);
}

.login-bg-orb-left {
  top: -10%;
  left: -10%;
  background: rgba(45, 212, 191, 0.18);
}

.login-bg-orb-right {
  right: -8%;
  bottom: -10%;
  background: rgba(59, 130, 246, 0.14);
}

.login-shell {
  width: min(100%, 520px);
  display: grid;
  gap: 24px;
}

.login-brand {
  display: grid;
  justify-items: center;
  gap: 10px;
  text-align: center;
}

.login-brand-icon-wrap {
  width: 240px;
  height: 240px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.login-brand-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.22));
}

.login-brand h1 {
  margin: 0;
  color: #f8fafc;
  font-size: clamp(2rem, 5vw, 2.8rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}

.login-card {
  background: rgba(18, 24, 34, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 28px;
  box-shadow: 0 24px 56px rgba(0, 0, 0, 0.38);
  padding: 28px 24px 24px;
  backdrop-filter: blur(20px);
}

.auth-card-copy {
  display: grid;
  gap: 8px;
  margin-bottom: 18px;
}

.auth-eyebrow {
  margin: 0;
  color: #e2e8f0;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.login-form {
  display: grid;
  gap: 14px;
}

.field-shell {
  display: grid;
  gap: 6px;
  padding: 12px 16px 14px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 16px;
  background: rgba(18, 24, 34, 0.92);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  box-sizing: border-box;
}

.field-shell:focus-within {
  border-color: rgba(56, 189, 248, 0.72);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.16);
}

.field-shell-active {
  border-color: rgba(250, 204, 21, 0.48);
  background: rgba(56, 43, 6, 0.55);
}

.field-inline-label {
  font-size: 0.76rem;
  font-weight: 800;
  color: #cbd5e1;
}

.field-shell input {
  width: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  color: #f8fafc;
  caret-color: #67e8f9;
  font-size: 1rem;
  box-sizing: border-box;
  -webkit-text-fill-color: #f8fafc;
}

.field-shell input::placeholder {
  color: #8b98ae;
}

.field-shell input:-webkit-autofill,
.field-shell input:-webkit-autofill:hover,
.field-shell input:-webkit-autofill:focus,
.field-shell input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px rgba(18, 24, 34, 0.92) inset;
  -webkit-text-fill-color: #f8fafc;
  caret-color: #67e8f9;
  transition: background-color 9999s ease-in-out 0s;
}

.field-shell input:focus-visible {
  outline: none;
}

.field-shell input[aria-invalid='true'] {
  color: #fecaca;
}

.feedback {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 0.94rem;
  font-weight: 700;
}

.feedback.error {
  color: #fecaca;
  background: rgba(127, 29, 29, 0.35);
  border: 1px solid rgba(248, 113, 113, 0.35);
}

.login-submit {
  width: 100%;
  min-height: 54px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #eff6ff;
  font-size: 1rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14px 26px rgba(37, 99, 235, 0.24);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.login-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 18px 30px rgba(37, 99, 235, 0.28);
}

.login-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.login-submit:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.5);
  outline-offset: 3px;
}

@media (max-width: 560px) {
  .login-shell {
    gap: 18px;
  }

  .login-brand-icon-wrap {
    width: 180px;
    height: 180px;
  }

  .login-card {
    padding: 22px 16px 18px;
    border-radius: 22px;
  }
}
</style>
