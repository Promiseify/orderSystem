<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <div class="brand">
        <h1>点餐系统</h1>
        <p>后台管理</p>
      </div>

      <nav class="menu-list">
        <button
          v-for="item in visibleMenus"
          :key="item.key"
          class="menu-item"
          :class="{ active: currentMenuKey === item.key }"
          @click="goMenu(item.key)"
        >
          {{ item.label }}
        </button>
      </nav>
    </aside>

    <div class="main-wrap">
      <header class="topbar">
        <div>
          <h2>{{ pageTitle }}</h2>
          <p>欢迎，{{ authStore.sessionUser?.name }}（{{ authStore.roleLabel }}）</p>
        </div>
        <div class="topbar-actions">
          <button class="secondary" :disabled="syncing" @click="handleSyncData">{{ syncing ? '同步中...' : '同步后端数据' }}</button>
          <button class="danger" @click="logout">退出登录</button>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCategoryStore } from '@/stores/category'
import { useDataStore } from '@/stores/data'
import { useDishStore } from '@/stores/dish'
import { useOrderStore } from '@/stores/order'
import { useSettingStore } from '@/stores/setting'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const dataStore = useDataStore()
const categoryStore = useCategoryStore()
const dishStore = useDishStore()
const orderStore = useOrderStore()
const userStore = useUserStore()
const settingStore = useSettingStore()

const menus = [
  { key: 'workbench', label: '工作台' },
  { key: 'category', label: '分类管理' },
  { key: 'dish', label: '菜品管理' },
  { key: 'order', label: '订单管理' },
  { key: 'user', label: '用户管理' },
  { key: 'setting', label: '门店配置' },
  { key: 'report', label: '数据统计' }
]

const visibleMenus = computed(() => menus.filter((item) => authStore.allowMenus.includes(item.key)))
const pageTitle = computed(() => String(route.meta.title ?? '后台管理'))
const currentMenuKey = computed(() => String(route.meta.menuKey ?? 'workbench'))
const syncing = computed(() => dataStore.syncing)

function goMenu(key: string) {
  router.push(`/${key}`)
}

async function logout() {
  await authStore.logout()
  router.replace('/login')
}

async function handleSyncData() {
  dataStore.setSyncing(true)
  const tasks: Array<Promise<void>> = [orderStore.fetchList()]

  if (authStore.canVisit('category')) {
    tasks.push(categoryStore.fetchList())
  }
  if (authStore.canVisit('dish')) {
    tasks.push(dishStore.fetchList())
  }
  if (authStore.canVisit('user')) {
    tasks.push(userStore.fetchAll())
  }
  if (authStore.canVisit('setting')) {
    tasks.push(settingStore.fetchAll())
  }

  const result = await Promise.allSettled(tasks)
  dataStore.setSyncing(false)

  if (result.some((item) => item.status === 'rejected')) {
    window.alert('部分数据同步失败，请检查后端接口或登录态')
    return
  }
  window.alert('数据同步完成')
}
</script>
