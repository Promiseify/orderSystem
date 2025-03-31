export default {
	state: {
		items: [], // 购物车商品
		visible: false // 购物车状态栏显示状态
	},
	
	// 添加到购物车
	addItem(dish) {
		console.log('购物车添加商品:', dish)
		const existItem = this.state.items.find(item => item.dish.id === dish.id)
		if (existItem) {
			existItem.quantity++
		} else {
			this.state.items.push({
				dish,
				quantity: 1
			})
		}
		console.log('当前购物车:', this.state.items)
	},
	
	// 从购物车移除
	removeItem(dishId) {
		const index = this.state.items.findIndex(item => item.dish.id === dishId)
		if (index > -1) {
			const item = this.state.items[index]
			if (item.quantity > 1) {
				item.quantity--
			} else {
				this.state.items.splice(index, 1)
			}
		}
	},
	
	// 清空购物车
	clear() {
		this.state.items = []
	},
	
	// 获取总数量
	getTotalQuantity() {
		return this.state.items.reduce((sum, item) => sum + item.quantity, 0)
	},
	
	// 获取总价格
	getTotalPrice() {
		return this.state.items.reduce((sum, item) => sum + item.dish.price * item.quantity, 0)
	}
} 