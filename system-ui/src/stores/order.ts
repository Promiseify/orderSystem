import { defineStore } from 'pinia'
import { ORDER_STATUS_FLOW } from '@/constants'
import { fetchOrders, updateOrderStatus } from '@/api/order'
import { extractErrorMessage } from '@/utils/error'
import type { Order, OrderStatus } from '@/types/models'

export const useOrderStore = defineStore('order', {
  state: () => ({
    items: [] as Order[],
    loading: false
  }),
  getters: {
    list: (state) => [...state.items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  },
  actions: {
    async fetchList(query: { keyword?: string; status?: string; date?: string } = {}): Promise<void> {
      this.loading = true
      try {
        this.items = await fetchOrders(query)
      } finally {
        this.loading = false
      }
    },
    getAllowedNext(status: OrderStatus): OrderStatus[] {
      return ORDER_STATUS_FLOW[status] ?? []
    },
    canTransition(current: OrderStatus, next: OrderStatus): boolean {
      return this.getAllowedNext(current).includes(next)
    },
    async updateStatus(orderId: string, nextStatus: OrderStatus, remark = ''): Promise<{ ok: boolean; message: string }> {
      try {
        await updateOrderStatus({ orderId, nextStatus, remark })
        await this.fetchList()
        return { ok: true, message: '状态更新成功' }
      } catch (error) {
        return { ok: false, message: extractErrorMessage(error, '状态更新失败') }
      }
    }
  }
})
