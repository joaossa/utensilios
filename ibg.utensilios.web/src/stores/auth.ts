import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { apiRequest } from '@/services/api'
import {
  clearSession,
  getStoredSession,
  saveSession,
  type AuthSession,
} from '@/utils/auth-session'

type LoginResponse = AuthSession

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(getStoredSession())
  const loading = ref(false)

  const isAuthenticated = computed(() => !!session.value)
  const user = computed(() => session.value?.usuario ?? null)
  const token = computed(() => session.value?.token ?? null)

  async function login(email: string, senha: string) {
    loading.value = true

    try {
      const response = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email, senha },
      })

      session.value = response
      saveSession(response)
    } finally {
      loading.value = false
    }
  }

  function logout() {
    session.value = null
    clearSession()
  }

  return {
    loading,
    isAuthenticated,
    user,
    token,
    login,
    logout,
  }
})
