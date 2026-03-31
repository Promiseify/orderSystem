<template>
  <section class="page-card">
    <h3 class="section-title">菜品分类管理</h3>

    <div class="toolbar">
      <input v-model.trim="keyword" placeholder="按分类名称筛选" />
      <select v-model="statusFilter">
        <option value="all">全部状态</option>
        <option value="enabled">启用</option>
        <option value="disabled">停用</option>
      </select>
      <button v-if="canWrite" @click="openCreate">新增分类</button>
    </div>

    <table class="simple-table">
      <thead>
        <tr>
          <th>分类名称</th>
          <th>排序</th>
          <th>状态</th>
          <th>更新时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in filteredList" :key="item.id">
          <td>{{ item.name }}</td>
          <td>{{ item.sort }}</td>
          <td>
            <span class="status-tag" :style="{ backgroundColor: item.status === 'enabled' ? '#16a34a' : '#6b7280' }">
              {{ item.status === 'enabled' ? '启用' : '停用' }}
            </span>
          </td>
          <td>{{ item.updatedAt }}</td>
          <td>
            <button class="action-btn secondary" :disabled="!canWrite" @click="openEdit(item)">编辑</button>
            <button class="action-btn" :disabled="!canWrite" @click="toggleStatus(item.id)">
              {{ item.status === 'enabled' ? '停用' : '启用' }}
            </button>
            <button class="action-btn danger" :disabled="!canWrite" @click="remove(item.id)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showModal" class="modal-mask">
      <div class="modal-card">
        <h3 class="section-title">{{ editingId ? '编辑分类' : '新增分类' }}</h3>
        <div class="form-grid">
          <label>
            分类名称
            <input v-model.trim="form.name" placeholder="如：招牌菜" />
          </label>
          <label>
            排序
            <input v-model.number="form.sort" type="number" min="1" />
          </label>
          <label>
            状态
            <select v-model="form.status">
              <option value="enabled">启用</option>
              <option value="disabled">停用</option>
            </select>
          </label>
        </div>
        <div class="form-actions">
          <button @click="submit">保存</button>
          <button class="secondary" @click="closeModal">取消</button>
        </div>
        <p v-if="errorText" class="error-text">{{ errorText }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCategoryStore } from '@/stores/category'
import type { Category } from '@/types/models'

const authStore = useAuthStore()
const categoryStore = useCategoryStore()

const keyword = ref('')
const statusFilter = ref<'all' | 'enabled' | 'disabled'>('all')
const showModal = ref(false)
const editingId = ref('')
const errorText = ref('')

const form = reactive({
  name: '',
  sort: 1,
  status: 'enabled' as 'enabled' | 'disabled'
})

const canWrite = computed(() => authStore.can('category:write'))

onMounted(async () => {
  try {
    await categoryStore.fetchList()
  } catch {
    window.alert('加载分类失败，请检查后端接口')
  }
})

const filteredList = computed(() => {
  return categoryStore.list
    .filter((item) => (statusFilter.value === 'all' ? true : item.status === statusFilter.value))
    .filter((item) => item.name.toLowerCase().includes(keyword.value.toLowerCase()))
})

function openCreate() {
  errorText.value = ''
  editingId.value = ''
  form.name = ''
  form.sort = categoryStore.list.length + 1
  form.status = 'enabled'
  showModal.value = true
}

function openEdit(item: Category) {
  if (!canWrite.value) return
  errorText.value = ''
  editingId.value = item.id
  form.name = item.name
  form.sort = item.sort
  form.status = item.status
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function submit() {
  errorText.value = ''
  if (!form.name) {
    errorText.value = '请填写分类名称'
    return
  }
  if (editingId.value) {
    const target = categoryStore.list.find((item) => item.id === editingId.value)
    if (!target) {
      errorText.value = '分类不存在'
      return
    }
    const result = await categoryStore.update({ ...target, name: form.name, sort: form.sort, status: form.status })
    if (!result.ok) {
      errorText.value = result.message
      return
    }
  } else {
    const result = await categoryStore.create({ name: form.name, sort: form.sort, status: form.status })
    if (!result.ok) {
      errorText.value = result.message
      return
    }
  }
  showModal.value = false
}

async function toggleStatus(id: string) {
  if (!canWrite.value) return
  const result = await categoryStore.toggleStatus(id)
  if (!result.ok) {
    window.alert(result.message)
  }
}

async function remove(id: string) {
  if (!canWrite.value) return
  if (!window.confirm('确认删除该分类吗？')) {
    return
  }
  const result = await categoryStore.remove(id)
  if (!result.ok) {
    window.alert(result.message)
  }
}
</script>

<style scoped>
.error-text {
  color: #dc2626;
}
</style>
