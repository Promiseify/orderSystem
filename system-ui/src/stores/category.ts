import { defineStore } from 'pinia'
import {
  createCategory,
  fetchCategories,
  removeCategory,
  toggleCategoryStatus,
  updateCategory
} from '@/api/category'
import { extractErrorMessage } from '@/utils/error'
import type { Category } from '@/types/models'

export const useCategoryStore = defineStore('category', {
  state: () => ({
    items: [] as Category[],
    loading: false
  }),
  getters: {
    list: (state) => [...state.items].sort((a, b) => a.sort - b.sort)
  },
  actions: {
    async fetchList(): Promise<void> {
      this.loading = true
      try {
        this.items = await fetchCategories()
      } finally {
        this.loading = false
      }
    },
    async create(payload: { name: string; sort: number; status: 'enabled' | 'disabled' }): Promise<{ ok: boolean; message: string }> {
      try {
        await createCategory(payload)
        await this.fetchList()
        return { ok: true, message: '新增成功' }
      } catch (error) {
        return { ok: false, message: extractErrorMessage(error, '新增失败') }
      }
    },
    async update(payload: Category): Promise<{ ok: boolean; message: string }> {
      try {
        await updateCategory(payload)
        await this.fetchList()
        return { ok: true, message: '更新成功' }
      } catch (error) {
        return { ok: false, message: extractErrorMessage(error, '更新失败') }
      }
    },
    async remove(categoryId: string): Promise<{ ok: boolean; message: string }> {
      try {
        await removeCategory(categoryId)
        await this.fetchList()
        return { ok: true, message: '删除成功' }
      } catch (error) {
        return { ok: false, message: extractErrorMessage(error, '删除失败') }
      }
    },
    async toggleStatus(categoryId: string): Promise<{ ok: boolean; message: string }> {
      try {
        await toggleCategoryStatus(categoryId)
        await this.fetchList()
        return { ok: true, message: '状态已更新' }
      } catch (error) {
        return { ok: false, message: extractErrorMessage(error, '状态更新失败') }
      }
    }
  }
})
