<template>
	<view class="container">
		<view class="header">
			<view class="user-info" v-if="currentUser">
				<image class="avatar" :src="currentUser.avatar" mode="aspectFill"></image>
				<view class="user-detail">
					<text class="nickname">{{ currentUser.nickname }}</text>
					<text class="user-type">{{ roleLabel }}</text>
				</view>
			</view>
			<view class="guest-box" v-else>
				<text class="guest-title">当前未登录</text>
				<text class="guest-desc">登录后可进行点餐、订单处理和菜品管理演示</text>
				<button class="login-btn" @tap="goToLogin">去登录</button>
			</view>
		</view>

		<view class="menu-list" v-if="currentUser">
			<view class="menu-item" v-if="userStore.isCustomer()" @tap="goToMyOrders">
				<view class="menu-item-left">
					<image class="menu-icon" src="/static/icons/order.png"></image>
					<text>我的订单</text>
				</view>
				<text class="arrow">></text>
			</view>

			<view class="menu-item" v-if="userStore.canManageOrders()" @tap="goToOrderManage">
				<view class="menu-item-left">
					<image class="menu-icon" src="/static/icons/order.png"></image>
					<text>订单管理</text>
				</view>
				<text class="arrow">></text>
			</view>

			<view class="menu-item" v-if="userStore.canManageDishes()" @tap="goToDishManage">
				<view class="menu-item-left">
					<image class="menu-icon" src="/static/icons/manage.png"></image>
					<text>菜品管理</text>
				</view>
				<text class="arrow">></text>
			</view>

			<view class="menu-item" @tap="goToLogin">
				<view class="menu-item-left">
					<image class="menu-icon" src="/static/icons/address.png"></image>
					<text>切换账号</text>
				</view>
				<text class="arrow">></text>
			</view>
		</view>

		<button class="logout-btn" v-if="currentUser" @tap="logout">退出登录</button>
	</view>
</template>

<script>
import userStore from '@/store/user.js'

export default {
	data() {
		return {
			userStore
		}
	},
	computed: {
		currentUser() {
			return userStore.getCurrentUser()
		},
		roleLabel() {
			return this.currentUser ? userStore.getCurrentRoleLabel() : ''
		}
	},
	methods: {
		goToLogin() {
			uni.navigateTo({
				url: '/pages/login/login'
			})
		},
		goToMyOrders() {
			uni.navigateTo({
				url: '/pages/my-orders/my-orders'
			})
		},
		goToOrderManage() {
			uni.navigateTo({
				url: '/pages/order-list/order-list'
			})
		},
		goToDishManage() {
			uni.navigateTo({
				url: '/pages/dish-manage/dish-manage'
			})
		},
		logout() {
			uni.showModal({
				title: '提示',
				content: '确定要退出登录吗？',
				success: res => {
					if (!res.confirm) {
						return
					}

					userStore.logout()
					uni.showToast({
						title: '已退出登录',
						icon: 'success'
					})
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/login/login'
						})
					}, 600)
				}
			})
		}
	}
}
</script>

<style>
.container {
	padding: 0;
	background-color: #f8f8f8;
	min-height: 100vh;
}

.header {
	background: linear-gradient(135deg, #f6c33d, #ffd700);
	padding: 60rpx 30rpx;
	color: #fff;
	border-radius: 0 0 30rpx 30rpx;
}

.user-info {
	display: flex;
	align-items: center;
}

.avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.user-detail {
	margin-left: 30rpx;
}

.nickname {
	font-size: 36rpx;
	color: #fff;
	font-weight: bold;
	display: block;
}

.user-type {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.8);
	margin-top: 10rpx;
	display: block;
}

.guest-box {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
}

.guest-title {
	font-size: 38rpx;
	font-weight: bold;
	color: #fff;
}

.guest-desc {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.85);
	margin-top: 16rpx;
	line-height: 1.6;
}

.login-btn {
	margin: 30rpx 0 0;
	background-color: #fff;
	color: #d68b00;
	border-radius: 40rpx;
	padding: 0 40rpx;
	font-size: 28rpx;
}

.menu-list {
	margin: 30rpx;
	background-color: #fff;
	border-radius: 16rpx;
	padding: 0 30rpx;
}

.menu-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 40rpx 0;
	border-bottom: 1rpx solid #eee;
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-item-left {
	display: flex;
	align-items: center;
}

.menu-icon {
	width: 40rpx;
	height: 40rpx;
	margin-right: 20rpx;
}

.arrow {
	color: #999;
	font-family: sans-serif;
}

.logout-btn {
	margin: 60rpx 30rpx;
	background-color: #f6c33d;
	color: #fff;
	border-radius: 45rpx;
	font-size: 32rpx;
	height: 90rpx;
	line-height: 90rpx;
}
</style>
