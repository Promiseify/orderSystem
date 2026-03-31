import { request } from '@/api/http'
import type { Order, OrderStatus } from '@/types/models'

export interface OrderQuery {
  keyword?: string
  status?: string
  date?: string
}

export async function fetchOrders(query: OrderQuery = {}): Promise<Order[]> {
  return request<Order[]>('/admin/orders', { query: query as Record<string, unknown> })
}

export async function updateOrderStatus(payload: { orderId: string; nextStatus: OrderStatus; remark?: string }): Promise<void> {
  await request<void>(`/admin/orders/${payload.orderId}/status`, {
    method: 'PATCH',
    body: {
      status: payload.nextStatus,
      remark: payload.remark ?? ''
    }
  })
}
