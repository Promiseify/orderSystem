import { request } from '@/api/http'
import type { Dish } from '@/types/models'

export interface DishQuery {
  keyword?: string
  categoryId?: string
  status?: 'on' | 'off'
}

export async function fetchDishes(query: DishQuery = {}): Promise<Dish[]> {
  return request<Dish[]>('/admin/dishes', { query: query as Record<string, unknown> })
}

export async function createDish(payload: Omit<Dish, 'id' | 'sales' | 'updatedAt'>): Promise<void> {
  await request<void>('/admin/dishes', { method: 'POST', body: payload })
}

export async function updateDish(payload: Dish): Promise<void> {
  await request<void>(`/admin/dishes/${payload.id}`, { method: 'PUT', body: payload })
}

export async function removeDish(dishId: string): Promise<void> {
  await request<void>(`/admin/dishes/${dishId}`, { method: 'DELETE' })
}

export async function toggleDishStatus(dishId: string): Promise<void> {
  await request<void>(`/admin/dishes/${dishId}/status`, { method: 'PATCH' })
}
