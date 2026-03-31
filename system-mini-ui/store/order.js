function padNumber(value) {
	return String(value).padStart(2, '0')
}

function formatDate(date = new Date()) {
	return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())} ${padNumber(date.getHours())}:${padNumber(date.getMinutes())}:${padNumber(date.getSeconds())}`
}

function createOrderId() {
	return `OD${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
}

const STORAGE_KEY = 'order-system-orders'

export const ORDER_STATUS = {
	PENDING: 'pending',
	ACCEPTED: 'accepted',
	SERVING: 'serving',
	COMPLETED: 'completed'
}

const orderStatusMetaMap = {
	[ORDER_STATUS.PENDING]: {
		label: '待接单',
		description: '订单已提交成功，等待商家确认接单。'
	},
	[ORDER_STATUS.ACCEPTED]: {
		label: '已接单',
		description: '商家已接单，后厨正在准备菜品。'
	},
	[ORDER_STATUS.SERVING]: {
		label: '上菜中',
		description: '部分菜品已经做好，订单正在陆续上菜。'
	},
	[ORDER_STATUS.COMPLETED]: {
		label: '已完成',
		description: '订单中的菜品已经全部上齐，请及时取餐。'
	}
}

const orderStepDefinitions = Object.entries(orderStatusMetaMap).map(([status, meta]) => ({
	status,
	...meta
}))

function safeGetStorage(key) {
	if (typeof uni === 'undefined' || typeof uni.getStorageSync !== 'function') {
		return null
	}

	try {
		return uni.getStorageSync(key)
	} catch (error) {
		return null
	}
}

function safeSetStorage(key, value) {
	if (typeof uni === 'undefined' || typeof uni.setStorageSync !== 'function') {
		return
	}

	try {
		uni.setStorageSync(key, value)
	} catch (error) {
		return
	}
}

function normalizeLog(log, fallback = {}) {
	return {
		id: log?.id || fallback.id || `log-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
		type: log?.type || fallback.type || 'update',
		operatorId: log?.operatorId || fallback.operatorId || '',
		operatorName: log?.operatorName || fallback.operatorName || '系统',
		time: log?.time || fallback.time || formatDate(),
		content: log?.content || fallback.content || ''
	}
}

function normalizeOrderItem(item) {
	return {
		dishId: item?.dishId || '',
		nameSnapshot: item?.nameSnapshot || '',
		priceSnapshot: Number(item?.priceSnapshot || 0),
		imageSnapshot: item?.imageSnapshot || '/static/product/goods1.png',
		quantity: Math.max(0, Number(item?.quantity || 0)),
		servedQuantity: Math.max(0, Number(item?.servedQuantity || 0))
	}
}

function normalizeOrder(order) {
	const items = Array.isArray(order?.items) ? order.items.map(normalizeOrderItem) : []
	const logs = Array.isArray(order?.logs) ? order.logs.map(log => normalizeLog(log)) : []
	const totalPrice = Number(order?.totalPrice || items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0))

	return {
		id: order?.id || createOrderId(),
		userId: order?.userId || '',
		userName: order?.userName || '',
		status: order?.status || ORDER_STATUS.PENDING,
		createTime: order?.createTime || formatDate(),
		totalPrice,
		items,
		logs
	}
}

function cloneOrder(order) {
	const normalizedOrder = normalizeOrder(order)
	return {
		...normalizedOrder,
		items: normalizedOrder.items.map(item => ({ ...item })),
		logs: normalizedOrder.logs.map(log => ({ ...log }))
	}
}

function cloneStep(step) {
	return { ...step }
}

function createLog(type, operator, content) {
	return normalizeLog({
		type,
		operatorId: operator?.id || '',
		operatorName: operator?.nickname || '系统',
		time: formatDate(),
		content
	})
}

function loadOrders() {
	const stored = safeGetStorage(STORAGE_KEY)
	if (!Array.isArray(stored)) {
		return []
	}

	return stored.map(order => normalizeOrder(order))
}

function getStatusMeta(status) {
	return orderStatusMetaMap[status] || {
		label: '未知状态',
		description: '当前订单状态暂无说明。'
	}
}

const orderStore = {
	state: {
		orders: []
	},

	init() {
		this.state.orders = loadOrders()
	},

	persistOrders() {
		safeSetStorage(STORAGE_KEY, this.state.orders.map(order => cloneOrder(order)))
	},

	appendLog(order, type, operator, content) {
		order.logs = Array.isArray(order.logs) ? order.logs : []
		order.logs.unshift(createLog(type, operator, content))
	},

	validateCartItems(cartItems, options = {}) {
		const getDishById = typeof options.getDishById === 'function' ? options.getDishById : null
		const isOnShelf = typeof options.isOnShelf === 'function' ? options.isOnShelf : null
		if (!getDishById || !isOnShelf || !Array.isArray(cartItems)) {
			return []
		}

		const invalidNames = cartItems.reduce((names, item) => {
			const latestDish = getDishById(item?.dish?.id)
			if (!latestDish || !isOnShelf(latestDish)) {
				names.push(item?.dish?.name || '未知菜品')
			}
			return names
		}, [])

		return [...new Set(invalidNames)]
	},

	createOrder(cartItems, user) {
		if (!user || !Array.isArray(cartItems) || cartItems.length === 0) {
			return null
		}

		const items = cartItems.map(item => ({
			dishId: item.dish.id,
			nameSnapshot: item.dish.name,
			priceSnapshot: Number(item.dish.price),
			imageSnapshot: item.dish.image,
			quantity: Number(item.quantity),
			servedQuantity: 0
		}))

		const totalPrice = items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0)
		const order = normalizeOrder({
			id: createOrderId(),
			userId: user.id,
			userName: user.nickname,
			status: ORDER_STATUS.PENDING,
			createTime: formatDate(),
			totalPrice,
			items,
			logs: []
		})

		this.appendLog(order, 'create', user, '下单成功，等待商家接单')
		this.state.orders.unshift(order)
		this.persistOrders()
		return cloneOrder(order)
	},

	getAllOrders() {
		return this.state.orders.map(cloneOrder)
	},

	getOrdersByUser(userId) {
		return this.state.orders
			.filter(order => order.userId === userId)
			.map(cloneOrder)
	},

	getStatusLabel(status) {
		return getStatusMeta(status).label
	},

	getStatusDescription(status) {
		return getStatusMeta(status).description
	},

	getStepDefinitions() {
		return orderStepDefinitions.map(cloneStep)
	},

	getOrderSteps(order) {
		const currentIndex = orderStepDefinitions.findIndex(step => step.status === order?.status)
		return orderStepDefinitions.map((step, index) => ({
			...step,
			completed: currentIndex > index,
			active: currentIndex === index,
			pending: currentIndex < index
		}))
	},

	canAccept(order) {
		return order?.status === ORDER_STATUS.PENDING
	},

	canServe(order, item) {
		return [ORDER_STATUS.ACCEPTED, ORDER_STATUS.SERVING].includes(order?.status) && item?.servedQuantity < item?.quantity
	},

	getOrderProgress(order) {
		const totalDishCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
		const servedDishCount = order.items.reduce((sum, item) => sum + item.servedQuantity, 0)
		const completedItemCount = order.items.filter(item => item.servedQuantity >= item.quantity).length
		const allServed = totalDishCount > 0 && servedDishCount >= totalDishCount
		const percent = totalDishCount ? Math.min(100, Math.round((servedDishCount / totalDishCount) * 100)) : 0
		const latestLog = Array.isArray(order.logs) && order.logs.length ? { ...order.logs[0] } : null

		return {
			totalDishCount,
			servedDishCount,
			completedItemCount,
			totalItemCount: order.items.length,
			allServed,
			percent,
			latestLog,
			text: totalDishCount === 0 ? '暂无菜品' : `已上 ${servedDishCount}/${totalDishCount} 份`,
			description: latestLog?.content || this.getStatusLabel(order.status)
		}
	},

	acceptOrder(orderId, operator = null) {
		const order = this.state.orders.find(item => String(item.id) === String(orderId))
		if (!order || !this.canAccept(order)) {
			return null
		}

		order.status = ORDER_STATUS.ACCEPTED
		this.appendLog(order, 'accept', operator, '订单已接单，后厨开始准备')
		this.persistOrders()
		return cloneOrder(order)
	},

	serveItem(orderId, dishId, operator = null) {
		const order = this.state.orders.find(item => String(item.id) === String(orderId))
		const item = order?.items.find(orderItem => String(orderItem.dishId) === String(dishId))
		if (!order || !item || !this.canServe(order, item)) {
			return order ? cloneOrder(order) : null
		}

		item.servedQuantity += 1
		this.appendLog(order, 'serve', operator, `${item.nameSnapshot} 已上 ${item.servedQuantity}/${item.quantity} 份`)
		return this.recalcOrderStatus(orderId, operator)
	},

	recalcOrderStatus(orderId, operator = null) {
		const order = this.state.orders.find(item => String(item.id) === String(orderId))
		if (!order) {
			return null
		}

		const previousStatus = order.status
		const { totalDishCount, servedDishCount } = this.getOrderProgress(order)

		if (totalDishCount > 0 && servedDishCount >= totalDishCount) {
			order.status = ORDER_STATUS.COMPLETED
		} else if (servedDishCount > 0) {
			order.status = ORDER_STATUS.SERVING
		} else if (previousStatus !== ORDER_STATUS.PENDING) {
			order.status = ORDER_STATUS.ACCEPTED
		}

		if (order.status !== previousStatus) {
			const statusContentMap = {
				[ORDER_STATUS.ACCEPTED]: '订单已接单，等待上菜',
				[ORDER_STATUS.SERVING]: '订单进入上菜中',
				[ORDER_STATUS.COMPLETED]: '订单已完成，请顾客及时取餐'
			}
			this.appendLog(order, 'status', operator, statusContentMap[order.status] || `订单状态更新为${this.getStatusLabel(order.status)}`)
		}

		this.persistOrders()
		return cloneOrder(order)
	}
}

orderStore.init()

export default orderStore
