import { nowText, randomId } from '@/utils/time'
import type {
  AdminAccount,
  AppUser,
  Category,
  DatabaseState,
  Dish,
  Order,
  OrderItem,
  StoreSetting
} from '@/types/models'

function genAdmins(now: string): AdminAccount[] {
  return [
    {
      id: 'admin-1',
      username: 'admin',
      password: '123456',
      name: '系统管理员',
      role: 'admin',
      status: 'enabled',
      createdAt: now
    },
    {
      id: 'manager-1',
      username: 'manager',
      password: '123456',
      name: '门店店长',
      role: 'manager',
      status: 'enabled',
      createdAt: now
    },
    {
      id: 'clerk-1',
      username: 'clerk',
      password: '123456',
      name: '前台店员',
      role: 'clerk',
      status: 'enabled',
      createdAt: now
    }
  ]
}

function genUsers(now: string): AppUser[] {
  return [
    {
      id: 'u-1001',
      nickname: '顾客小张',
      phone: '13800001111',
      avatar: 'https://picsum.photos/seed/customer1/96/96',
      status: 'enabled',
      orderCount: 12,
      totalSpent: 468,
      createdAt: now
    },
    {
      id: 'u-1002',
      nickname: '顾客小李',
      phone: '13800002222',
      avatar: 'https://picsum.photos/seed/customer2/96/96',
      status: 'enabled',
      orderCount: 6,
      totalSpent: 189,
      createdAt: now
    },
    {
      id: 'u-1003',
      nickname: '顾客小王',
      phone: '13800003333',
      avatar: 'https://picsum.photos/seed/customer3/96/96',
      status: 'disabled',
      orderCount: 2,
      totalSpent: 76,
      createdAt: now
    }
  ]
}

function genCategories(now: string): Category[] {
  return [
    { id: 'c-1', name: '热菜', sort: 1, status: 'enabled', createdAt: now, updatedAt: now },
    { id: 'c-2', name: '凉菜', sort: 2, status: 'enabled', createdAt: now, updatedAt: now },
    { id: 'c-3', name: '主食', sort: 3, status: 'enabled', createdAt: now, updatedAt: now },
    { id: 'c-4', name: '饮品', sort: 4, status: 'enabled', createdAt: now, updatedAt: now }
  ]
}

function genDishes(now: string): Dish[] {
  return [
    {
      id: 'd-1',
      categoryId: 'c-1',
      name: '宫保鸡丁',
      price: 28,
      stock: 60,
      sales: 128,
      status: 'on',
      image: 'https://picsum.photos/seed/kungpao/320/200',
      description: '经典川味热菜，鸡丁鲜嫩，花生香脆。',
      updatedAt: now
    },
    {
      id: 'd-2',
      categoryId: 'c-1',
      name: '麻婆豆腐',
      price: 22,
      stock: 80,
      sales: 96,
      status: 'on',
      image: 'https://picsum.photos/seed/tofu/320/200',
      description: '豆腐滑嫩入味，麻辣开胃。',
      updatedAt: now
    },
    {
      id: 'd-3',
      categoryId: 'c-2',
      name: '凉拌黄瓜',
      price: 12,
      stock: 100,
      sales: 75,
      status: 'on',
      image: 'https://picsum.photos/seed/cucumber/320/200',
      description: '清爽解腻，蒜香十足。',
      updatedAt: now
    },
    {
      id: 'd-4',
      categoryId: 'c-4',
      name: '酸梅汤',
      price: 8,
      stock: 40,
      sales: 64,
      status: 'off',
      image: 'https://picsum.photos/seed/plum/320/200',
      description: '冰爽解辣，酸甜适口。',
      updatedAt: now
    }
  ]
}

function createOrderItems(): OrderItem[] {
  return [
    {
      dishId: 'd-1',
      nameSnapshot: '宫保鸡丁',
      priceSnapshot: 28,
      quantity: 1,
      servedQuantity: 0
    },
    {
      dishId: 'd-3',
      nameSnapshot: '凉拌黄瓜',
      priceSnapshot: 12,
      quantity: 1,
      servedQuantity: 0
    }
  ]
}

function genOrders(now: string): Order[] {
  const items1 = createOrderItems()
  const order1Total = items1.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0)
  const order1: Order = {
    id: `OD${Date.now()}001`,
    userId: 'u-1001',
    userName: '顾客小张',
    type: 'dine_in',
    tableNo: 'A12',
    remark: '少辣',
    status: 'pending',
    items: items1,
    totalAmount: order1Total,
    createdAt: now,
    updatedAt: now,
    logs: [
      {
        id: randomId('olog'),
        action: 'create',
        operatorId: 'u-1001',
        operatorName: '顾客小张',
        source: 'mini',
        time: now,
        remark: '用户提交订单，等待接单'
      }
    ]
  }

  const items2: OrderItem[] = [
    {
      dishId: 'd-2',
      nameSnapshot: '麻婆豆腐',
      priceSnapshot: 22,
      quantity: 2,
      servedQuantity: 2
    },
    {
      dishId: 'd-4',
      nameSnapshot: '酸梅汤',
      priceSnapshot: 8,
      quantity: 1,
      servedQuantity: 1
    }
  ]
  const order2Total = items2.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0)
  const order2: Order = {
    id: `OD${Date.now()}002`,
    userId: 'u-1002',
    userName: '顾客小李',
    type: 'takeaway',
    contactPhone: '13800002222',
    status: 'completed',
    items: items2,
    totalAmount: order2Total,
    createdAt: now,
    updatedAt: now,
    logs: [
      {
        id: randomId('olog'),
        action: 'create',
        operatorId: 'u-1002',
        operatorName: '顾客小李',
        source: 'mini',
        time: now,
        remark: '用户提交订单'
      },
      {
        id: randomId('olog'),
        action: 'completed',
        operatorId: 'manager-1',
        operatorName: '门店店长',
        source: 'admin',
        time: now,
        remark: '订单完成'
      }
    ]
  }

  return [order1, order2]
}

function genStoreSetting(): StoreSetting {
  return {
    storeName: '学苑餐厅',
    businessHours: '09:00-22:00',
    phone: '020-88886666',
    notice: '午高峰请耐心等候，感谢理解。',
    minDeliveryFee: 20,
    deliveryFee: 4,
    bannerImages: [
      'https://picsum.photos/seed/banner1/960/260',
      'https://picsum.photos/seed/banner2/960/260'
    ]
  }
}

export function createDefaultDatabase(): DatabaseState {
  const now = nowText()
  return {
    admins: genAdmins(now),
    appUsers: genUsers(now),
    categories: genCategories(now),
    dishes: genDishes(now),
    orders: genOrders(now),
    storeSetting: genStoreSetting(),
    operationLogs: []
  }
}
