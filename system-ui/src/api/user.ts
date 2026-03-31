import { request } from '@/api/http'
import type { AdminAccount, AppUser, RoleCode } from '@/types/models'

export async function fetchAppUsers(): Promise<AppUser[]> {
  return request<AppUser[]>('/admin/app-users')
}

export async function toggleAppUserStatus(userId: string): Promise<void> {
  await request<void>(`/admin/app-users/${userId}/status`, { method: 'PATCH' })
}

export async function fetchAdminUsers(): Promise<AdminAccount[]> {
  return request<AdminAccount[]>('/admin/admin-users')
}

export async function createAdmin(payload: {
  username: string
  password: string
  name: string
  role: RoleCode
  status: 'enabled' | 'disabled'
}): Promise<void> {
  await request<void>('/admin/admin-users', { method: 'POST', body: payload })
}

export async function updateAdmin(payload: {
  id: string
  name: string
  role: RoleCode
  status: 'enabled' | 'disabled'
  password?: string
}): Promise<void> {
  await request<void>(`/admin/admin-users/${payload.id}`, {
    method: 'PUT',
    body: payload
  })
}
