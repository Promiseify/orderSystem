export interface ApiEnvelope<T> {
  code?: number
  msg?: string
  message?: string
  data?: T
}

export interface ApiListResult<T> {
  list: T[]
  total?: number
}

export interface LoginResult {
  token: string
  user: {
    id: string
    name: string
    username: string
    role: 'admin' | 'manager' | 'clerk'
  }
}

export interface DashboardOverview {
  todayOrderCount: number
  todayRevenue: number
  pendingCount: number
  dishCount: number
  hotDishRanking: Array<{ dishId: string; dishName: string; sales: number }>
  trend7d: Array<{ date: string; orderCount: number; amount: number }>
}
