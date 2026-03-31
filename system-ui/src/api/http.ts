import type { ApiEnvelope } from '@/types/api'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8080/api'

export const SESSION_TOKEN_STORAGE_KEY = 'order-system-admin-token'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getAccessToken(): string {
  return localStorage.getItem(SESSION_TOKEN_STORAGE_KEY) ?? ''
}

export function setAccessToken(token: string): void {
  if (!token) {
    localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY)
    return
  }
  localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token)
}

function appendQuery(url: URL, query?: Record<string, unknown>) {
  if (!query) {
    return
  }
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }
    url.searchParams.set(key, String(value))
  })
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, unknown>
  auth?: boolean
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`)
  appendQuery(url, options.query)

  const headers = new Headers({
    Accept: 'application/json'
  })

  const needAuth = options.auth ?? true
  if (needAuth) {
    const token = getAccessToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  let body: BodyInit | undefined
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.body)
  }

  const response = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers,
    body
  })

  const rawText = await response.text()
  let payload: ApiEnvelope<T> | T | null = null
  if (rawText) {
    try {
      payload = JSON.parse(rawText) as ApiEnvelope<T> | T
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && ('msg' in payload || 'message' in payload)
        ? String((payload as ApiEnvelope<T>).msg ?? (payload as ApiEnvelope<T>).message)
        : `请求失败(${response.status})`
    throw new ApiError(message || `请求失败(${response.status})`, response.status)
  }

  if (payload && typeof payload === 'object' && 'code' in payload) {
    const envelope = payload as ApiEnvelope<T>
    if (typeof envelope.code === 'number' && envelope.code !== 0 && envelope.code !== 200) {
      throw new ApiError(envelope.msg || envelope.message || '业务请求失败', response.status)
    }
    return (envelope.data as T) ?? ({} as T)
  }

  return (payload as T) ?? ({} as T)
}
