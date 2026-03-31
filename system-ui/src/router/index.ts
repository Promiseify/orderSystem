import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layout/AdminLayout.vue'),
    redirect: '/workbench',
    children: [
      {
        path: 'workbench',
        name: 'workbench',
        component: () => import('@/views/dashboard/WorkbenchView.vue'),
        meta: { menuKey: 'workbench', title: '工作台' }
      },
      {
        path: 'category',
        name: 'category',
        component: () => import('@/views/category/CategoryManageView.vue'),
        meta: { menuKey: 'category', title: '菜品分类管理' }
      },
      {
        path: 'dish',
        name: 'dish',
        component: () => import('@/views/dish/DishManageView.vue'),
        meta: { menuKey: 'dish', title: '菜品管理' }
      },
      {
        path: 'order',
        name: 'order',
        component: () => import('@/views/order/OrderManageView.vue'),
        meta: { menuKey: 'order', title: '订单管理' }
      },
      {
        path: 'user',
        name: 'user',
        component: () => import('@/views/user/UserManageView.vue'),
        meta: { menuKey: 'user', title: '用户管理' }
      },
      {
        path: 'setting',
        name: 'setting',
        component: () => import('@/views/setting/StoreSettingView.vue'),
        meta: { menuKey: 'setting', title: '门店配置' }
      },
      {
        path: 'report',
        name: 'report',
        component: () => import('@/views/report/StatisticsView.vue'),
        meta: { menuKey: 'report', title: '数据统计' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/workbench'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia)
  await authStore.bootstrap()

  if (to.meta.public) {
    if (authStore.isLoggedIn) {
      return '/workbench'
    }
    return true
  }

  if (!authStore.isLoggedIn) {
    return '/login'
  }

  const menuKey = to.meta.menuKey as string | undefined
  if (menuKey && !authStore.canVisit(menuKey)) {
    const fallback = authStore.allowMenus[0] ?? 'workbench'
    return `/${fallback}`
  }

  return true
})

export default router
