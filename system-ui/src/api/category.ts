import { request } from '@/api/http'
import type { Category } from '@/types/models'

export async function fetchCategories(): Promise<Category[]> {
  return request<Category[]>('/admin/categories')
}

export async function createCategory(payload: { name: string; sort: number; status: 'enabled' | 'disabled' }): Promise<void> {
  await request<void>('/admin/categories', { method: 'POST', body: payload })
}

export async function updateCategory(payload: Category): Promise<void> {
  await request<void>(`/admin/categories/${payload.id}`, { method: 'PUT', body: payload })
}

export async function removeCategory(categoryId: string): Promise<void> {
  await request<void>(`/admin/categories/${categoryId}`, { method: 'DELETE' })
}

export async function toggleCategoryStatus(categoryId: string): Promise<void> {
  await request<void>(`/admin/categories/${categoryId}/status`, { method: 'PATCH' })
}
