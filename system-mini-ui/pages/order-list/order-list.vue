<template>
	<view class="container">
		<view class="filter-bar">
			<view
				v-for="status in statusOptions"
				:key="status.value"
				:class="['filter-chip', activeStatus === status.value ? 'active' : '']"
				@tap="setStatusFilter(status.value)"
			>
				{{ status.label }}
			</view>
		</view>

		<view class="empty-state" v-if="!filteredOrders.length">当前筛选下暂无订单</view>

		<view class="order-item" v-for="order in filteredOrders" :key="order.id">
			<view class="order-header">
				<view>
					<text class="order-id">订单号：{{ order.id }}</text>
					<text class="order-user">顾客：{{ order.userName }}</text>
				</view>
				<text :class="['order-status', order.status]">{{ getStatusLabel(order.status) }}</text>
			</view>

			<view class="order-time">下单时间：{{ order.createTime }}</view>

			<view class="order-progress-card">
				<view>
					<text class="progress-title">整体进度</text>
					<text class="order-progress">{{ order.progress.text }}</text>
					<text class="order-progress-desc">{{ order.progress.description }}</text>
				</view>
				<text class="progress-percent">{{ order.progress.percent }}%</text>
			</view>

			<view class="toggle-row" @tap="toggleExpanded(order.id)">
				<text class="toggle-text">{{ isExpanded(order.id) ? '收起详情' : '展开详情' }}</text>
				<text class="toggle-arrow">{{ isExpanded(order.id) ? '▲' : '▼' }}</text>
			</view>

			<view class="order-dishes" v-if="isExpanded(order.id)">
				<view class="dish-item" v-for="item in order.items" :key="item.dishId">
					<image :src="item.imageSnapshot" mode="aspectFill" class="dish-image"></image>
					<view class="dish-info">
						<text class="dish-name">{{ item.nameSnapshot }}</text>
						<text class="dish-meta">数量：{{ item.quantity }} 份</text>
						<text class="dish-meta">已上：{{ item.servedQuantity }} / {{ item.quantity }}</text>
					</view>
					<button class="serve-btn" v-if="canServe(order, item)" @tap="serveDish(order, item)">
						上菜 +1
					</button>
					<text class="served-tag" v-else-if="item.servedQuantity >= item.quantity">已上齐</text>
					<text class="served-tag muted" v-else>待操作</text>
				</view>

				<view class="timeline-box" v-if="order.logs && order.logs.length">
					<text class="timeline-title">操作记录</text>
					<view class="timeline-item" v-for="log in order.logs" :key="log.id">
						<view class="timeline-dot"></view>
						<view class="timeline-content">
							<text class="timeline-text">{{ log.content }}</text>
							<text class="timeline-meta">{{ log.time }} · {{ log.operatorName || '系统' }}</text>
						</view>
					</view>
				</view>
			</view>

			<view class="order-footer" :class="{ completed: order.status === ORDER_STATUS.COMPLETED }">
				<text class="order-total">合计：¥{{ order.totalPrice }}</text>
				<button class="accept-btn" v-if="canAccept(order)" @tap="acceptOrder(order)">接单</button>
				<text class="footer-tag" v-else-if="order.status === ORDER_STATUS.COMPLETED">已完成</text>
				<text class="footer-tag processing" v-else>处理中</text>
			</view>
		</view>
	</view>
</template>

<script>
import userStore from '@/store/user.js'
import orderStore, { ORDER_STATUS } from '@/store/order.js'

const STATUS_FILTER_ALL = 'all'
const STATUS_FILTER_PROCESSING = 'processing'

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

export default {
	data() {
		return {
			ORDER_STATUS,
			orders: [],
			activeStatus: STATUS_FILTER_ALL,
			expandedOrderIds: [],
			statusOptions: [
				{ label: '全部', value: STATUS_FILTER_ALL },
				{ label: '待接单', value: ORDER_STATUS.PENDING },
				{ label: '进行中', value: STATUS_FILTER_PROCESSING },
				{ label: '已完成', value: ORDER_STATUS.COMPLETED }
			]
		}
	},
	computed: {
		ordersWithProgress() {
			return this.orders.map(order => ({
				...order,
				progress: orderStore.getOrderProgress(order)
			}))
		},
		filteredOrders() {
			if (this.activeStatus === STATUS_FILTER_ALL) {
				return this.ordersWithProgress
			}

			if (this.activeStatus === STATUS_FILTER_PROCESSING) {
				return this.ordersWithProgress.filter(order => [ORDER_STATUS.ACCEPTED, ORDER_STATUS.SERVING].includes(order.status))
			}

			return this.ordersWithProgress.filter(order => order.status === this.activeStatus)
		}
	},
	onShow() {
		if (!userStore.isLoggedIn()) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			})
			setTimeout(() => {
				goToLogin('/pages/order-list/order-list')
			}, 600)
			return
		}

		if (!userStore.canManageOrders()) {
			redirectNoPermission()
			return
		}

		this.refreshOrders()
	},
	methods: {
		refreshOrders() {
			this.orders = orderStore.getAllOrders()
			this.expandedOrderIds = this.expandedOrderIds.filter(id => this.orders.some(order => order.id === id))
		},
		setStatusFilter(status) {
			this.activeStatus = status
		},
		getStatusLabel(status) {
			return orderStore.getStatusLabel(status)
		},
		canAccept(order) {
			return orderStore.canAccept(order)
		},
		canServe(order, item) {
			return orderStore.canServe(order, item)
		},
		isExpanded(orderId) {
			return this.expandedOrderIds.includes(orderId)
		},
		toggleExpanded(orderId) {
			if (this.isExpanded(orderId)) {
				this.expandedOrderIds = this.expandedOrderIds.filter(id => id !== orderId)
				return
			}

			this.expandedOrderIds = [...this.expandedOrderIds, orderId]
		},
		acceptOrder(order) {
			const updatedOrder = orderStore.acceptOrder(order.id, userStore.getCurrentUser())
			if (!updatedOrder) {
				uni.showToast({
					title: '当前状态不可接单',
					icon: 'none'
				})
				return
			}

			this.refreshOrders()
			uni.showToast({
				title: '已接单',
				icon: 'success'
			})
		},
		serveDish(order, item) {
			if (!this.canServe(order, item)) {
				uni.showToast({
					title: '当前状态不可上菜',
					icon: 'none'
				})
				return
			}

			const updatedOrder = orderStore.serveItem(order.id, item.dishId, userStore.getCurrentUser())
			if (!updatedOrder) {
				uni.showToast({
					title: '当前状态不可上菜',
					icon: 'none'
				})
				return
			}

			this.refreshOrders()
			uni.showToast({
				title: updatedOrder.status === ORDER_STATUS.COMPLETED ? '订单已完成' : '已上菜',
				icon: 'success'
			})
		}
	}
}
</script>

<style>
.container {
	padding: 20rpx;
}

.filter-bar {
	display: flex;
	gap: 16rpx;
	margin-bottom: 20rpx;
	overflow-x: auto;
}

.filter-chip {
	padding: 14rpx 26rpx;
	border-radius: 999rpx;
	background-color: #fff;
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

.order-item {
	background-color: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.order-header {
	display: flex;
	justify-content: space-between;
	gap: 20rpx;
	margin-bottom: 16rpx;
}

.order-id {
	font-size: 28rpx;
	color: #333;
	display: block;
}

.order-user,
.order-time {
	font-size: 24rpx;
	color: #666;
	margin-top: 10rpx;
	display: block;
}

.order-status {
	font-size: 26rpx;
	font-weight: bold;
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	height: fit-content;
}

.order-status.pending {
	color: #d68b00;
	background-color: #fff8df;
}

.order-status.accepted,
.order-status.serving {
	color: #2d8cf0;
	background-color: rgba(45, 140, 240, 0.12);
}

.order-status.completed {
	color: #19be6b;
	background-color: rgba(25, 190, 107, 0.12);
}

.order-progress-card {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 18rpx 22rpx;
	background-color: #fff8df;
	border-radius: 12rpx;
	color: #8a6d1d;
	margin-bottom: 20rpx;
}

.progress-title {
	font-size: 24rpx;
	color: #8a6d1d;
	display: block;
}

.order-progress {
	font-size: 30rpx;
	font-weight: bold;
	margin-top: 8rpx;
	display: block;
}

.order-progress-desc {
	font-size: 24rpx;
	margin-top: 8rpx;
	display: block;
}

.progress-percent {
	font-size: 36rpx;
	font-weight: bold;
	color: #d68b00;
}

.toggle-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10rpx 0 24rpx;
}

.toggle-text,
.toggle-arrow {
	font-size: 26rpx;
	color: #666;
}

.order-dishes {
	border-top: 1rpx solid #eee;
	padding-top: 20rpx;
}

.dish-item {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.dish-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 8rpx;
}

.dish-info {
	flex: 1;
	margin-left: 20rpx;
}

.dish-name {
	font-size: 28rpx;
	font-weight: bold;
	display: block;
}

.dish-meta {
	font-size: 24rpx;
	color: #666;
	margin-top: 8rpx;
	display: block;
}

.accept-btn,
.serve-btn {
	width: 150rpx;
	height: 64rpx;
	line-height: 64rpx;
	font-size: 24rpx;
	background-color: #f6c33d;
	color: #fff;
	border-radius: 32rpx;
	padding: 0;
}

.served-tag,
.footer-tag {
	font-size: 24rpx;
	color: #19be6b;
	background-color: rgba(25, 190, 107, 0.12);
	padding: 10rpx 18rpx;
	border-radius: 999rpx;
}

.served-tag.muted,
.footer-tag.processing {
	color: #2d8cf0;
	background-color: rgba(45, 140, 240, 0.12);
}

.timeline-box {
	margin-top: 10rpx;
	padding-top: 20rpx;
	border-top: 1rpx dashed #eee;
}

.timeline-title {
	font-size: 26rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 16rpx;
}

.timeline-item {
	display: flex;
	align-items: flex-start;
	margin-bottom: 18rpx;
}

.timeline-dot {
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	background-color: #f6c33d;
	margin-top: 12rpx;
	flex-shrink: 0;
}

.timeline-content {
	margin-left: 16rpx;
	flex: 1;
}

.timeline-text {
	font-size: 26rpx;
	color: #333;
	line-height: 1.6;
	display: block;
}

.timeline-meta {
	font-size: 22rpx;
	color: #999;
	margin-top: 6rpx;
	display: block;
}

.order-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: 20rpx;
	border-top: 1rpx solid #eee;
	gap: 20rpx;
}

.order-footer.completed {
	opacity: 0.75;
}

.order-total {
	font-size: 32rpx;
	color: #ff5500;
	font-weight: bold;
}
</style>
