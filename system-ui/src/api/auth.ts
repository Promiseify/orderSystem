import { request } from '@/api/http'
import type { LoginPayload, SessionUser } from '@/types/models'
import type { LoginResult } from '@/types/api'

export async function loginByPassword(payload: LoginPayload): Promise<LoginResult> {
  return request<LoginResult>('/admin/auth/login', {
    method: 'POST',
    body: payload,
    auth: false
  })
}

export async function fetchProfile(): Promise<SessionUser> {
  return request<SessionUser>('/admin/auth/profile')
}

export async function logoutRequest(): Promise<void> {
  await request<void>('/admin/auth/logout', { method: 'POST' })
}
