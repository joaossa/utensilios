const SESSION_STORAGE_KEY = 'ibg-utensilios-auth'

export type AuthSession = {
  token: string
  usuario: {
    id: number
    email: string
    role: string
  }
}

export function getStoredSession() {
  const rawValue = localStorage.getItem(SESSION_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as AuthSession
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

export function hasStoredSession() {
  return !!getStoredSession()
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}
