<template>
	<view class="container">
		<view class="header">
			<view class="user-info">
				<image class="avatar" :src="userInfo.avatar" mode="aspectFill"></image>
				<view class="user-detail">
					<text class="nickname">{{userInfo.nickname}}</text>
					<text class="user-type">{{isAdmin ? '管理员' : '普通用户'}}</text>
				</view>
			</view>
		</view>
		
		<view class="menu-list">
			<view class="menu-item" @tap="goToOrders">
				<view class="menu-item-left">
					<image class="menu-icon" src="/static/icons/order.png"></image>
					<text>我的订单</text>
				</view>
				<text class="arrow">></text>
			</view>
			
			<view class="menu-item" @tap="goToAddress">
				<view class="menu-item-left">
					<image class="menu-icon" src="/static/icons/address.png"></image>
					<text>收货地址</text>
				</view>
				<text class="arrow">></text>
			</view>
			
			<view class="menu-item" v-if="isAdmin" @tap="goToDishManage">
				<view class="menu-item-left">
					<image class="menu-icon" src="/static/icons/manage.png"></image>
					<text>菜品管理</text>
				</view>
				<text class="arrow">></text>
			</view>
		</view>
		
		<button class="logout-btn" @tap="logout">退出登录</button>
	</view>
</template>

<script>
import userStore from '@/store/user.js'

export default {
	data() {
		return {
			userInfo: userStore.state.currentUser || {}
		}
	},
	computed: {
		isAdmin() {
			return this.userInfo.isAdmin
		}
	},
	onShow() {
		// 如果未登录，模拟登录为普通用户
		if (!userStore.state.currentUser) {
			this.userInfo = userStore.login('user')
		}
	},
	methods: {
		goToOrders() {
			if (this.isAdmin) {
				uni.navigateTo({
					url: '/pages/order-list/order-list'
				})
			} else {
				uni.navigateTo({
					url: '/pages/my-orders/my-orders'
				})
			}
		},
		goToAddress() {
			uni.showToast({
				title: '功能开发中',
				icon: 'none'
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
				success: (res) => {
					if (res.confirm) {
						userStore.logout()
						// 重新登录为另一个用户（这里仅作演示）
						this.userInfo = userStore.login(this.isAdmin ? 'user' : 'admin')
						uni.showToast({
							title: '切换用户成功',
							icon: 'success'
						})
					}
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
	border: 4rpx solid rgba(255,255,255,0.3);
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
	color: rgba(255,255,255,0.8);
	margin-top: 10rpx;
	display: block;
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

.menu-item-left {
	display: flex;
	align-items: center;
}

.menu-icon {
	width: 40rpx;
	height: 40rpx;
	margin-right: 20rpx;
	color: #f6c33d;
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