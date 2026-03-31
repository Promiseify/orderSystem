import { STATUS_LABEL_MAP } from '@/constants'
import type { OrderStatus } from '@/types/models'

export function getOrderStatusLabel(status: OrderStatus): string {
  return STATUS_LABEL_MAP[status] ?? '未知状态'
}
