import type { OrderStatus, RoleCode } from '@/types/models'

export const DB_STORAGE_KEY = 'order-system-admin-db'
export const SESSION_STORAGE_KEY = 'order-system-admin-session'

export const ROLE_LABEL_MAP: Record<RoleCode, string> = {
  admin: '超级管理员',
  manager: '店长',
  clerk: '店员'
}

export const STATUS_LABEL_MAP: Record<OrderStatus, string> = {
  pending: '待接单',
  accepted: '已接单',
  cooking: '制作中',
  ready: '待上菜/待取餐',
  served: '已上菜',
  completed: '已完成',
  cancelled: '已取消',
  rejected: '已拒单'
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#d97706',
  accepted: '#2563eb',
  cooking: '#7c3aed',
  ready: '#0d9488',
  served: '#0891b2',
  completed: '#16a34a',
  cancelled: '#6b7280',
  rejected: '#dc2626'
}

export const ROLE_MENU_SCOPE: Record<RoleCode, string[]> = {
  admin: ['workbench', 'category', 'dish', 'order', 'user', 'setting', 'report'],
  manager: ['workbench', 'category', 'dish', 'order', 'report'],
  clerk: ['workbench', 'order']
}

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['cooking', 'cancelled'],
  cooking: ['ready', 'cancelled'],
  ready: ['served', 'completed', 'cancelled'],
  served: ['completed'],
  completed: [],
  cancelled: [],
  rejected: []
}
