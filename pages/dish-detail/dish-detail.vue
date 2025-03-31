<template>
	<view class="container">
		<swiper class="swiper" :indicator-dots="true" :autoplay="true" :interval="3000" :duration="1000">
			<swiper-item v-for="(img, index) in dish.images" :key="index">
				<image :src="img" mode="aspectFill" class="dish-image"></image>
			</swiper-item>
		</swiper>
		
		<view class="info-section">
			<view class="dish-name">{{dish.name}}</view>
			<view class="dish-price">¥{{dish.price}}</view>
			<view class="dish-sales">月售 {{dish.sales}} 份</view>
		</view>
		
		<view class="desc-section">
			<view class="section-title">商品描述</view>
			<view class="desc-content">{{dish.description}}</view>
		</view>
		
		<!-- 底部操作栏 -->
		<view class="bottom-bar">
			<view class="price-section">
				<text class="price-symbol">¥</text>
				<text class="price-value">{{dish.price}}</text>
			</view>
			<button class="add-to-cart-btn" @tap="addToCart">加入购物车</button>
		</view>
	</view>
</template>

<script>
import userStore from '@/store/user.js'
import cartStore from '@/store/cart.js'

export default {
	data() {
		return {
			dish: {
				id: 1,
				name: '宫保鸡丁',
				price: 28,
				sales: 999,
				images: ['/static/product/goods1.png', '/static/product/goods2.png'],
				description: '宫保鸡丁，是一道闻名中外的特色传统名菜。鸡丁、花生、黄瓜丁炒制，红而不辣、辣而不猛、香辣适中、鲜嫩可口。'
			}
		}
	},
	onLoad(options) {
		// 实际应用中，这里需要根据传入的id获取菜品详情
		const id = options.id
		// this.getDishDetail(id)
	},
	methods: {
		addToCart() {
			if (!userStore.state.currentUser) {
				uni.showToast({
					title: '请先登录',
					icon: 'none'
				})
				return
			}
			
			cartStore.addItem(this.dish)
			uni.showToast({
				title: '已加入购物车',
				icon: 'success'
			})
			
			// 可选：返回上一页
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
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

.dish-name {
	font-size: 36rpx;
	font-weight: bold;
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
	box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.1);
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
</style> 