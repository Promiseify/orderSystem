import { defineStore } from 'pinia'
import { ROLE_LABEL_MAP } from '@/constants'
import {
  createAdmin as apiCreateAdmin,
  fetchAdminUsers as apiFetchAdminUsers,
  fetchAppUsers as apiFetchAppUsers,
  toggleAppUserStatus as apiToggleAppUserStatus,
  updateAdmin as apiUpdateAdmin
} from '@/api/user'
import { extractErrorMessage } from '@/utils/error'
import type { AdminAccount, AppUser, RoleCode } from '@/types/models'

interface AdminPayload {
  username: string
  password: string
  name: string
  role: RoleCode
  status: 'enabled' | 'disabled'
}

export const useUserStore = defineStore('user', {
  state: () => ({
    appUserItems: [] as AppUser[],
    adminUserItems: [] as AdminAccount[],
    loading: false
  }),
  getters: {
    appUsers: (state) => state.appUserItems,
    adminUsers: (state) => state.adminUserItems
  },
  actions: {
    roleLabel(role: RoleCode): string {
      return ROLE_LABEL_MAP[role]
    },
    async fetchAppUsers(): Promise<void> {
      this.appUserItems = await apiFetchAppUsers()
    },
    async fetchAdminUsers(): Promise<void> {
      this.adminUserItems = await apiFetchAdminUsers()
    },
    async fetchAll(): Promise<void> {
      this.loading = true
      try {
        await Promise.all([this.fetchAppUsers(), this.fetchAdminUsers()])
      } finally {
        this.loading = false
      }
    },
    async toggleAppUserStatus(userId: string): Promise<{ ok: boolean; message: string }> {
      try {
        await apiToggleAppUserStatus(userId)
        await this.fetchAppUsers()
        return { ok: true, message: '用户状态已更新' }
      } catch (error) {
        return { ok: false, message: extractErrorMessage(error, '操作失败') }
      }
    },
    async createAdmin(payload: AdminPayload): Promise<{ ok: boolean; message: string }> {
      try {
        await apiCreateAdmin(payload)
        await this.fetchAdminUsers()
        return { ok: true, message: '新增成功' }
      } catch (error) {
        return { ok: false, message: extractErrorMessage(error, '新增失败') }
      }
    },
    async updateAdmin(payload: AdminAccount): Promise<{ ok: boolean; message: string }> {
      try {
        await apiUpdateAdmin({
          id: payload.id,
          name: payload.name,
          role: payload.role,
          status: payload.status,
          password: payload.password?.trim() ? payload.password : undefined
        })
        await this.fetchAdminUsers()
        return { ok: true, message: '更新成功' }
      } catch (error) {
        return { ok: false, message: extractErrorMessage(error, '更新失败') }
      }
    }
  }
})
