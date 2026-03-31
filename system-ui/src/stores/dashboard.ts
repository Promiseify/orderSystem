import { defineStore } from 'pinia'
import { useDishStore } from '@/stores/dish'
import { useOrderStore } from '@/stores/order'
import { sameDate, todayText } from '@/utils/time'
import type { Order } from '@/types/models'

interface TrendItem {
  date: string
  orderCount: number
  amount: number
}

function buildRecentDates(days: number): string[] {
  const list: string[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    list.push(d.toISOString().slice(0, 10))
  }
  return list
}

export const useDashboardStore = defineStore('dashboard', {
  getters: {
    allOrders(): Order[] {
      return useOrderStore().list
    },
    todayOrders(): Order[] {
      const today = todayText()
      return this.allOrders.filter((order) => sameDate(order.createdAt, today))
    },
    todayOrderCount(): number {
      return this.todayOrders.length
    },
    todayRevenue(): number {
      return this.todayOrders
        .filter((order) => ['completed', 'served', 'ready', 'cooking', 'accepted'].includes(order.status))
        .reduce((sum, order) => sum + order.totalAmount, 0)
    },
    pendingCount(): number {
      return this.allOrders.filter((order) => order.status === 'pending').length
    },
    dishCount(): number {
      return useDishStore().list.length
    },
    hotDishRanking(): Array<{ dishId: string; dishName: string; sales: number }> {
      const dishStore = useDishStore()
      return dishStore.list
        .map((dish) => ({ dishId: dish.id, dishName: dish.name, sales: dish.sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)
    },
    recentOrders(): Order[] {
      return [...this.allOrders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 8)
    },
    trend7d(): TrendItem[] {
      const dates = buildRecentDates(7)
      return dates.map((date) => {
        const orders = this.allOrders.filter((order) => sameDate(order.createdAt, date))
        return {
          date,
          orderCount: orders.length,
          amount: orders.reduce((sum, order) => sum + order.totalAmount, 0)
        }
      })
    }
  },
  actions: {
    async fetchData(): Promise<void> {
      const orderStore = useOrderStore()
      const dishStore = useDishStore()
      await Promise.all([orderStore.fetchList(), dishStore.fetchList()])
    }
  }
})
