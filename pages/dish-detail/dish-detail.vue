<template>
	<view class="container" v-if="dish">
		<swiper class="swiper" :indicator-dots="true" :autoplay="true" :interval="3000" :duration="1000">
			<swiper-item v-for="(img, index) in dishImages" :key="index">
				<image :src="img" mode="aspectFill" class="dish-image"></image>
			</swiper-item>
		</swiper>

		<view class="info-section">
			<view class="name-row">
				<view class="dish-name">{{ dish.name }}</view>
				<text class="dish-status off" v-if="isOffShelf">已下架</text>
				<text class="dish-status on" v-else>上架中</text>
			</view>
			<view class="dish-price">¥{{ dish.price }}</view>
			<view class="dish-sales">月售 {{ dish.sales || 0 }} 份</view>
		</view>

		<view class="desc-section">
			<view class="section-title">商品描述</view>
			<view class="desc-content">{{ dish.description || '暂无描述' }}</view>
		</view>

		<view class="bottom-bar">
			<view class="price-section">
				<text class="price-symbol">¥</text>
				<text class="price-value">{{ dish.price }}</text>
			</view>
			<button class="add-to-cart-btn" :disabled="!canAddToCart" :class="{ disabled: !canAddToCart }" @tap="addToCart">
				{{ canAddToCart ? '加入购物车' : '已下架' }}
			</button>
		</view>
	</view>

	<view class="empty-container" v-else>
		<text class="empty-text">菜品不存在或已被移除</text>
	</view>
</template>

<script>
import userStore from '@/store/user.js'
import cartStore from '@/store/cart.js'
import dishStore from '@/store/dish.js'

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
			dishId: '',
			dish: null
		}
	},
	computed: {
		dishImages() {
			return this.dish?.images || []
		},
		isOffShelf() {
			return !!this.dish && !dishStore.isOnShelf(this.dish)
		},
		canAddToCart() {
			return !!this.dish && dishStore.isOnShelf(this.dish)
		}
	},
	onLoad(options) {
		this.dishId = options.id || ''
		this.refreshDish()
	},
	onShow() {
		this.refreshDish()
	},
	methods: {
		refreshDish() {
			if (!this.dishId) {
				this.dish = null
				return
			}

			this.dish = dishStore.getDishById(this.dishId)
		},
		addToCart() {
			if (!this.canAddToCart) {
				uni.showToast({
					title: '该菜品已下架',
					icon: 'none'
				})
				return
			}

			const added = cartStore.tryAddItem(this.dish)
			if (!added && !userStore.isLoggedIn()) {
				requireLogin(`/pages/dish-detail/dish-detail?id=${this.dishId}`)
			}
		}
	}
}
</script>

<style>
.container {
	padding-bottom: 100rpx;
}

.swiper {
	width: 100%;
	height: 750rpx;
}

.dish-image {
	width: 100%;
	height: 100%;
}

.info-section {
	padding: 30rpx;
	background-color: #fff;
}

.name-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
}

.dish-name {
	font-size: 36rpx;
	font-weight: bold;
	flex: 1;
}

.dish-status {
	font-size: 24rpx;
	padding: 8rpx 18rpx;
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

.dish-price {
	font-size: 40rpx;
	color: #ff5500;
	margin-top: 20rpx;
}

.dish-sales {
	font-size: 24rpx;
	color: #999;
	margin-top: 10rpx;
}

.desc-section {
	margin-top: 20rpx;
	padding: 30rpx;
	background-color: #fff;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	margin-bottom: 20rpx;
}

.desc-content {
	font-size: 28rpx;
	color: #666;
	line-height: 1.6;
}

.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 100rpx;
	background-color: #fff;
	display: flex;
	align-items: center;
	padding: 0 30rpx;
	box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.price-section {
	flex: 1;
}

.price-symbol {
	font-size: 28rpx;
	color: #ff5500;
}

.price-value {
	font-size: 40rpx;
	color: #ff5500;
	font-weight: bold;
}

.add-to-cart-btn {
	width: 240rpx;
	height: 80rpx;
	line-height: 80rpx;
	background-color: #f6c33d;
	color: #fff;
	border-radius: 40rpx;
	font-size: 28rpx;
}

.add-to-cart-btn.disabled {
	background-color: #d8d8d8;
	color: #fff;
}

.empty-container {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx;
	background-color: #f8f8f8;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}
</style>
