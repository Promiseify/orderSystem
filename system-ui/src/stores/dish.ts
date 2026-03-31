import { defineStore } from 'pinia'
import { createDish, fetchDishes, removeDish, toggleDishStatus, updateDish } from '@/api/dish'
import { extractErrorMessage } from '@/utils/error'
import type { Dish } from '@/types/models'

interface DishPayload {
  categoryId: string
  name: string
  price: number
  stock: number
  status: 'on' | 'off'
  image: string
  description: string
}

export const useDishStore = defineStore('dish', {
  state: () => ({
    items: [] as Dish[],
    loading: false
  }),
  getters: {
    list: (state) => state.items
  },
  actions: {
    async fetchList(): Promise<void> {
      this.loading = true
      try {
        this.items = await fetchDishes()
      } finally {
        this.loading = false
      }
    },
    async create(payload: DishPayload): Promise<{ ok: boolean; message: string }> {
      try {
        await createDish(payload)
        await this.fetchList()
        return { ok: true, message: '新增成功' }
      } catch (error) {
        return { ok: false, message: extractErrorMessage(error, '新增失败') }
      }
    },
    async update(payload: Dish): Promise<{ ok: boolean; message: string }> {
      try {
        await updateDish(payload)
        await this.fetchList()
        return { ok: true, message: '更新成功' }
      } catch (error) {
        return { ok: false, message: extractErrorMessage(error, '更新失败') }
      }
    },
    async remove(dishId: string): Promise<{ ok: boolean; message: string }> {
      try {
        await removeDish(dishId)
        await this.fetchList()
        return { ok: true, message: '删除成功' }
      } catch (error) {
        return { ok: false, message: extractErrorMessage(error, '删除失败') }
      }
    },
    async toggleStatus(dishId: string): Promise<{ ok: boolean; message: string }> {
      try {
        await toggleDishStatus(dishId)
        await this.fetchList()
        return { ok: true, message: '状态已更新' }
      } catch (error) {
        return { ok: false, message: extractErrorMessage(error, '状态更新失败') }
      }
    }
  }
})
