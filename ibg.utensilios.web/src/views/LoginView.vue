<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const senha = ref('')
const erro = ref<string | null>(null)

const isFormValid = computed(() => email.value.trim() !== '' && senha.value.trim() !== '')

async function handleSubmit() {
  erro.value = null

  try {
    await authStore.login(email.value.trim().toLowerCase(), senha.value)
    await router.push({ name: 'dashboard' })
  } catch (error) {
    erro.value =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Nao foi possivel autenticar.'
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
        <div class="login-brand-icon-wrap" aria-hidden="true">
          <span class="login-brand-icon">UI</span>
        </div>
        <h1>IBG UTENSÍLIOS</h1>
        <p>Controle de itens e emprestimos</p>
      </header>

      <section class="login-card">
        <div class="auth-card-copy">
          <p class="auth-eyebrow">Acesso seguro</p>
          <h2>Entre com seu e-mail e senha</h2>
          <p class="auth-description">
            A tela foi preparada para seguir a referencia visual do CECOM, com foco em clareza,
            legibilidade e uso rapido em desktop e mobile.
          </p>
        </div>

        <form class="login-form" @submit.prevent="handleSubmit" novalidate>
          <label class="field-group">
            <span class="field-label">E-mail</span>
            <div class="field-control">
              <span class="field-icon" aria-hidden="true">@</span>
              <input
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="seu@email.com"
                :aria-invalid="erro ? 'true' : 'false'"
                required
              />
            </div>
          </label>

          <label class="field-group">
            <span class="field-label">Senha</span>
            <div class="field-control">
              <span class="field-icon" aria-hidden="true">*</span>
              <input
                v-model="senha"
                type="password"
                autocomplete="current-password"
                placeholder="********"
                :aria-invalid="erro ? 'true' : 'false'"
                required
              />
            </div>
          </label>

          <p v-if="erro" class="feedback error" role="alert">
            {{ erro }}
          </p>

          <button class="login-submit" type="submit" :disabled="authStore.loading || !isFormValid">
            <span>{{ authStore.loading ? 'Entrando...' : 'Entrar' }}</span>
            <span aria-hidden="true">></span>
          </button>
        </form>
      </section>
    </section>
  </main>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap');

:global(:root) {
  color: #111827;
  background: #f5f8f8;
  font-family: 'Manrope', sans-serif;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: #f5f8f8;
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
  padding: 20px;
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
  width: min(42vw, 280px);
  height: min(42vw, 280px);
  border-radius: 999px;
  background: rgba(0, 138, 124, 0.12);
  filter: blur(52px);
}

.login-bg-orb-left {
  top: -10%;
  left: -10%;
}

.login-bg-orb-right {
  right: -10%;
  bottom: -10%;
}

.login-shell {
  width: min(100%, 496px);
  display: grid;
  gap: 28px;
}

.login-brand {
  display: grid;
  justify-items: center;
  gap: 8px;
  text-align: center;
}

.login-brand-icon-wrap {
  width: 58px;
  height: 58px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 138, 124, 0.12);
  color: #008a7c;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.login-brand h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 2.35rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #172033;
}

.login-brand p {
  margin: 0;
  color: #008a7c;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.8rem;
  font-weight: 800;
}

.login-card {
  background: #ffffff;
  border: 1px solid #dde6ea;
  border-radius: 18px;
  box-shadow: 0 18px 44px rgba(15, 35, 33, 0.1);
  padding: 28px 24px 24px;
}

.auth-card-copy {
  display: grid;
  gap: 8px;
  margin-bottom: 22px;
}

.auth-eyebrow {
  margin: 0;
  color: #008a7c;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.auth-card-copy h2 {
  margin: 0;
  color: #172033;
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.auth-description {
  margin: 0;
  color: #607083;
  line-height: 1.65;
}

.login-form {
  display: grid;
  gap: 18px;
}

.field-group {
  display: grid;
  gap: 8px;
}

.field-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #334155;
}

.field-control {
  position: relative;
}

.field-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #93a4b5;
  font-weight: 800;
  pointer-events: none;
}

.field-control input {
  width: 100%;
  min-height: 50px;
  border: 1px solid #dbe4e8;
  border-radius: 12px;
  background: #eef3f4;
  color: #111827;
  box-sizing: border-box;
  padding: 0 14px 0 42px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field-control input::placeholder {
  color: #94a3b8;
}

.field-control input:focus-visible {
  outline: none;
  border-color: #008a7c;
  box-shadow: 0 0 0 3px rgba(0, 138, 124, 0.16);
}

.field-control input[aria-invalid='true'] {
  border-color: #dc2626;
}

.feedback {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
}

.feedback.error {
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.login-submit {
  min-height: 52px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #008a7c 0%, #0f766e 100%);
  color: #ffffff;
  font-size: 1rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 12px 24px rgba(0, 138, 124, 0.24);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.login-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(0, 138, 124, 0.28);
}

.login-submit:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.login-submit:focus-visible {
  outline: 2px solid rgba(0, 138, 124, 0.3);
  outline-offset: 3px;
}

@media (max-width: 560px) {
  .login-page {
    padding: 14px;
  }

  .login-card {
    padding: 22px 16px 18px;
    border-radius: 16px;
  }

  .auth-card-copy h2 {
    font-size: 1.26rem;
  }
}
</style>
