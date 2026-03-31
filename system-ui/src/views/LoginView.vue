<template>
  <div class="login-page">
    <div class="login-card">
      <h1>点餐系统后台管理</h1>
      <p class="small">Vue3 + TypeScript + Pinia</p>

      <div class="login-form">
        <label>
          <span>账号</span>
          <input v-model.trim="form.username" placeholder="请输入账号" @keyup.enter="submit" />
        </label>
        <label>
          <span>密码</span>
          <input v-model="form.password" type="password" placeholder="请输入密码" @keyup.enter="submit" />
        </label>
        <button :disabled="loading" @click="submit">{{ loading ? '登录中...' : '登录' }}</button>
      </div>

      <p v-if="errorText" class="error-text">{{ errorText }}</p>

      <div class="demo-box">
        <h3>接口说明</h3>
        <p>默认请求：`{{ apiBaseUrl }}`</p>
        <p>可通过 `.env` 配置 `VITE_API_BASE_URL`</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8080/api'

const form = reactive({
  username: 'admin',
  password: '123456'
})

const errorText = ref('')
const loading = ref(false)

async function submit() {
  errorText.value = ''
  if (!form.username || !form.password) {
    errorText.value = '请填写账号和密码'
    return
  }

  loading.value = true
  const result = await authStore.login({ username: form.username, password: form.password })
  loading.value = false

  if (!result.ok) {
    errorText.value = result.message
    return
  }
  router.replace('/workbench')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at top right, #dbeafe 0%, #eff6ff 35%, #f8fafc 70%);
  padding: 16px;
}

.login-card {
  width: min(420px, 100%);
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
  padding: 24px;
}

.login-card h1 {
  margin: 0;
  font-size: 24px;
}

.login-form {
  margin-top: 16px;
  display: grid;
  gap: 12px;
}

label {
  display: grid;
  gap: 6px;
}

label span {
  color: #475569;
  font-size: 14px;
}

input {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px;
}

button {
  border: none;
  background: #2563eb;
  color: #ffffff;
  border-radius: 8px;
  padding: 10px;
  font-size: 15px;
}

button:disabled {
  opacity: 0.7;
}

.error-text {
  margin: 12px 0 0;
  color: #dc2626;
}

.demo-box {
  margin-top: 18px;
  border-top: 1px dashed #cbd5e1;
  padding-top: 12px;
}

.demo-box h3 {
  margin: 0 0 8px;
  font-size: 14px;
}

.demo-box p {
  margin: 4px 0;
  color: #475569;
  font-size: 13px;
}
</style>
