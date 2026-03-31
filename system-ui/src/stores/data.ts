import { defineStore } from 'pinia'

export const useDataStore = defineStore('data', {
  state: () => ({
    syncing: false
  }),
  actions: {
    setSyncing(value: boolean) {
      this.syncing = value
    }
  }
})
