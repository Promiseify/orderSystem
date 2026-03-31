<template>
	<view class="container">
		<view class="empty-state" v-if="!orders.length">
			<text class="empty-title">暂无订单</text>
			<text class="empty-desc">快去首页挑选喜欢的菜品，下单后可在这里查看进度。</text>
			<button class="empty-btn" @tap="goToMenu">去点餐</button>
		</view>

		<view class="order-item" v-for="order in ordersWithProgress" :key="order.id">
			<view class="order-header">
				<view>
					<text class="order-id">订单号：{{ order.id }}</text>
					<text class="order-time">{{ order.createTime }}</text>
				</view>
				<text :class="['order-status', order.status]">{{ getStatusLabel(order.status) }}</text>
			</view>

			<view class="progress-box">
				<view>
					<text class="progress-title">订单进度</text>
					<text class="progress-text">{{ order.progress.text }}</text>
					<text class="progress-desc">{{ order.progress.description }}</text>
				</view>
				<text class="progress-percent">{{ order.progress.percent }}%</text>
			</view>

			<view class="recent-log" v-if="order.progress.latestLog">
				<text class="recent-log-label">最近更新</text>
				<text class="recent-log-text">{{ formatLog(order.progress.latestLog) }}</text>
			</view>

			<view class="toggle-row" @tap="toggleExpanded(order.id)">
				<text class="toggle-text">{{ isExpanded(order.id) ? '收起详情' : '展开详情' }}</text>
				<text class="toggle-arrow">{{ isExpanded(order.id) ? '▲' : '▼' }}</text>
			</view>

			<view class="order-dishes" v-if="isExpanded(order.id)">
				<view class="dish-item" v-for="item in order.items" :key="item.dishId">
					<image :src="item.imageSnapshot" mode="aspectFill" class="dish-image"></image>
					<view class="dish-info">
						<view class="dish-top">
							<text class="dish-name">{{ item.nameSnapshot }}</text>
							<text class="dish-quantity">x{{ item.quantity }}</text>
						</view>
						<text class="dish-price">¥{{ item.priceSnapshot }}</text>
						<text class="dish-progress">已上菜 {{ item.servedQuantity }}/{{ item.quantity }}</text>
					</view>
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

			<view class="order-footer">
				<text class="progress-summary">已完成 {{ order.progress.completedItemCount }}/{{ order.progress.totalItemCount }} 道菜</text>
				<text class="order-total">合计：¥{{ order.totalPrice }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import userStore from '@/store/user.js'
import orderStore from '@/store/order.js'

function goToLogin(redirectUrl = '') {
	const encodedRedirect = redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''
	uni.navigateTo({
		url: `/pages/login/login${encodedRedirect}`
	})
}

function requireLogin(redirectUrl = '') {
	uni.showToast({
		title: '请先登录',
		icon: 'none'
	})
	setTimeout(() => {
		goToLogin(redirectUrl)
	}, 600)
}

export default {
	data() {
		return {
			orders: [],
			expandedOrderIds: []
		}
	},
	computed: {
		ordersWithProgress() {
			return this.orders.map(order => ({
				...order,
				progress: orderStore.getOrderProgress(order)
			}))
		}
	},
	onShow() {
		if (!userStore.isLoggedIn()) {
			requireLogin('/pages/my-orders/my-orders')
			return
		}

		this.refreshOrders()
	},
	methods: {
		refreshOrders() {
			this.orders = orderStore.getOrdersByUser(userStore.getCurrentUserId())
			this.expandedOrderIds = this.expandedOrderIds.filter(id => this.orders.some(order => order.id === id))
		},
		getStatusLabel(status) {
			return orderStore.getStatusLabel(status)
		},
		formatLog(log) {
			if (!log) {
				return ''
			}
			return `${log.time} · ${log.content}`
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
		goToMenu() {
			uni.switchTab({
				url: '/pages/index/index'
			})
		}
	}
}
</script>

<style>
.container {
	padding: 20rpx;
}

.empty-state {
	padding: 140rpx 40rpx;
	text-align: center;
	color: #999;
}

.empty-title {
	font-size: 34rpx;
	font-weight: bold;
	color: #333;
	display: block;
}

.empty-desc {
	font-size: 26rpx;
	line-height: 1.7;
	margin-top: 18rpx;
	display: block;
}

.empty-btn {
	margin-top: 40rpx;
	width: 240rpx;
	height: 84rpx;
	line-height: 84rpx;
	background-color: #f6c33d;
	color: #fff;
	border-radius: 42rpx;
	font-size: 28rpx;
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
	margin-bottom: 20rpx;
}

.order-id {
	font-size: 28rpx;
	color: #333;
	display: block;
}

.order-time {
	font-size: 24rpx;
	color: #999;
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

.progress-box {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 24rpx;
	background-color: #fff8df;
	border-radius: 12rpx;
}

.progress-title {
	font-size: 26rpx;
	color: #8a6d1d;
	display: block;
}

.progress-text {
	font-size: 30rpx;
	color: #8a6d1d;
	font-weight: bold;
	margin-top: 8rpx;
	display: block;
}

.progress-desc {
	font-size: 24rpx;
	color: #8a6d1d;
	margin-top: 8rpx;
	display: block;
}

.progress-percent {
	font-size: 36rpx;
	font-weight: bold;
	color: #d68b00;
}

.recent-log {
	margin-top: 18rpx;
	padding: 20rpx 24rpx;
	background-color: #f7f8fa;
	border-radius: 12rpx;
}

.recent-log-label {
	font-size: 24rpx;
	color: #999;
	display: block;
}

.recent-log-text {
	font-size: 26rpx;
	color: #333;
	margin-top: 8rpx;
	line-height: 1.6;
	display: block;
}

.toggle-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 0;
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

.dish-top {
	display: flex;
	justify-content: space-between;
	gap: 20rpx;
}

.dish-name {
	font-size: 28rpx;
	flex: 1;
}

.dish-quantity {
	color: #666;
}

.dish-price {
	font-size: 28rpx;
	color: #ff5500;
	margin-top: 10rpx;
	display: block;
}

.dish-progress {
	font-size: 24rpx;
	color: #666;
	margin-top: 8rpx;
	display: block;
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
	margin-top: 20rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid #eee;
	gap: 20rpx;
}

.progress-summary {
	font-size: 24rpx;
	color: #999;
}

.order-total {
	font-size: 32rpx;
	color: #ff5500;
	font-weight: bold;
}
</style>
