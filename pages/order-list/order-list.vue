<template>
	<view class="container">
		<view class="order-item" v-for="order in orders" :key="order.id">
			<view class="order-header">
				<text class="order-id">订单号：{{order.id}}</text>
				<text class="order-status">{{order.status}}</text>
			</view>
			<view class="order-content">
				<image :src="order.dish.image" mode="aspectFill" class="dish-image"></image>
				<view class="order-info">
					<text class="dish-name">{{order.dish.name}}</text>
					<text class="dish-price">¥{{order.dish.price}}</text>
				</view>
			</view>
			<view class="order-footer">
				<text class="order-time">{{order.createTime}}</text>
				<button class="op-btn" v-if="isAdmin" @tap="handleOrder(order)">接单</button>
			</view>
		</view>
	</view>
</template>

<script>
import userStore from '@/store/user.js'

export default {
	data() {
		return {
			orders: []
		}
	},
	computed: {
		isAdmin() {
			return userStore.state.currentUser?.isAdmin
		}
	},
	onShow() {
		this.orders = userStore.getOrders()
	},
	methods: {
		handleOrder(order) {
			order.status = '已接单'
			uni.showToast({
				title: '已接单',
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

.order-item {
	background-color: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.order-header {
	display: flex;
	justify-content: space-between;
	margin-bottom: 20rpx;
}

.order-id {
	font-size: 28rpx;
	color: #666;
}

.order-status {
	font-size: 28rpx;
	color: #f6c33d;
}

.order-content {
	display: flex;
	margin-bottom: 20rpx;
}

.dish-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 8rpx;
}

.order-info {
	flex: 1;
	margin-left: 20rpx;
}

.dish-name {
	font-size: 32rpx;
	font-weight: bold;
}

.dish-price {
	font-size: 28rpx;
	color: #ff5500;
	margin-top: 10rpx;
}

.order-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.order-time {
	font-size: 24rpx;
	color: #999;
}

.op-btn {
	width: 120rpx;
	height: 60rpx;
	line-height: 60rpx;
	font-size: 24rpx;
	background-color: #f6c33d;
	color: #fff;
}
</style> 