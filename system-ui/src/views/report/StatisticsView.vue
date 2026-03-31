<template>
  <section class="page-card">
    <h3 class="section-title">数据统计</h3>

    <div class="toolbar">
      <input v-model="startDate" type="date" />
      <input v-model="endDate" type="date" />
      <button @click="setRecent7Days">近7天</button>
      <button @click="setRecent30Days">近30天</button>
      <button class="secondary action-btn" @click="reload">同步后端数据</button>
      <button class="secondary action-btn" @click="exportCsv">导出报表 CSV</button>
    </div>

    <div class="kpi-grid">
      <article class="kpi-card">
        <h3>订单总数</h3>
        <p>{{ totalOrders }}</p>
      </article>
      <article class="kpi-card">
        <h3>营业额</h3>
        <p>￥{{ totalAmount.toFixed(2) }}</p>
      </article>
      <article class="kpi-card">
        <h3>客单价</h3>
        <p>￥{{ avgAmount.toFixed(2) }}</p>
      </article>
      <article class="kpi-card">
        <h3>完结率</h3>
        <p>{{ completionRate }}%</p>
      </article>
    </div>

    <div class="panel-grid">
      <article class="page-card">
        <h4 class="section-title">订单趋势</h4>
        <div class="trend-bars">
          <div v-for="row in trendRows" :key="row.date" class="bar-row">
            <span>{{ row.date.slice(5) }}</span>
            <div class="bar"><span :style="{ width: `${trendBarPercent(row.amount)}%` }" /></div>
            <strong>￥{{ row.amount.toFixed(2) }}</strong>
          </div>
        </div>
      </article>

      <article class="page-card">
        <h4 class="section-title">菜品销量排行</h4>
        <table class="simple-table">
          <thead>
            <tr>
              <th>菜品</th>
              <th>销量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in dishRanking" :key="item.dishId">
              <td>{{ item.dishName }}</td>
              <td>{{ item.qty }}</td>
            </tr>
          </tbody>
        </table>
      </article>
    </div>

    <article class="page-card" style="margin-top: 12px">
      <h4 class="section-title">分类销量统计</h4>
      <table class="simple-table">
        <thead>
          <tr>
            <th>分类</th>
            <th>销量</th>
            <th>销售额</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in categoryStats" :key="row.categoryId">
            <td>{{ row.categoryName }}</td>
            <td>{{ row.qty }}</td>
            <td>￥{{ row.amount.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCategoryStore } from '@/stores/category'
import { useDishStore } from '@/stores/dish'
import { useOrderStore } from '@/stores/order'

type TrendRow = { date: string; amount: number }

const orderStore = useOrderStore()
const dishStore = useDishStore()
const categoryStore = useCategoryStore()

const startDate = ref('')
const endDate = ref('')

setRecent7Days()

onMounted(async () => {
  await reload()
})

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function setRecent7Days() {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 6)
  startDate.value = formatDate(start)
  endDate.value = formatDate(end)
}

function setRecent30Days() {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 29)
  startDate.value = formatDate(start)
  endDate.value = formatDate(end)
}

async function reload() {
  try {
    await Promise.all([orderStore.fetchList(), dishStore.fetchList(), categoryStore.fetchList()])
  } catch {
    window.alert('加载统计数据失败，请检查后端接口')
  }
}

function inRange(dateText: string): boolean {
  const date = dateText.slice(0, 10)
  if (startDate.value && date < startDate.value) return false
  if (endDate.value && date > endDate.value) return false
  return true
}

const rangedOrders = computed(() => orderStore.list.filter((order) => inRange(order.createdAt)))

const totalOrders = computed(() => rangedOrders.value.length)
const totalAmount = computed(() => rangedOrders.value.reduce((sum, order) => sum + order.totalAmount, 0))
const avgAmount = computed(() => (totalOrders.value > 0 ? totalAmount.value / totalOrders.value : 0))
const completionRate = computed(() => {
  if (!totalOrders.value) return 0
  const completed = rangedOrders.value.filter((order) => ['served', 'completed'].includes(order.status)).length
  return Number(((completed / totalOrders.value) * 100).toFixed(1))
})

const trendRows = computed<TrendRow[]>(() => {
  const map = new Map<string, number>()
  rangedOrders.value.forEach((order) => {
    const date = order.createdAt.slice(0, 10)
    map.set(date, (map.get(date) ?? 0) + order.totalAmount)
  })
  return Array.from(map.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
})

const maxTrendAmount = computed(() => Math.max(...trendRows.value.map((row) => row.amount), 1))
function trendBarPercent(amount: number): number {
  return Math.max(5, Math.round((amount / maxTrendAmount.value) * 100))
}

const dishRanking = computed(() => {
  const map = new Map<string, { dishId: string; dishName: string; qty: number }>()
  rangedOrders.value.forEach((order) => {
    order.items.forEach((item) => {
      const prev = map.get(item.dishId)
      map.set(item.dishId, {
        dishId: item.dishId,
        dishName: item.nameSnapshot,
        qty: (prev?.qty ?? 0) + item.quantity
      })
    })
  })
  return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 8)
})

const categoryStats = computed(() => {
  const dishCategoryMap = new Map(dishStore.list.map((dish) => [dish.id, dish.categoryId]))
  const categoryNameMap = new Map(categoryStore.list.map((category) => [category.id, category.name]))
  const statsMap = new Map<string, { categoryId: string; categoryName: string; qty: number; amount: number }>()

  rangedOrders.value.forEach((order) => {
    order.items.forEach((item) => {
      const categoryId = dishCategoryMap.get(item.dishId) ?? 'unknown'
      const categoryName = categoryNameMap.get(categoryId) ?? '未分类'
      const current = statsMap.get(categoryId)
      statsMap.set(categoryId, {
        categoryId,
        categoryName,
        qty: (current?.qty ?? 0) + item.quantity,
        amount: (current?.amount ?? 0) + item.quantity * item.priceSnapshot
      })
    })
  })

  return Array.from(statsMap.values()).sort((a, b) => b.amount - a.amount)
})

function exportCsv() {
  const rows = [['date', 'orderId', 'userName', 'status', 'amount']]
  rangedOrders.value.forEach((order) => {
    rows.push([order.createdAt.slice(0, 10), order.id, order.userName, order.status, String(order.totalAmount)])
  })
  const csv = rows.map((row) => row.map((item) => `"${item.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `report-${startDate.value || 'start'}-${endDate.value || 'end'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
