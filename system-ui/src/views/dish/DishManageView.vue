<template>
  <section class="page-card">
    <h3 class="section-title">菜品管理</h3>

    <div class="toolbar">
      <input v-model.trim="keyword" placeholder="按菜品名称筛选" />
      <select v-model="categoryFilter">
        <option value="all">全部分类</option>
        <option v-for="category in categoryStore.list" :key="category.id" :value="category.id">{{ category.name }}</option>
      </select>
      <select v-model="statusFilter">
        <option value="all">全部状态</option>
        <option value="on">上架</option>
        <option value="off">下架</option>
      </select>
      <button v-if="canWrite" @click="openCreate">新增菜品</button>
    </div>

    <table class="simple-table">
      <thead>
        <tr>
          <th>图片</th>
          <th>名称</th>
          <th>分类</th>
          <th>价格</th>
          <th>库存</th>
          <th>销量</th>
          <th>状态</th>
          <th>更新时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="dish in filteredList" :key="dish.id">
          <td><img :src="dish.image" alt="dish" width="70" height="44" style="object-fit: cover; border-radius: 6px" /></td>
          <td>
            <p style="margin: 0 0 4px">{{ dish.name }}</p>
            <p class="small" style="margin: 0">{{ dish.description }}</p>
          </td>
          <td>{{ categoryName(dish.categoryId) }}</td>
          <td>￥{{ dish.price.toFixed(2) }}</td>
          <td>{{ dish.stock }}</td>
          <td>{{ dish.sales }}</td>
          <td>
            <span class="status-tag" :style="{ backgroundColor: dish.status === 'on' ? '#16a34a' : '#6b7280' }">
              {{ dish.status === 'on' ? '上架' : '下架' }}
            </span>
          </td>
          <td>{{ dish.updatedAt }}</td>
          <td>
            <button class="action-btn secondary" :disabled="!canWrite" @click="openEdit(dish)">编辑</button>
            <button class="action-btn" :disabled="!canWrite" @click="toggleStatus(dish.id)">
              {{ dish.status === 'on' ? '下架' : '上架' }}
            </button>
            <button class="action-btn danger" :disabled="!canDelete" @click="remove(dish.id)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showModal" class="modal-mask">
      <div class="modal-card">
        <h3 class="section-title">{{ editingId ? '编辑菜品' : '新增菜品' }}</h3>
        <div class="form-grid">
          <label>
            菜品名称
            <input v-model.trim="form.name" placeholder="请输入菜品名称" />
          </label>
          <label>
            分类
            <select v-model="form.categoryId">
              <option v-for="category in categoryStore.list" :key="category.id" :value="category.id">{{ category.name }}</option>
            </select>
          </label>
          <label>
            价格
            <input v-model.number="form.price" min="0" step="0.01" type="number" />
          </label>
          <label>
            库存
            <input v-model.number="form.stock" min="0" type="number" />
          </label>
          <label>
            状态
            <select v-model="form.status">
              <option value="on">上架</option>
              <option value="off">下架</option>
            </select>
          </label>
          <label>
            图片地址
            <input v-model.trim="form.image" placeholder="请输入图片 URL" />
          </label>
          <label class="full">
            菜品描述
            <textarea v-model.trim="form.description" rows="3" placeholder="请输入菜品描述" />
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
import { useDishStore } from '@/stores/dish'
import type { Dish } from '@/types/models'

const authStore = useAuthStore()
const categoryStore = useCategoryStore()
const dishStore = useDishStore()

const keyword = ref('')
const categoryFilter = ref('all')
const statusFilter = ref<'all' | 'on' | 'off'>('all')
const showModal = ref(false)
const editingId = ref('')
const errorText = ref('')

const form = reactive({
  categoryId: '',
  name: '',
  price: 0,
  stock: 0,
  status: 'on' as 'on' | 'off',
  image: '',
  description: ''
})

const canWrite = computed(() => authStore.can('dish:write'))
const canDelete = computed(() => authStore.can('dish:delete'))

onMounted(async () => {
  try {
    await Promise.all([categoryStore.fetchList(), dishStore.fetchList()])
  } catch {
    window.alert('加载菜品数据失败，请检查后端接口')
  }
})

const filteredList = computed(() => {
  return dishStore.list
    .filter((dish) => (categoryFilter.value === 'all' ? true : dish.categoryId === categoryFilter.value))
    .filter((dish) => (statusFilter.value === 'all' ? true : dish.status === statusFilter.value))
    .filter((dish) => dish.name.toLowerCase().includes(keyword.value.toLowerCase()))
})

function categoryName(categoryId: string): string {
  return categoryStore.list.find((item) => item.id === categoryId)?.name ?? '未知分类'
}

function openCreate() {
  errorText.value = ''
  editingId.value = ''
  form.categoryId = categoryStore.list[0]?.id ?? ''
  form.name = ''
  form.price = 0
  form.stock = 0
  form.status = 'on'
  form.image = 'https://picsum.photos/seed/newdish/320/200'
  form.description = ''
  showModal.value = true
}

function openEdit(dish: Dish) {
  if (!canWrite.value) return
  errorText.value = ''
  editingId.value = dish.id
  form.categoryId = dish.categoryId
  form.name = dish.name
  form.price = dish.price
  form.stock = dish.stock
  form.status = dish.status
  form.image = dish.image
  form.description = dish.description
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function submit() {
  errorText.value = ''
  if (!form.name || !form.categoryId) {
    errorText.value = '请填写必填项'
    return
  }

  if (editingId.value) {
    const target = dishStore.list.find((item) => item.id === editingId.value)
    if (!target) {
      errorText.value = '菜品不存在'
      return
    }
    const result = await dishStore.update({
      ...target,
      categoryId: form.categoryId,
      name: form.name,
      price: form.price,
      stock: form.stock,
      status: form.status,
      image: form.image,
      description: form.description
    })
    if (!result.ok) {
      errorText.value = result.message
      return
    }
  } else {
    const result = await dishStore.create({
      categoryId: form.categoryId,
      name: form.name,
      price: form.price,
      stock: form.stock,
      status: form.status,
      image: form.image,
      description: form.description
    })
    if (!result.ok) {
      errorText.value = result.message
      return
    }
  }
  showModal.value = false
}

async function toggleStatus(id: string) {
  if (!canWrite.value) return
  const result = await dishStore.toggleStatus(id)
  if (!result.ok) {
    window.alert(result.message)
  }
}

async function remove(id: string) {
  if (!canDelete.value) return
  if (!window.confirm('确认删除该菜品吗？')) {
    return
  }
  const result = await dishStore.remove(id)
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
