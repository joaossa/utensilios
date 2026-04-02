const DEFAULT_API_BASE_URL = 'http://localhost:3001'

import { clearSession } from '@/utils/auth-session'

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  token?: string | null
}

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function getStoredToken() {
  try {
    const rawSession = localStorage.getItem('ibg-utensilios-auth')

    if (!rawSession) {
      return null
    }

    const parsed = JSON.parse(rawSession) as { token?: unknown }
    return typeof parsed.token === 'string' && parsed.token.trim() !== '' ? parsed.token : null
  } catch {
    return null
  }
}

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const headers = new Headers()
  headers.set('Accept', 'application/json')

  const isFormData = options.body instanceof FormData
  const requestBody: BodyInit | null | undefined =
    options.body === undefined
      ? undefined
      : isFormData
        ? (options.body as FormData)
        : (JSON.stringify(options.body) as BodyInit)

  if (options.body !== undefined && !isFormData) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: requestBody,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : 'Nao foi possivel concluir a requisicao.'

    const isLoginRequest = path === '/auth/login'

    if (response.status === 401) {
      clearSession()
      throw new ApiError(
        isLoginRequest ? message : 'Sua sessao expirou ou ficou invalida. Entre novamente.',
        401,
        payload,
      )
    }

    throw new ApiError(message, response.status, payload)
  }

  return payload as T
}

export async function authApiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const token = options.token ?? getStoredToken()

  if (!token) {
    throw new ApiError('Sessao expirada. Entre novamente.', 401)
  }

  return apiRequest<T>(path, {
    ...options,
    token,
  })
}
