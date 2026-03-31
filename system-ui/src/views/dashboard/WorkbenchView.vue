<template>
  <section class="page-card">
    <h3 class="section-title">首页工作台</h3>

    <div class="kpi-grid">
      <article class="kpi-card">
        <h3>今日订单数</h3>
        <p>{{ dashboardStore.todayOrderCount }}</p>
      </article>
      <article class="kpi-card">
        <h3>今日营业额</h3>
        <p>{{ toMoney(dashboardStore.todayRevenue) }}</p>
      </article>
      <article class="kpi-card">
        <h3>待处理订单</h3>
        <p>{{ dashboardStore.pendingCount }}</p>
      </article>
      <article class="kpi-card">
        <h3>菜品总数</h3>
        <p>{{ dashboardStore.dishCount }}</p>
      </article>
    </div>

    <div class="panel-grid">
      <article class="page-card">
        <h4 class="section-title">近 7 日营业趋势</h4>
        <div class="trend-bars">
          <div v-for="item in dashboardStore.trend7d" :key="item.date" class="bar-row">
            <span>{{ item.date.slice(5) }}</span>
            <div class="bar"><span :style="{ width: `${barPercent(item.amount)}%` }" /></div>
            <strong>{{ toMoney(item.amount) }}</strong>
          </div>
        </div>
      </article>

      <article class="page-card">
        <h4 class="section-title">热销菜品排行</h4>
        <table class="simple-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>菜品</th>
              <th>销量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(dish, index) in dashboardStore.hotDishRanking" :key="dish.dishId">
              <td>#{{ index + 1 }}</td>
              <td>{{ dish.dishName }}</td>
              <td>{{ dish.sales }}</td>
            </tr>
          </tbody>
        </table>
      </article>
    </div>

    <article class="page-card" style="margin-top: 12px">
      <h4 class="section-title">最近订单</h4>
      <table class="simple-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>用户</th>
            <th>时间</th>
            <th>金额</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in dashboardStore.recentOrders" :key="order.id">
            <td>{{ order.id }}</td>
            <td>{{ order.userName }}</td>
            <td>{{ order.createdAt }}</td>
            <td>{{ toMoney(order.totalAmount) }}</td>
            <td>
              <span class="status-tag" :style="{ backgroundColor: ORDER_STATUS_COLORS[order.status] }">
                {{ getOrderStatusLabel(order.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ORDER_STATUS_COLORS } from '@/constants'
import { useDashboardStore } from '@/stores/dashboard'
import { getOrderStatusLabel } from '@/utils/status'
import { toMoney } from '@/utils/time'

const dashboardStore = useDashboardStore()

onMounted(async () => {
  try {
    await dashboardStore.fetchData()
  } catch {
    window.alert('加载看板数据失败，请检查后端接口')
  }
})

const maxAmount = computed(() => {
  const maxValue = Math.max(...dashboardStore.trend7d.map((item) => item.amount), 1)
  return maxValue
})

function barPercent(amount: number): number {
  return Math.max(5, Math.round((amount / maxAmount.value) * 100))
}
</script>
