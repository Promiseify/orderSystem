<template>
  <section class="page-card">
    <h3 class="section-title">门店与基础配置</h3>

    <div class="form-grid">
      <label>
        门店名称
        <input v-model.trim="form.storeName" placeholder="请输入门店名称" />
      </label>
      <label>
        营业时间
        <input v-model.trim="form.businessHours" placeholder="如：09:00-22:00" />
      </label>
      <label>
        联系电话
        <input v-model.trim="form.phone" placeholder="请输入联系电话" />
      </label>
      <label>
        起送价
        <input v-model.number="form.minDeliveryFee" min="0" type="number" />
      </label>
      <label>
        配送费
        <input v-model.number="form.deliveryFee" min="0" type="number" />
      </label>
      <label class="full">
        门店公告
        <textarea v-model.trim="form.notice" rows="3" placeholder="请输入门店公告" />
      </label>
      <label class="full">
        首页轮播图（每行一个 URL）
        <textarea v-model="bannerText" rows="4" placeholder="https://..." />
      </label>
    </div>

    <div class="form-actions">
      <button :disabled="!canWrite" @click="submit">保存配置</button>
    </div>

    <article class="page-card" style="margin-top: 14px">
      <h4 class="section-title">最近操作日志</h4>
      <table class="simple-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>模块</th>
            <th>操作</th>
            <th>操作人</th>
            <th>详情</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in latestLogs" :key="log.id">
            <td>{{ log.time }}</td>
            <td>{{ log.module }}</td>
            <td>{{ log.action }}</td>
            <td>{{ log.operatorName }}</td>
            <td>{{ log.detail }}</td>
          </tr>
        </tbody>
      </table>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSettingStore } from '@/stores/setting'

const authStore = useAuthStore()
const settingStore = useSettingStore()

const canWrite = computed(() => authStore.can('setting:write'))
const current = computed(() => settingStore.currentSetting)

const form = reactive({
  storeName: '',
  businessHours: '',
  phone: '',
  notice: '',
  minDeliveryFee: 0,
  deliveryFee: 0
})
const bannerText = ref('')

onMounted(async () => {
  try {
    await settingStore.fetchAll()
  } catch {
    window.alert('加载门店配置失败，请检查后端接口')
  }
})

watch(
  current,
  (value) => {
    form.storeName = value.storeName
    form.businessHours = value.businessHours
    form.phone = value.phone
    form.notice = value.notice
    form.minDeliveryFee = value.minDeliveryFee
    form.deliveryFee = value.deliveryFee
    bannerText.value = value.bannerImages.join('\n')
  },
  { immediate: true }
)

const latestLogs = computed(() => settingStore.latestLogs)

async function submit() {
  if (!canWrite.value) return
  const bannerImages = bannerText.value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

  const result = await settingStore.update({
    ...form,
    bannerImages
  })
  if (!result.ok) {
    window.alert(result.message)
    return
  }
  window.alert('保存成功')
}
</script>
