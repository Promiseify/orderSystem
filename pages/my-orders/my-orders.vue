<template>
	<view class="container">
		<view class="order-item" v-for="order in myOrders" :key="order.id">
			<view class="order-header">
				<text class="order-id">订单号：{{order.id}}</text>
				<text class="order-status">{{order.status}}</text>
			</view>
			<view class="order-dishes">
				<view class="dish-item" v-for="item in order.items" :key="item.dish.id">
					<image :src="item.dish.image" mode="aspectFill" class="dish-image"></image>
					<view class="dish-info">
						<text class="dish-name">{{item.dish.name}}</text>
						<text class="dish-quantity">x{{item.quantity}}</text>
						<text class="dish-price">¥{{item.dish.price}}</text>
					</view>
				</view>
			</view>
			<view class="order-footer">
				<text class="order-time">{{order.createTime}}</text>
				<text class="order-total">合计：¥{{order.totalPrice}}</text>
			</view>
		</view>
	</view>
</template>

<script>
import userStore from '@/store/user.js'

export default {
	data() {
		return {
			myOrders: []
		}
	},
	onShow() {
		// 获取当前用户的订单
		this.myOrders = userStore.getOrders().filter(
			order => order.userId === userStore.state.currentUser?.id
		)
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
	position: relative;
}

.dish-name {
	font-size: 28rpx;
}

.dish-quantity {
	position: absolute;
	right: 0;
	top: 0;
	color: #666;
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
	margin-top: 20rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid #eee;
}

.order-time {
	font-size: 24rpx;
	color: #999;
}

.order-total {
	font-size: 32rpx;
	color: #ff5500;
	font-weight: bold;
}
</style> 