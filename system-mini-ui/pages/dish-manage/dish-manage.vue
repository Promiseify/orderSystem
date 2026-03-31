<template>
	<view class="container">
		<view class="header">
			<button class="add-btn" @tap="showAddForm">新增菜品</button>
		</view>

		<view class="filter-section">
			<scroll-view class="filter-row" scroll-x>
				<view
					v-for="option in categoryOptions"
					:key="option.value"
					:class="['filter-chip', categoryFilter === option.value ? 'active' : '']"
					@tap="setCategoryFilter(option.value)"
				>
					{{ option.label }}
				</view>
			</scroll-view>
			<view class="filter-row status-row">
				<view
					v-for="option in statusOptions"
					:key="option.value"
					:class="['filter-chip', statusFilter === option.value ? 'active' : '']"
					@tap="setStatusFilter(option.value)"
				>
					{{ option.label }}
				</view>
			</view>
		</view>

		<view class="empty-state" v-if="!filteredDishes.length">当前筛选下暂无菜品</view>

		<view class="dish-list">
			<view class="dish-item" v-for="dish in filteredDishes" :key="dish.id">
				<image class="dish-image" :src="dish.image" mode="aspectFill"></image>
				<view class="dish-info">
					<text class="dish-name">{{ dish.name }}</text>
					<text class="dish-price">¥{{ dish.price }}</text>
					<text class="dish-category">{{ getCategoryName(dish.categoryId) }}</text>
					<text :class="['dish-status', getDishStatusClass(dish)]">{{ getDishStatusText(dish) }}</text>
				</view>
				<view class="operations">
					<button class="op-btn edit" @tap="editDish(dish)">编辑</button>
					<button class="op-btn toggle" @tap="toggleDishStatus(dish)">{{ getDishToggleText(dish) }}</button>
				</view>
			</view>
		</view>

		<view class="popup" v-if="showForm">
			<view class="popup-mask" @tap="closeForm"></view>
			<view class="popup-content">
				<view class="form-header">
					<text class="form-title">{{ formType === 'add' ? '新增菜品' : '编辑菜品' }}</text>
					<text class="close-btn" @tap="closeForm">×</text>
				</view>

				<view class="form-body">
					<view class="form-item">
						<text class="label">菜品名称</text>
						<input type="text" v-model="formData.name" placeholder="请输入菜品名称" />
					</view>

					<view class="form-item">
						<text class="label">价格</text>
						<input type="digit" v-model="formData.price" placeholder="请输入价格" />
					</view>

					<view class="form-item">
						<text class="label">分类</text>
						<picker :range="categories" range-key="name" :value="currentCategoryIndex" @change="onCategoryChange">
							<view class="picker">{{ currentCategoryName }}</view>
						</picker>
					</view>

					<view class="form-item">
						<text class="label">图片</text>
						<view class="image-list">
							<view class="image-card main" @tap="chooseImage">
								<image v-if="formData.image" :src="formData.image" mode="aspectFill"></image>
								<text v-else class="upload-text">点击上传主图</text>
							</view>
							<view class="image-tip">当前共 {{ normalizedFormImages.length }} 张图片</view>
						</view>
					</view>

					<view class="form-item">
						<text class="label">描述</text>
						<textarea v-model="formData.description" placeholder="请输入菜品描述"></textarea>
					</view>
				</view>

				<view class="form-footer">
					<button class="submit-btn" @tap="submitForm">确定</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import userStore from '@/store/user.js'
import dishStore, { DISH_STATUS } from '@/store/dish.js'

function goToLogin(redirectUrl = '') {
	const encodedRedirect = redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''
	uni.navigateTo({
		url: `/pages/login/login${encodedRedirect}`
	})
}

function redirectNoPermission() {
	uni.showToast({
		title: '无权限访问',
		icon: 'none'
	})
	setTimeout(() => {
		uni.switchTab({
			url: '/pages/profile/profile'
		})
	}, 600)
}

function normalizeImages(image, images = []) {
	const list = Array.isArray(images) ? images.filter(Boolean) : []
	if (image && !list.includes(image)) {
		list.unshift(image)
	}
	return list.length ? list : image ? [image] : []
}

function createDefaultFormData(categoryId) {
	return {
		id: '',
		name: '',
		price: '',
		categoryId,
		image: '',
		images: [],
		description: '',
		status: DISH_STATUS.ON
	}
}

export default {
	data() {
		return {
			categories: [],
			dishes: [],
			showForm: false,
			formType: 'add',
			formData: createDefaultFormData(1),
			categoryFilter: 'all',
			statusFilter: 'all',
			statusOptions: [
				{ label: '全部状态', value: 'all' },
				{ label: '上架中', value: DISH_STATUS.ON },
				{ label: '已下架', value: DISH_STATUS.OFF }
			]
		}
	},
	computed: {
		currentCategoryIndex() {
			const index = this.categories.findIndex(category => category.id === Number(this.formData.categoryId))
			return index > -1 ? index : 0
		},
		currentCategoryName() {
			return this.categories[this.currentCategoryIndex]?.name || '请选择分类'
		},
		categoryOptions() {
			return [{ label: '全部分类', value: 'all' }, ...this.categories.map(category => ({
				label: category.name,
				value: category.id
			}))]
		},
		normalizedFormImages() {
			return normalizeImages(this.formData.image, this.formData.images)
		},
		filteredDishes() {
			return this.dishes.filter(dish => {
				const matchCategory = this.categoryFilter === 'all' || dish.categoryId === this.categoryFilter
				const matchStatus = this.statusFilter === 'all' || dish.status === this.statusFilter
				return matchCategory && matchStatus
			})
		}
	},
	onShow() {
		if (!userStore.isLoggedIn()) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			})
			setTimeout(() => {
				goToLogin('/pages/dish-manage/dish-manage')
			}, 600)
			return
		}

		if (!userStore.canManageDishes()) {
			redirectNoPermission()
			return
		}

		this.refreshData()
	},
	methods: {
		refreshData() {
			this.categories = dishStore.getCategories()
			this.dishes = dishStore.getDishList(true)
			if (!this.categories.length) {
				return
			}

			if (!this.formData.categoryId) {
				this.formData.categoryId = this.categories[0].id
			}
		},
		setCategoryFilter(value) {
			this.categoryFilter = value
		},
		setStatusFilter(value) {
			this.statusFilter = value
		},
		showAddForm() {
			const defaultCategoryId = this.categories[0]?.id || 1
			this.formType = 'add'
			this.formData = createDefaultFormData(defaultCategoryId)
			this.showForm = true
		},
		editDish(dish) {
			this.formType = 'edit'
			this.formData = {
				...dish,
				price: String(dish.price),
				images: normalizeImages(dish.image, dish.images)
			}
			this.showForm = true
		},
		closeForm() {
			this.showForm = false
		},
		onCategoryChange(e) {
			const category = this.categories[Number(e.detail.value)]
			if (!category) {
				return
			}

			this.formData.categoryId = category.id
		},
		chooseImage() {
			uni.chooseImage({
				count: 1,
				success: res => {
					const image = res.tempFilePaths[0]
					this.formData.image = image
					this.formData.images = normalizeImages(image, this.formData.images)
				}
			})
		},
		submitForm() {
			if (!this.formData.name || !this.formData.price) {
				uni.showToast({
					title: '请填写完整信息',
					icon: 'none'
				})
				return
			}

			const payload = {
				...this.formData,
				price: Number(this.formData.price),
				images: this.normalizedFormImages
			}

			const result = this.formType === 'add'
				? dishStore.addDish(payload)
				: dishStore.updateDish(payload)

			if (!result) {
				uni.showToast({
					title: '保存失败',
					icon: 'none'
				})
				return
			}

			this.refreshData()
			this.closeForm()
			uni.showToast({
				title: '保存成功',
				icon: 'success'
			})
		},
		toggleDishStatus(dish) {
			const actionText = this.getDishToggleText(dish)
			uni.showModal({
				title: '提示',
				content: `确定要${actionText}该菜品吗？`,
				success: res => {
					if (!res.confirm) {
						return
					}

					dishStore.toggleDishStatus(dish.id)
					this.refreshData()
					uni.showToast({
						title: `${actionText}成功`,
						icon: 'success'
					})
				}
			})
		},
		getCategoryName(categoryId) {
			return dishStore.getCategoryById(categoryId)?.name || '未分类'
		},
		isOnShelf(dish) {
			return dishStore.isOnShelf(dish)
		},
		getDishStatusClass(dish) {
			return this.isOnShelf(dish) ? DISH_STATUS.ON : DISH_STATUS.OFF
		},
		getDishStatusText(dish) {
			return this.isOnShelf(dish) ? '上架中' : '已下架'
		},
		getDishToggleText(dish) {
			return this.isOnShelf(dish) ? '下架' : '上架'
		}
	}
}
</script>

<style>
.container {
	padding: 20rpx;
}

.header {
	padding: 20rpx 0;
}

.add-btn {
	width: 200rpx;
	height: 80rpx;
	line-height: 80rpx;
	background-color: #f6c33d;
	color: #fff;
	font-size: 28rpx;
}

.filter-section {
	margin-bottom: 20rpx;
}

.filter-row {
	display: flex;
	gap: 16rpx;
	white-space: nowrap;
}

.status-row {
	margin-top: 16rpx;
	overflow-x: auto;
}

.filter-chip {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 14rpx 24rpx;
	background-color: #fff;
	border-radius: 999rpx;
	font-size: 24rpx;
	color: #666;
	flex-shrink: 0;
}

.filter-chip.active {
	background-color: #f6c33d;
	color: #fff;
}

.empty-state {
	padding: 140rpx 0;
	text-align: center;
	font-size: 28rpx;
	color: #999;
}

.dish-list {
	margin-top: 20rpx;
}

.dish-item {
	display: flex;
	padding: 20rpx;
	background-color: #fff;
	margin-bottom: 20rpx;
	border-radius: 10rpx;
}

.dish-image {
	width: 160rpx;
	height: 160rpx;
	border-radius: 8rpx;
}

.dish-info {
	flex: 1;
	padding: 0 20rpx;
}

.dish-name {
	font-size: 32rpx;
	font-weight: bold;
	display: block;
}

.dish-price {
	font-size: 28rpx;
	color: #ff5500;
	margin-top: 10rpx;
	display: block;
}

.dish-category {
	font-size: 24rpx;
	color: #999;
	margin-top: 10rpx;
	display: block;
}

.dish-status {
	font-size: 24rpx;
	margin-top: 10rpx;
	display: inline-block;
	padding: 6rpx 18rpx;
	border-radius: 999rpx;
}

.dish-status.on {
	color: #19be6b;
	background-color: rgba(25, 190, 107, 0.12);
}

.dish-status.off {
	color: #ff5500;
	background-color: rgba(255, 85, 0, 0.12);
}

.operations {
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.op-btn {
	width: 120rpx;
	height: 60rpx;
	line-height: 60rpx;
	font-size: 24rpx;
	margin: 10rpx 0;
}

.op-btn.edit {
	background-color: #f6c33d;
	color: #fff;
}

.op-btn.toggle {
	background-color: #ff8c42;
	color: #fff;
}

.popup {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
}

.popup-mask {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
}

.popup-content {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #fff;
	border-radius: 20rpx 20rpx 0 0;
	padding: 30rpx;
}

.form-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.form-title {
	font-size: 32rpx;
	font-weight: bold;
}

.close-btn {
	font-size: 40rpx;
	color: #999;
}

.form-item {
	margin-bottom: 30rpx;
}

.label {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 10rpx;
}

input,
.picker {
	width: 100%;
	height: 80rpx;
	border: 1rpx solid #eee;
	border-radius: 8rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	box-sizing: border-box;
	display: flex;
	align-items: center;
}

textarea {
	width: 100%;
	height: 200rpx;
	border: 1rpx solid #eee;
	border-radius: 8rpx;
	padding: 20rpx;
	font-size: 28rpx;
	box-sizing: border-box;
}

.image-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.image-card {
	width: 200rpx;
	height: 200rpx;
	border: 1rpx dashed #ddd;
	border-radius: 8rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	overflow: hidden;
}

.image-card image {
	width: 100%;
	height: 100%;
}

.image-tip {
	font-size: 24rpx;
	color: #999;
}

.upload-text {
	font-size: 24rpx;
	color: #999;
}

.submit-btn {
	width: 100%;
	height: 80rpx;
	line-height: 80rpx;
	background-color: #f6c33d;
	color: #fff;
	font-size: 28rpx;
	margin-top: 30rpx;
}
</style>
