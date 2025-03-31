// 模拟用户数据
const users = {
	admin: {
		id: 'admin',
		nickname: '店长',
		avatar: '/static/avatar.png',
		isAdmin: true
	},
	user: {
		id: 'user',
		nickname: '张三',
		avatar: '/static/avatar.png',
		isAdmin: false
	}
}

// 用户状态管理
export default {
	state: {
		currentUser: null,
		orders: [] // 存储订单
	},
	
	login(userId) {
		this.state.currentUser = users[userId]
		return this.state.currentUser
	},
	
	logout() {
		this.state.currentUser = null
	},
	
	// 添加订单
	addOrder(order) {
		this.state.orders.unshift(order)
		// 如果是普通用户下单，通知管理员
		if (!this.state.currentUser.isAdmin) {
			uni.showToast({
				title: '下单成功',
				icon: 'success'
			})
			// 这里可以调用后端接口通知管理员
			console.log('新订单通知:', order)
		}
	},
	
	// 获取订单列表
	getOrders() {
		return this.state.orders
	}
} 