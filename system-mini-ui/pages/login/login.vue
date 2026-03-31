<template>
	<view class="container">
		<view class="hero">
			<image class="logo" src="/static/logo.png" mode="aspectFit"></image>
			<text class="title">小程序点餐演示登录</text>
			<text class="desc">请选择身份进入当前 uni-app 小程序演示</text>
			<text class="redirect-tip" v-if="redirectUrl">登录后将继续前往目标页面</text>
		</view>

		<view class="account-list">
			<button class="account-btn" v-for="account in accounts" :key="account.id" @tap="login(account.id)">
				<text class="account-name">{{ account.roleLabel }}</text>
				<text class="account-desc">{{ account.nickname }}</text>
			</button>
		</view>
	</view>
</template>

<script>
import userStore from '@/store/user.js'

const TAB_PAGES = ['/pages/index/index', '/pages/profile/profile']

export default {
	data() {
		return {
			accounts: userStore.getDemoAccounts(),
			redirectUrl: ''
		}
	},
	onLoad(options) {
		this.redirectUrl = options.redirect ? decodeURIComponent(options.redirect) : ''
	},
	methods: {
		handleSuccessRedirect() {
			if (!this.redirectUrl) {
				uni.switchTab({
					url: '/pages/profile/profile'
				})
				return
			}

			if (TAB_PAGES.includes(this.redirectUrl)) {
				uni.switchTab({
					url: this.redirectUrl
				})
				return
			}

			uni.redirectTo({
				url: this.redirectUrl
			})
		},
		login(userId) {
			const user = userStore.login(userId)
			if (!user) {
				uni.showToast({
					title: '登录失败',
					icon: 'none'
				})
				return
			}

			uni.showToast({
				title: `${userStore.getRoleLabel(user.role)}登录成功`,
				icon: 'success'
			})

			setTimeout(() => {
				this.handleSuccessRedirect()
			}, 800)
		}
	}
}
</script>

<style>
.container {
	min-height: 100vh;
	padding: 60rpx 40rpx;
	background: linear-gradient(180deg, #fff7d8 0%, #f8f8f8 40%);
	box-sizing: border-box;
}

.hero {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	padding-top: 40rpx;
}

.logo {
	width: 180rpx;
	height: 180rpx;
}

.title {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
	margin-top: 24rpx;
}

.desc {
	font-size: 26rpx;
	color: #666;
	margin-top: 16rpx;
	line-height: 1.6;
}

.redirect-tip {
	font-size: 24rpx;
	color: #d68b00;
	margin-top: 16rpx;
	padding: 12rpx 20rpx;
	background-color: rgba(255, 255, 255, 0.7);
	border-radius: 999rpx;
}

.account-list {
	margin-top: 80rpx;
}

.account-btn {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: center;
	width: 100%;
	background-color: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
	box-sizing: border-box;
}

.account-name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.account-desc {
	font-size: 24rpx;
	color: #666;
	margin-top: 12rpx;
}
</style>
