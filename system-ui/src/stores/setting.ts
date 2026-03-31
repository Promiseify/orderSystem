import { defineStore } from 'pinia'
import {
  fetchOperationLogs as apiFetchOperationLogs,
  fetchStoreSetting as apiFetchStoreSetting,
  updateStoreSetting as apiUpdateStoreSetting
} from '@/api/setting'
import { extractErrorMessage } from '@/utils/error'
import type { OperationLog, StoreSetting } from '@/types/models'

const defaultSetting: StoreSetting = {
  storeName: '',
  businessHours: '',
  phone: '',
  notice: '',
  minDeliveryFee: 0,
  deliveryFee: 0,
  bannerImages: []
}

export const useSettingStore = defineStore('setting', {
  state: () => ({
    setting: { ...defaultSetting } as StoreSetting,
    operationLogs: [] as OperationLog[],
    loading: false
  }),
  getters: {
    currentSetting: (state) => ({ ...state.setting, bannerImages: [...state.setting.bannerImages] }),
    latestLogs: (state) => state.operationLogs
  },
  actions: {
    async fetchSetting(): Promise<void> {
      this.setting = await apiFetchStoreSetting()
    },
    async fetchOperationLogs(limit = 20): Promise<void> {
      this.operationLogs = await apiFetchOperationLogs(limit)
    },
    async fetchAll(): Promise<void> {
      this.loading = true
      try {
        await Promise.all([this.fetchSetting(), this.fetchOperationLogs(20)])
      } finally {
        this.loading = false
      }
    },
    async update(setting: StoreSetting): Promise<{ ok: boolean; message: string }> {
      try {
        await apiUpdateStoreSetting({
          ...setting,
          bannerImages: setting.bannerImages.filter((item) => item.trim().length > 0)
        })
        await this.fetchSetting()
        await this.fetchOperationLogs(20)
        return { ok: true, message: '保存成功' }
      } catch (error) {
        return { ok: false, message: extractErrorMessage(error, '保存失败') }
      }
    }
  }
})
