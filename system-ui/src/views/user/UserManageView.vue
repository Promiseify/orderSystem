<template>
  <section class="page-card">
    <h3 class="section-title">用户管理</h3>

    <article class="page-card">
      <h4 class="section-title">小程序用户</h4>
      <table class="simple-table">
        <thead>
          <tr>
            <th>头像</th>
            <th>昵称</th>
            <th>手机号</th>
            <th>订单数</th>
            <th>消费总额</th>
            <th>状态</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in userStore.appUsers" :key="user.id">
            <td><img :src="user.avatar" alt="avatar" width="36" height="36" style="border-radius: 999px" /></td>
            <td>{{ user.nickname }}</td>
            <td>{{ user.phone }}</td>
            <td>{{ user.orderCount }}</td>
            <td>￥{{ user.totalSpent.toFixed(2) }}</td>
            <td>
              <span class="status-tag" :style="{ backgroundColor: user.status === 'enabled' ? '#16a34a' : '#6b7280' }">
                {{ user.status === 'enabled' ? '正常' : '停用' }}
              </span>
            </td>
            <td>{{ user.createdAt }}</td>
            <td>
              <button class="action-btn" :disabled="!canUserManage" @click="toggleAppUser(user.id)">
                {{ user.status === 'enabled' ? '停用' : '启用' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </article>

    <article class="page-card" style="margin-top: 12px">
      <div style="display: flex; justify-content: space-between; align-items: center">
        <h4 class="section-title" style="margin: 0">后台管理员</h4>
        <button v-if="canAdminManage" @click="openCreate">新增管理员</button>
      </div>
      <table class="simple-table" style="margin-top: 12px">
        <thead>
          <tr>
            <th>账号</th>
            <th>姓名</th>
            <th>角色</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>最近登录</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="admin in userStore.adminUsers" :key="admin.id">
            <td>{{ admin.username }}</td>
            <td>{{ admin.name }}</td>
            <td>{{ userStore.roleLabel(admin.role) }}</td>
            <td>
              <span class="status-tag" :style="{ backgroundColor: admin.status === 'enabled' ? '#16a34a' : '#6b7280' }">
                {{ admin.status === 'enabled' ? '启用' : '停用' }}
              </span>
            </td>
            <td>{{ admin.createdAt }}</td>
            <td>{{ admin.lastLoginAt || '-' }}</td>
            <td>
              <button class="action-btn secondary" :disabled="!canAdminManage" @click="openEdit(admin.id)">编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </article>

    <div v-if="showModal" class="modal-mask">
      <div class="modal-card">
        <h3 class="section-title">{{ editingId ? '编辑管理员' : '新增管理员' }}</h3>
        <div class="form-grid">
          <label>
            登录账号
            <input v-model.trim="form.username" :disabled="Boolean(editingId)" placeholder="请输入登录账号" />
          </label>
          <label>
            姓名
            <input v-model.trim="form.name" placeholder="请输入姓名" />
          </label>
          <label>
            角色
            <select v-model="form.role">
              <option value="admin">超级管理员</option>
              <option value="manager">店长</option>
              <option value="clerk">店员</option>
            </select>
          </label>
          <label>
            状态
            <select v-model="form.status">
              <option value="enabled">启用</option>
              <option value="disabled">停用</option>
            </select>
          </label>
          <label class="full">
            {{ editingId ? '重置密码（留空表示不修改）' : '登录密码' }}
            <input v-model="form.password" type="password" placeholder="请输入密码" />
          </label>
        </div>
        <div class="form-actions">
          <button @click="submit">保存</button>
          <button class="secondary" @click="showModal = false">取消</button>
        </div>
        <p v-if="errorText" class="error-text">{{ errorText }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'

const authStore = useAuthStore()
const userStore = useUserStore()

const canUserManage = computed(() => authStore.can('user:manage'))
const canAdminManage = computed(() => authStore.can('admin:manage'))

const showModal = ref(false)
const editingId = ref('')
const errorText = ref('')

const form = reactive({
  username: '',
  name: '',
  role: 'manager' as 'admin' | 'manager' | 'clerk',
  status: 'enabled' as 'enabled' | 'disabled',
  password: ''
})

onMounted(async () => {
  try {
    await userStore.fetchAll()
  } catch {
    window.alert('加载用户数据失败，请检查后端接口')
  }
})

async function toggleAppUser(userId: string) {
  if (!canUserManage.value) return
  const result = await userStore.toggleAppUserStatus(userId)
  if (!result.ok) {
    window.alert(result.message)
  }
}

function openCreate() {
  errorText.value = ''
  editingId.value = ''
  form.username = ''
  form.name = ''
  form.role = 'manager'
  form.status = 'enabled'
  form.password = ''
  showModal.value = true
}

function openEdit(adminId: string) {
  if (!canAdminManage.value) return
  const target = userStore.adminUsers.find((item) => item.id === adminId)
  if (!target) return

  errorText.value = ''
  editingId.value = target.id
  form.username = target.username
  form.name = target.name
  form.role = target.role
  form.status = target.status
  form.password = ''
  showModal.value = true
}

async function submit() {
  errorText.value = ''
  if (!form.username || !form.name) {
    errorText.value = '请填写账号和姓名'
    return
  }

  if (editingId.value) {
    const target = userStore.adminUsers.find((item) => item.id === editingId.value)
    if (!target) {
      errorText.value = '管理员不存在'
      return
    }
    const result = await userStore.updateAdmin({
      ...target,
      name: form.name,
      role: form.role,
      status: form.status,
      password: form.password || target.password
    })
    if (!result.ok) {
      errorText.value = result.message
      return
    }
  } else {
    if (!form.password) {
      errorText.value = '请填写密码'
      return
    }
    const result = await userStore.createAdmin({
      username: form.username,
      name: form.name,
      role: form.role,
      status: form.status,
      password: form.password
    })
    if (!result.ok) {
      errorText.value = result.message
      return
    }
  }

  showModal.value = false
}
</script>

<style scoped>
.error-text {
  color: #dc2626;
}
</style>
