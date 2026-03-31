<template>
  <section class="page-card">
    <h3 class="section-title">订单管理</h3>

    <div class="toolbar">
      <input v-model.trim="keyword" placeholder="订单号/用户名" />
      <select v-model="statusFilter">
        <option value="all">全部状态</option>
        <option v-for="status in statusList" :key="status" :value="status">{{ getOrderStatusLabel(status) }}</option>
      </select>
      <input v-model="dateFilter" type="date" />
      <button class="secondary action-btn" @click="clearFilter">清空筛选</button>
      <button class="secondary action-btn" @click="reload">查询后端</button>
    </div>

    <table class="simple-table">
      <thead>
        <tr>
          <th>订单号</th>
          <th>用户</th>
          <th>类型</th>
          <th>金额</th>
          <th>状态</th>
          <th>下单时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in filteredList" :key="order.id">
          <td>{{ order.id }}</td>
          <td>{{ order.userName }}</td>
          <td>{{ order.type === 'dine_in' ? `堂食 ${order.tableNo ?? ''}` : `外带 ${order.contactPhone ?? ''}` }}</td>
          <td>￥{{ order.totalAmount.toFixed(2) }}</td>
          <td>
            <span class="status-tag" :style="{ backgroundColor: ORDER_STATUS_COLORS[order.status] }">
              {{ getOrderStatusLabel(order.status) }}
            </span>
          </td>
          <td>{{ order.createdAt }}</td>
          <td>
            <button class="action-btn secondary" @click="viewDetail(order.id)">详情</button>
            <button
              v-for="next in orderStore.getAllowedNext(order.status)"
              :key="`${order.id}-${next}`"
              class="action-btn"
              :disabled="!canOperate"
              @click="transition(order.id, next)"
            >
              {{ getOrderStatusLabel(next) }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showDetail && detailOrder" class="modal-mask">
      <div class="modal-card">
        <h3 class="section-title">订单详情 - {{ detailOrder.id }}</h3>
        <div class="split">
          <article class="page-card">
            <h4 class="section-title">基础信息</h4>
            <p>用户：{{ detailOrder.userName }}</p>
            <p>订单状态：{{ getOrderStatusLabel(detailOrder.status) }}</p>
            <p>就餐方式：{{ detailOrder.type === 'dine_in' ? '堂食' : '外带' }}</p>
            <p v-if="detailOrder.tableNo">桌号：{{ detailOrder.tableNo }}</p>
            <p v-if="detailOrder.contactPhone">联系电话：{{ detailOrder.contactPhone }}</p>
            <p>下单时间：{{ detailOrder.createdAt }}</p>
            <p>备注：{{ detailOrder.remark || '无' }}</p>
          </article>
          <article class="page-card">
            <h4 class="section-title">订单明细</h4>
            <table class="simple-table">
              <thead>
                <tr>
                  <th>菜品</th>
                  <th>单价</th>
                  <th>数量</th>
                  <th>已上菜</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in detailOrder.items" :key="item.dishId">
                  <td>{{ item.nameSnapshot }}</td>
                  <td>￥{{ item.priceSnapshot.toFixed(2) }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.servedQuantity }}</td>
                </tr>
              </tbody>
            </table>
            <p style="text-align: right; margin-top: 8px">总金额：￥{{ detailOrder.totalAmount.toFixed(2) }}</p>
          </article>
        </div>

        <article class="page-card" style="margin-top: 12px">
          <h4 class="section-title">状态流转日志</h4>
          <table class="simple-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>操作人</th>
                <th>来源</th>
                <th>内容</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in detailOrder.logs" :key="log.id">
                <td>{{ log.time }}</td>
                <td>{{ log.operatorName }}</td>
                <td>{{ log.source === 'admin' ? '后台' : '小程序' }}</td>
                <td>{{ log.remark }}</td>
              </tr>
            </tbody>
          </table>
        </article>

        <div class="form-actions">
          <button class="secondary" @click="showDetail = false">关闭</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ORDER_STATUS_COLORS } from '@/constants'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'
import { getOrderStatusLabel } from '@/utils/status'
import type { OrderStatus } from '@/types/models'

const authStore = useAuthStore()
const orderStore = useOrderStore()

const keyword = ref('')
const statusFilter = ref<'all' | OrderStatus>('all')
const dateFilter = ref('')
const showDetail = ref(false)
const detailOrderId = ref('')

const canOperate = computed(() => authStore.can('order:operate'))

const statusList: OrderStatus[] = ['pending', 'accepted', 'cooking', 'ready', 'served', 'completed', 'cancelled', 'rejected']

onMounted(async () => {
  await reload()
})

const filteredList = computed(() => {
  return orderStore.list
    .filter((order) => (statusFilter.value === 'all' ? true : order.status === statusFilter.value))
    .filter((order) => (dateFilter.value ? order.createdAt.slice(0, 10) === dateFilter.value : true))
    .filter((order) => {
      const key = keyword.value.toLowerCase()
      return !key || order.id.toLowerCase().includes(key) || order.userName.toLowerCase().includes(key)
    })
})

const detailOrder = computed(() => orderStore.list.find((item) => item.id === detailOrderId.value))

function clearFilter() {
  keyword.value = ''
  statusFilter.value = 'all'
  dateFilter.value = ''
}

async function reload() {
  try {
    await orderStore.fetchList({
      keyword: keyword.value,
      status: statusFilter.value === 'all' ? '' : statusFilter.value,
      date: dateFilter.value
    })
  } catch {
    window.alert('加载订单失败，请检查后端接口')
  }
}

async function transition(orderId: string, nextStatus: OrderStatus) {
  if (!canOperate.value) return
  const remark = window.prompt('请输入操作备注（可选）', '') ?? ''
  const result = await orderStore.updateStatus(orderId, nextStatus, remark)
  if (!result.ok) {
    window.alert(result.message)
  }
}

function viewDetail(orderId: string) {
  detailOrderId.value = orderId
  showDetail.value = true
}
</script>
