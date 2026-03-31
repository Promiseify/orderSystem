export type RoleCode = 'admin' | 'manager' | 'clerk'

export type RecordStatus = 'enabled' | 'disabled'

export interface AdminAccount {
  id: string
  username: string
  password?: string
  name: string
  role: RoleCode
  status: RecordStatus
  createdAt: string
  lastLoginAt?: string
}

export interface AppUser {
  id: string
  nickname: string
  phone: string
  avatar: string
  status: RecordStatus
  orderCount: number
  totalSpent: number
  createdAt: string
}

export interface Category {
  id: string
  name: string
  sort: number
  status: RecordStatus
  createdAt: string
  updatedAt: string
}

export type DishStatus = 'on' | 'off'

export interface Dish {
  id: string
  categoryId: string
  name: string
  price: number
  stock: number
  sales: number
  status: DishStatus
  image: string
  description: string
  updatedAt: string
}

export type OrderType = 'dine_in' | 'takeaway'

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'cooking'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled'
  | 'rejected'

export interface OrderItem {
  dishId: string
  nameSnapshot: string
  priceSnapshot: number
  quantity: number
  servedQuantity: number
}

export interface OrderLog {
  id: string
  action: string
  operatorId: string
  operatorName: string
  source: 'admin' | 'mini'
  time: string
  remark: string
}

export interface Order {
  id: string
  userId: string
  userName: string
  type: OrderType
  tableNo?: string
  contactPhone?: string
  remark?: string
  status: OrderStatus
  items: OrderItem[]
  totalAmount: number
  createdAt: string
  updatedAt: string
  logs: OrderLog[]
}

export interface StoreSetting {
  storeName: string
  businessHours: string
  phone: string
  notice: string
  minDeliveryFee: number
  deliveryFee: number
  bannerImages: string[]
}

export interface OperationLog {
  id: string
  module: string
  action: string
  operatorId: string
  operatorName: string
  detail: string
  time: string
}

export interface DatabaseState {
  admins: AdminAccount[]
  appUsers: AppUser[]
  categories: Category[]
  dishes: Dish[]
  orders: Order[]
  storeSetting: StoreSetting
  operationLogs: OperationLog[]
}

export interface LoginPayload {
  username: string
  password: string
}

export interface SessionUser {
  id: string
  name: string
  username: string
  role: RoleCode
}
