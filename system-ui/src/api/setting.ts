import { request } from '@/api/http'
import type { OperationLog, StoreSetting } from '@/types/models'

export async function fetchStoreSetting(): Promise<StoreSetting> {
  return request<StoreSetting>('/admin/store-setting')
}

export async function updateStoreSetting(payload: StoreSetting): Promise<void> {
  await request<void>('/admin/store-setting', { method: 'PUT', body: payload })
}

export async function fetchOperationLogs(limit = 20): Promise<OperationLog[]> {
  return request<OperationLog[]>('/admin/operation-logs', { query: { limit } })
}
