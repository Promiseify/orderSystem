<template>
	<view class="container">
		<view class="header">
			<button class="add-btn" @tap="showAddForm">新增菜品</button>
		</view>
		
		<view class="dish-list">
			<view class="dish-item" v-for="(dish, index) in dishes" :key="dish.id">
				<image class="dish-image" :src="dish.image" mode="aspectFill"></image>
				<view class="dish-info">
					<text class="dish-name">{{dish.name}}</text>
					<text class="dish-price">¥{{dish.price}}</text>
					<text class="dish-category">{{categories[dish.category].name}}</text>
				</view>
				<view class="operations">
					<button class="op-btn edit" @tap="editDish(dish)">编辑</button>
					<button class="op-btn delete" @tap="deleteDish(dish)">删除</button>
				</view>
			</view>
		</view>
		
		<!-- 添加/编辑菜品弹窗 -->
		<view class="popup" v-if="showForm">
			<view class="popup-mask" @tap="closeForm"></view>
			<view class="popup-content">
				<view class="form-header">
					<text class="form-title">{{formType === 'add' ? '新增菜品' : '编辑菜品'}}</text>
					<text class="close-btn" @tap="closeForm">×</text>
				</view>
				
				<view class="form-body">
					<view class="form-item">
						<text class="label">菜品名称</text>
						<input type="text" v-model="formData.name" placeholder="请输入菜品名称" />
					</view>
					
					<view class="form-item">
						<text class="label">价格</text>
						<input type="digit" v-model="formData.price" placeholder="请输入价格" />
					</view>
					
					<view class="form-item">
						<text class="label">分类</text>
						<picker :range="categories" range-key="name" @change="onCategoryChange">
							<view class="picker">
								{{categories[formData.category].name}}
							</view>
						</picker>
					</view>
					
					<view class="form-item">
						<text class="label">图片</text>
						<view class="upload-box" @tap="chooseImage">
							<image v-if="formData.image" :src="formData.image" mode="aspectFill"></image>
							<text v-else class="upload-text">点击上传图片</text>
						</view>
					</view>
					
					<view class="form-item">
						<text class="label">描述</text>
						<textarea v-model="formData.description" placeholder="请输入菜品描述"></textarea>
					</view>
				</view>
				
				<view class="form-footer">
					<button class="submit-btn" @tap="submitForm">确定</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import userStore from '@/store/user.js'

export default {
	data() {
		return {
			categories: [
				{ name: '热菜' },
				{ name: '凉菜' },
				{ name: '主食' },
				{ name: '饮品' }
			],
			dishes: [
				{
					id: 1,
					name: '宫保鸡丁',
					price: 28,
					category: 0,
					image: '/static/product/goods2.png',
					description: '经典宫保鸡丁'
				}
			],
			showForm: false,
			formType: 'add', // add or edit
			formData: {
				name: '',
				price: '',
				category: 0,
				image: '',
				description: ''
			}
		}
	},
	onLoad() {
		// 检查权限
		if (!userStore.state.currentUser?.isAdmin) {
			uni.showToast({
				title: '无权限访问',
				icon: 'none'
			})
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		}
	},
	methods: {
		showAddForm() {
			this.formType = 'add'
			this.formData = {
				name: '',
				price: '',
				category: 0,
				image: '',
				description: ''
			}
			this.showForm = true
		},
		
		editDish(dish) {
			this.formType = 'edit'
			this.formData = {...dish}
			this.showForm = true
		},
		
		closeForm() {
			this.showForm = false
		},
		
		onCategoryChange(e) {
			this.formData.category = parseInt(e.detail.value)
		},
		
		chooseImage() {
			uni.chooseImage({
				count: 1,
				success: (res) => {
					this.formData.image = res.tempFilePaths[0]
				}
			})
		},
		
		submitForm() {
			if (!this.formData.name || !this.formData.price) {
				uni.showToast({
					title: '请填写完整信息',
					icon: 'none'
				})
				return
			}
			
			// 这里应该调用接口保存数据
			if (this.formType === 'add') {
				this.dishes.push({
					...this.formData,
					id: Date.now()
				})
			} else {
				const index = this.dishes.findIndex(d => d.id === this.formData.id)
				this.dishes[index] = {...this.formData}
			}
			
			uni.showToast({
				title: '保存成功',
				icon: 'success'
			})
			this.closeForm()
		},
		
		deleteDish(dish) {
			uni.showModal({
				title: '提示',
				content: '确定要删除该菜品吗？',
				success: (res) => {
					if (res.confirm) {
						const index = this.dishes.findIndex(d => d.id === dish.id)
						this.dishes.splice(index, 1)
						uni.showToast({
							title: '删除成功',
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
	padding: 20rpx;
}

.header {
	padding: 20rpx 0;
}

.add-btn {
	width: 200rpx;
	height: 80rpx;
	line-height: 80rpx;
	background-color: #f6c33d;
	color: #fff;
	font-size: 28rpx;
}

.dish-list {
	margin-top: 20rpx;
}

.dish-item {
	display: flex;
	padding: 20rpx;
	background-color: #fff;
	margin-bottom: 20rpx;
	border-radius: 10rpx;
}

.dish-image {
	width: 160rpx;
	height: 160rpx;
	border-radius: 8rpx;
}

.dish-info {
	flex: 1;
	padding: 0 20rpx;
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

.dish-category {
	font-size: 24rpx;
	color: #999;
	margin-top: 10rpx;
}

.operations {
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.op-btn {
	width: 120rpx;
	height: 60rpx;
	line-height: 60rpx;
	font-size: 24rpx;
	margin: 10rpx 0;
}

.op-btn.edit {
	background-color: #f6c33d;
	color: #fff;
}

.op-btn.delete {
	background-color: #ff5500;
	color: #fff;
}

.popup {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
}

.popup-mask {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0,0,0,0.5);
}

.popup-content {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #fff;
	border-radius: 20rpx 20rpx 0 0;
	padding: 30rpx;
}

.form-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.form-title {
	font-size: 32rpx;
	font-weight: bold;
}

.close-btn {
	font-size: 40rpx;
	color: #999;
}

.form-item {
	margin-bottom: 30rpx;
}

.label {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 10rpx;
}

input, .picker {
	width: 100%;
	height: 80rpx;
	border: 1rpx solid #eee;
	border-radius: 8rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
}

textarea {
	width: 100%;
	height: 200rpx;
	border: 1rpx solid #eee;
	border-radius: 8rpx;
	padding: 20rpx;
	font-size: 28rpx;
}

.upload-box {
	width: 200rpx;
	height: 200rpx;
	border: 1rpx dashed #ddd;
	border-radius: 8rpx;
	display: flex;
	justify-content: center;
	align-items: center;
}

.upload-box image {
	width: 100%;
	height: 100%;
	border-radius: 8rpx;
}

.upload-text {
	font-size: 24rpx;
	color: #999;
}

.submit-btn {
	width: 100%;
	height: 80rpx;
	line-height: 80rpx;
	background-color: #f6c33d;
	color: #fff;
	font-size: 28rpx;
	margin-top: 30rpx;
}
</style> 