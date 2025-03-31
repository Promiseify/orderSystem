<template>
	<view class="container">
		<!-- 左侧菜系列表 -->
		<scroll-view class="category-list" scroll-y>
			<view 
				v-for="(category, index) in categories" 
				:key="index"
				:class="['category-item', currentCategory === index ? 'active' : '']"
				@tap="selectCategory(index)"
			>
				{{category.name}}
			</view>
		</scroll-view>
		
		<!-- 右侧菜品列表 -->
		<scroll-view class="dish-list" scroll-y>
			<view class="dish-item" v-for="(dish, index) in currentDishes" :key="index" @tap="goToDetail(dish)">
				<image class="dish-image" :src="dish.image" mode="aspectFill"></image>
				<view class="dish-info">
					<text class="dish-name">{{dish.name}}</text>
					<text class="dish-price">¥{{dish.price}}</text>
					<button class="add-btn" @tap.stop="addToCart(dish)">+</button>
				</view>
			</view>
		</scroll-view>
		
		<!-- 购物车状态栏 -->
		<view class="cart-bar" v-show="cartStore.getTotalQuantity() > 0">
			<view class="cart-preview" @tap="showCartDetail">
				<view class="cart-icon">
					<image src="/static/icons/cart.png" mode="aspectFit"></image>
					<text class="cart-badge" v-if="cartStore.getTotalQuantity()">{{cartStore.getTotalQuantity()}}</text>
				</view>
				<view class="cart-info">
					<text class="cart-count">已选 {{cartStore.getTotalQuantity()}} 件</text>
					<text class="cart-total">¥{{cartStore.getTotalPrice()}}</text>
				</view>
			</view>
			<button class="submit-btn" @tap="submitOrder">下单</button>
		</view>
		
		<!-- 购物车详情弹窗 -->
		<view class="cart-popup" v-if="showCart">
			<view class="cart-mask" @tap="hideCartDetail"></view>
			<view class="cart-content">
				<view class="cart-header">
					<text class="cart-title">购物车</text>
					<text class="clear-btn" @tap="clearCart">清空</text>
				</view>
				
				<scroll-view class="cart-list" scroll-y>
					<view class="cart-item" v-for="item in cartStore.state.items" :key="item.dish.id">
						<image :src="item.dish.image" mode="aspectFill" class="item-image"></image>
						<view class="item-info">
							<text class="item-name">{{item.dish.name}}</text>
							<text class="item-price">¥{{item.dish.price}}</text>
						</view>
						<view class="item-controls">
							<text class="control-btn" @tap="decreaseQuantity(item)">-</text>
							<text class="quantity">{{item.quantity}}</text>
							<text class="control-btn" @tap="increaseQuantity(item)">+</text>
						</view>
					</view>
				</scroll-view>
				
				<view class="cart-footer">
					<view class="total-info">
						<text class="total-label">合计:</text>
						<text class="total-price">¥{{cartStore.getTotalPrice()}}</text>
					</view>
					<button class="checkout-btn" @tap="submitOrder">去结算</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import userStore from '@/store/user.js'
	import cartStore from '@/store/cart.js'

	export default {
		data() {
			return {
				currentCategory: 0,
				categories: [
					{ name: '热菜' },
					{ name: '凉菜' },
					{ name: '主食' },
					{ name: '饮品' }
				],
				dishes: [
					{
						id: 1,
						category: 0,
						name: '宫保鸡丁',
						price: 28,
						image: '/static/product/goods1.png'
					},
					{
						id: 2,
						category: 0,
						name: '麻婆豆腐',
						price: 22,
						image: '/static/product/goods2.png'
					},
					{
						id: 3,
						category: 1,
						name: '凉拌黄瓜',
						price: 12,
						image: '/static/product/goods1.png'
					},
					{
						id: 4,
						category: 2,
						name: '米饭',
						price: 2,
						image: '/static/product/goods2.png'
					}
				],
				cartStore,
				showCart: false
			}
		},
		computed: {
			currentDishes() {
				return this.dishes.filter(dish => dish.category === this.currentCategory)
			}
		},
		methods: {
			selectCategory(index) {
				this.currentCategory = index
			},
			goToDetail(dish) {
				uni.navigateTo({
					url: `/pages/dish-detail/dish-detail?id=${dish.id}`
				})
			},
			addToCart(dish) {
				if (!userStore.state.currentUser) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				console.log('添加到购物车:', dish)
				
				cartStore.addItem(dish)
				uni.showToast({
					title: '已加入购物车',
					icon: 'success'
				})
			},
			submitOrder() {
				if (cartStore.state.items.length === 0) return
				
				const order = {
					id: Date.now(),
					items: [...cartStore.state.items],
					userId: userStore.state.currentUser.id,
					status: '待处理',
					createTime: new Date().toLocaleString(),
					totalPrice: cartStore.getTotalPrice()
				}
				
				userStore.addOrder(order)
				cartStore.clear()
			},
			showCartDetail() {
				this.showCart = true
			},
			hideCartDetail() {
				this.showCart = false
			},
			clearCart() {
				uni.showModal({
					title: '提示',
					content: '确定要清空购物车吗？',
					success: (res) => {
						if (res.confirm) {
							cartStore.clear()
							this.hideCartDetail()
						}
					}
				})
			},
			increaseQuantity(item) {
				cartStore.addItem(item.dish)
			},
			decreaseQuantity(item) {
				cartStore.removeItem(item.dish.id)
			}
		}
	}
</script>

<style>
	.container {
		display: flex;
		height: 100vh;
		background-color: #f8f8f8;
	}

	.category-list {
		width: 200rpx;
		background-color: #fff;
		height: 100%;
		box-shadow: 2rpx 0 10rpx rgba(0,0,0,0.05);
	}

	.category-item {
		padding: 40rpx 20rpx;
		text-align: center;
		position: relative;
		font-size: 28rpx;
	}

	.category-item.active {
		background-color: #f8f8f8;
		color: #f6c33d;
		font-weight: bold;
	}
	
	.category-item.active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 8rpx;
		height: 32rpx;
		background-color: #f6c33d;
		border-radius: 0 4rpx 4rpx 0;
	}

	.dish-list {
		flex: 1;
		padding: 30rpx;
		padding-bottom: calc(100rpx + env(safe-area-inset-bottom)); /* 为购物车状态栏留出空间 */
	}

	.dish-item {
		display: flex;
		padding: 30rpx;
		background-color: #fff;
		margin-bottom: 30rpx;
		border-radius: 16rpx;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.05);
	}

	.dish-image {
		width: 180rpx;
		height: 180rpx;
		border-radius: 12rpx;
	}

	.dish-info {
		flex: 1;
		padding-left: 30rpx;
		position: relative;
	}

	.dish-name {
		font-size: 32rpx;
		font-weight: bold;
		margin-top: 10rpx;
	}

	.dish-price {
		font-size: 36rpx;
		color: #ff5500;
		margin-top: 20rpx;
		font-weight: bold;
	}
	
	.dish-price::before {
		content: '¥';
		font-size: 24rpx;
		margin-right: 4rpx;
	}

	.add-btn {
		position: absolute;
		right: 0;
		bottom: 0;
		width: 70rpx;
		height: 70rpx;
		line-height: 70rpx;
		text-align: center;
		background-color: #f6c33d;
		color: #fff;
		border-radius: 50%;
		padding: 0;
		font-size: 40rpx;
		font-weight: bold;
		box-shadow: 0 4rpx 8rpx rgba(246,195,61,0.3);
	}

	.cart-bar {
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
		z-index: 100;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.cart-preview {
		flex: 1;
		display: flex;
		align-items: center;
		padding: 20rpx;
	}

	.cart-icon {
		position: relative;
		margin-right: 20rpx;
		width: 60rpx;
		height: 60rpx;
	}

	.cart-icon image {
		width: 60rpx;
		height: 60rpx;
	}

	.cart-badge {
		position: absolute;
		top: -10rpx;
		right: -10rpx;
		background-color: #ff5500;
		color: #fff;
		font-size: 24rpx;
		padding: 4rpx 12rpx;
		border-radius: 20rpx;
		min-width: 32rpx;
		text-align: center;
	}

	.cart-info {
		flex: 1;
	}

	.cart-count {
		font-size: 28rpx;
		color: #333;
		margin-right: 20rpx;
	}

	.cart-total {
		font-size: 36rpx;
		color: #ff5500;
		font-weight: bold;
	}

	.submit-btn {
		width: 200rpx;
		height: 80rpx;
		line-height: 80rpx;
		background-color: #f6c33d;
		color: #fff;
		border-radius: 40rpx;
		font-size: 32rpx;
	}

	.cart-popup {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 999;
	}

	.cart-mask {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0,0,0,0.5);
	}

	.cart-content {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #fff;
		border-radius: 24rpx 24rpx 0 0;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.cart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #eee;
	}

	.cart-title {
		font-size: 32rpx;
		font-weight: bold;
	}

	.clear-btn {
		font-size: 28rpx;
		color: #999;
	}

	.cart-list {
		max-height: 60vh;
		padding: 0 30rpx;
	}

	.cart-item {
		display: flex;
		align-items: center;
		padding: 30rpx 0;
		border-bottom: 1rpx solid #eee;
	}

	.item-image {
		width: 120rpx;
		height: 120rpx;
		border-radius: 12rpx;
	}

	.item-info {
		flex: 1;
		margin: 0 30rpx;
	}

	.item-name {
		font-size: 28rpx;
		font-weight: bold;
	}

	.item-price {
		font-size: 32rpx;
		color: #ff5500;
		margin-top: 10rpx;
	}

	.item-controls {
		display: flex;
		align-items: center;
	}

	.control-btn {
		width: 60rpx;
		height: 60rpx;
		line-height: 60rpx;
		text-align: center;
		background-color: #f8f8f8;
		border-radius: 30rpx;
		font-size: 36rpx;
	}

	.quantity {
		margin: 0 20rpx;
		font-size: 28rpx;
	}

	.cart-footer {
		padding: 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-top: 1rpx solid #eee;
	}

	.total-info {
		flex: 1;
	}

	.total-label {
		font-size: 28rpx;
		color: #666;
	}

	.total-price {
		font-size: 36rpx;
		color: #ff5500;
		font-weight: bold;
		margin-left: 10rpx;
	}

	.checkout-btn {
		width: 240rpx;
		height: 80rpx;
		line-height: 80rpx;
		background-color: #f6c33d;
		color: #fff;
		border-radius: 40rpx;
		font-size: 32rpx;
		margin-left: 30rpx;
	}
</style>
