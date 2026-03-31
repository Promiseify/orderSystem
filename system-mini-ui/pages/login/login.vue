<template>
	<view class="container">
		<view class="hero">
			<image class="logo" src="/static/logo.png" mode="aspectFit"></image>
			<text class="title">登录进入点餐演示</text>
			<text class="desc">当前阶段先使用演示账号完成登录，后续会将“选择演示账号”替换为“获取微信账号信息登录”。</text>
			<text class="redirect-tip" v-if="redirectUrl">登录后将继续前往{{ redirectLabel }}</text>
		</view>

		<view class="status-card" v-if="currentUser">
			<view class="status-main">
				<image class="status-avatar" :src="currentUser.avatar" mode="aspectFill"></image>
				<view class="status-info">
					<text class="status-title">当前已登录</text>
					<text class="status-name">{{ currentUser.nickname }} · {{ currentRoleLabel }}</text>
					<text class="status-desc">你可以继续使用当前账号，也可以重新选择其他演示身份。</text>
				</view>
			</view>
			<button class="secondary-btn" @tap="continueWithCurrentAccount">{{ redirectUrl ? `继续使用当前账号并前往${redirectLabel}` : '继续使用当前账号' }}</button>
		</view>

		<view class="guide-card">
			<view class="guide-header">
				<text class="guide-title">当前登录流程</text>
				<text class="guide-tag">MVP</text>
			</view>
			<text class="guide-desc">1. 选择演示身份 2. 写入本地登录状态 3. 登录成功后按 redirect 返回来源页。后续只替换“获取身份”这一步，不改现有登录态与跳转逻辑。</text>
		</view>

		<view class="section-header">
			<text class="section-title">选择演示账号</text>
			<text class="section-desc">点击任一身份即可进入当前小程序演示。</text>
		</view>

		<view class="account-list">
			<button
				v-for="account in accounts"
				:key="account.id"
				class="account-card"
				:class="{ active: currentUser && currentUser.id === account.id }"
				:loading="submittingUserId === account.id"
				:disabled="!!submittingUserId"
				@tap="login(account.id)"
			>
				<view class="account-main">
					<view class="account-left">
						<image class="account-avatar" :src="account.avatar" mode="aspectFill"></image>
						<view class="account-content">
							<view class="account-top">
								<text class="account-name">{{ account.roleLabel }}</text>
								<text class="current-tag" v-if="currentUser && currentUser.id === account.id">当前账号</text>
							</view>
							<text class="account-desc">{{ account.nickname }}</text>
							<text class="account-feature">{{ account.featureText }}</text>
						</view>
					</view>
					<text class="account-arrow">></text>
				</view>
				<text class="account-action">{{ getAccountActionText(account.id) }}</text>
			</button>
		</view>

		<text class="footer-tip">当前不接后端接口，登录状态仅用于本地持久化演示、页面跳转与角色权限判断。</text>
	</view>
</template>

<script>
import userStore from '@/store/user.js'

const DEFAULT_REDIRECT_URL = '/pages/profile/profile'
const TAB_PAGES = ['/pages/index/index', '/pages/profile/profile']
const PAGE_LABELS = {
	'/pages/index/index': '点餐首页',
	'/pages/profile/profile': '个人中心',
	'/pages/my-orders/my-orders': '我的订单',
	'/pages/order-list/order-list': '订单管理',
	'/pages/dish-manage/dish-manage': '菜品管理'
}
const ACCOUNT_FEATURES = {
	customer: '可体验点餐与我的订单流程',
	manager: '可体验订单处理与门店管理流程',
	admin: '可体验订单处理与菜品管理流程'
}

export default {
	data() {
		return {
			accounts: [],
			currentUser: null,
			currentRoleLabel: '',
			redirectUrl: '',
			submittingUserId: ''
		}
	},
	computed: {
		redirectLabel() {
			return PAGE_LABELS[this.redirectUrl] || '目标页面'
		}
	},
	onLoad(options = {}) {
		this.redirectUrl = options.redirect ? decodeURIComponent(options.redirect) : ''
		this.refreshPageState()
	},
	onShow() {
		this.refreshPageState()
	},
	methods: {
		refreshPageState() {
			this.accounts = userStore.getDemoAccounts().map(account => ({
				...account,
				featureText: ACCOUNT_FEATURES[account.role] || '可体验当前身份相关页面'
			}))
			this.currentUser = userStore.getCurrentUser()
			this.currentRoleLabel = this.currentUser ? userStore.getCurrentRoleLabel() : ''
		},
		getSelectedDemoAccount(userId) {
			return this.accounts.find(account => account.id === userId) || null
		},
		applyLoginState(userId) {
			return userStore.login(userId)
		},
		handleSuccessRedirect() {
			const targetUrl = this.redirectUrl || DEFAULT_REDIRECT_URL
			if (TAB_PAGES.includes(targetUrl)) {
				uni.switchTab({
					url: targetUrl
				})
				return
			}

			uni.redirectTo({
				url: targetUrl
			})
		},
		continueWithCurrentAccount() {
			if (!this.currentUser) {
				return
			}
			this.handleSuccessRedirect()
		},
		getAccountActionText(accountId) {
			if (!this.currentUser) {
				return '使用该身份登录'
			}

			return this.currentUser.id === accountId ? '继续使用该账号' : '切换为该账号'
		},
		login(userId) {
			if (this.submittingUserId) {
				return
			}

			const selectedAccount = this.getSelectedDemoAccount(userId)
			if (!selectedAccount) {
				uni.showToast({
					title: '账号不存在',
					icon: 'none'
				})
				return
			}

			const previousUserId = userStore.getCurrentUserId()
			this.submittingUserId = userId
			const user = this.applyLoginState(selectedAccount.id)
			if (!user) {
				this.submittingUserId = ''
				uni.showToast({
					title: '登录失败',
					icon: 'none'
				})
				return
			}

			this.refreshPageState()
			let toastTitle = `${selectedAccount.roleLabel}登录成功`
			if (previousUserId && previousUserId === user.id) {
				toastTitle = `已继续使用${selectedAccount.roleLabel}`
			} else if (previousUserId && previousUserId !== user.id) {
				toastTitle = `已切换为${selectedAccount.roleLabel}`
			}

			uni.showToast({
				title: toastTitle,
				icon: 'success'
			})

			setTimeout(() => {
				this.submittingUserId = ''
				this.handleSuccessRedirect()
			}, 800)
		}
	}
}
</script>

<style>
.container {
	min-height: 100vh;
	padding: 56rpx 32rpx 48rpx;
	background: linear-gradient(180deg, #fff7d8 0%, #f8f8f8 42%);
	box-sizing: border-box;
}

.hero {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	padding-top: 20rpx;
}

.logo {
	width: 180rpx;
	height: 180rpx;
}

.title {
	font-size: 42rpx;
	font-weight: bold;
	color: #333;
	margin-top: 24rpx;
}

.desc {
	font-size: 26rpx;
	color: #666;
	margin-top: 16rpx;
	line-height: 1.7;
}

.redirect-tip {
	margin-top: 20rpx;
	padding: 14rpx 24rpx;
	font-size: 24rpx;
	color: #d68b00;
	background-color: rgba(255, 255, 255, 0.85);
	border-radius: 999rpx;
}

.status-card,
.guide-card {
	margin-top: 28rpx;
	padding: 28rpx;
	background-color: rgba(255, 255, 255, 0.94);
	border-radius: 24rpx;
	box-shadow: 0 10rpx 28rpx rgba(0, 0, 0, 0.05);
}

.status-main {
	display: flex;
	align-items: center;
}

.status-avatar {
	width: 92rpx;
	height: 92rpx;
	border-radius: 50%;
	flex-shrink: 0;
}

.status-info {
	margin-left: 20rpx;
	flex: 1;
}

.status-title {
	font-size: 24rpx;
	color: #999;
	display: block;
}

.status-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
	margin-top: 8rpx;
	display: block;
}

.status-desc {
	font-size: 24rpx;
	color: #666;
	margin-top: 10rpx;
	line-height: 1.6;
	display: block;
}

.secondary-btn {
	margin-top: 24rpx;
	height: 80rpx;
	line-height: 80rpx;
	border-radius: 40rpx;
	background-color: #fff8df;
	color: #b57a00;
	font-size: 26rpx;
	border: 1rpx solid rgba(214, 139, 0, 0.15);
}

.guide-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20rpx;
}

.guide-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
}

.guide-tag {
	padding: 6rpx 18rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	color: #fff;
	background-color: #f6c33d;
}

.guide-desc {
	margin-top: 18rpx;
	font-size: 25rpx;
	color: #666;
	line-height: 1.8;
	display: block;
}

.section-header {
	margin-top: 36rpx;
	padding: 0 6rpx;
}

.section-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
	display: block;
}

.section-desc {
	font-size: 24rpx;
	color: #999;
	margin-top: 10rpx;
	display: block;
}

.account-list {
	margin-top: 20rpx;
}

.account-card {
	width: 100%;
	margin-bottom: 24rpx;
	padding: 28rpx;
	background-color: #fff;
	border-radius: 24rpx;
	box-shadow: 0 10rpx 28rpx rgba(0, 0, 0, 0.05);
	box-sizing: border-box;
	text-align: left;
}

.account-card.active {
	border: 2rpx solid rgba(246, 195, 61, 0.9);
	background-color: #fffcf1;
}

.account-main {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20rpx;
}

.account-left {
	display: flex;
	align-items: center;
	flex: 1;
	min-width: 0;
}

.account-avatar {
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
	flex-shrink: 0;
}

.account-content {
	margin-left: 20rpx;
	flex: 1;
	min-width: 0;
}

.account-top {
	display: flex;
	align-items: center;
	gap: 12rpx;
	flex-wrap: wrap;
}

.account-name {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.current-tag {
	padding: 4rpx 14rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	color: #b57a00;
	background-color: #fff2bf;
}

.account-desc {
	font-size: 24rpx;
	color: #666;
	margin-top: 10rpx;
	display: block;
}

.account-feature {
	font-size: 24rpx;
	color: #999;
	margin-top: 8rpx;
	line-height: 1.6;
	display: block;
}

.account-arrow {
	font-size: 32rpx;
	color: #ccc;
	flex-shrink: 0;
}

.account-action {
	font-size: 24rpx;
	color: #d68b00;
	margin-top: 18rpx;
	display: block;
}

.footer-tip {
	margin-top: 8rpx;
	padding: 0 6rpx 24rpx;
	font-size: 22rpx;
	color: #999;
	line-height: 1.7;
	display: block;
}
</style>
