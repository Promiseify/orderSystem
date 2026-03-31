import userStore from '@/store/user.js'

const STORAGE_KEY = 'order-system-cart-map'

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

function loadCartMap() {
	const raw = safeGetStorage(STORAGE_KEY)
	return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
}

function normalizeDish(dish) {
	if (!dish) {
		return null
	}

	const images = Array.isArray(dish.images) && dish.images.length
		? dish.images.filter(Boolean)
		: dish.image
			? [dish.image]
			: ['/static/product/goods1.png']

	return {
		...dish,
		image: dish.image || images[0],
		images
	}
}

function cloneDish(dish) {
	const normalizedDish = normalizeDish(dish)
	return normalizedDish ? {
		...normalizedDish,
		images: [...normalizedDish.images]
	} : null
}

function normalizeCartItem(item) {
	if (!item?.dish) {
		return null
	}

	const quantity = Math.max(1, Number(item.quantity) || 1)
	const dish = cloneDish(item.dish)
	if (!dish) {
		return null
	}

	return {
		dish,
		quantity
	}
}

function cloneCartItem(item) {
	return {
		dish: cloneDish(item.dish),
		quantity: item.quantity
	}
}

const cartStore = {
	state: {
		items: [],
		currentOwnerId: ''
	},

	ensureCurrentCartLoaded() {
		const currentUserId = userStore.getCurrentUserId()
		if (this.state.currentOwnerId === currentUserId) {
			return
		}

		this.state.currentOwnerId = currentUserId
		if (!currentUserId) {
			this.state.items = []
			return
		}

		const cartMap = loadCartMap()
		const userCart = Array.isArray(cartMap[currentUserId]) ? cartMap[currentUserId] : []
		this.state.items = userCart.map(normalizeCartItem).filter(Boolean)
	},

	persistCurrentCart() {
		const currentUserId = this.state.currentOwnerId
		if (!currentUserId) {
			return
		}

		const cartMap = loadCartMap()
		if (this.state.items.length) {
			cartMap[currentUserId] = this.state.items.map(cloneCartItem)
		} else {
			delete cartMap[currentUserId]
		}

		safeSetStorage(STORAGE_KEY, cartMap)
	},

	addItem(dish) {
		this.ensureCurrentCartLoaded()
		if (!this.state.currentOwnerId) {
			return false
		}

		const normalizedDish = cloneDish(dish)
		if (!normalizedDish) {
			return false
		}

		const existItem = this.state.items.find(item => String(item.dish.id) === String(normalizedDish.id))
		if (existItem) {
			existItem.quantity += 1
			this.persistCurrentCart()
			return true
		}

		this.state.items.push({
			dish: normalizedDish,
			quantity: 1
		})
		this.persistCurrentCart()
		return true
	},

	tryAddItem(dish) {
		if (!userStore.isLoggedIn()) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			})
			return false
		}

		const added = this.addItem(dish)
		if (!added) {
			return false
		}

		uni.showToast({
			title: '已加入购物车',
			icon: 'success'
		})
		return true
	},

	removeItem(dishId) {
		this.ensureCurrentCartLoaded()
		const index = this.state.items.findIndex(item => String(item.dish.id) === String(dishId))
		if (index === -1) {
			return
		}

		const item = this.state.items[index]
		if (item.quantity > 1) {
			item.quantity -= 1
			this.persistCurrentCart()
			return
		}

		this.state.items.splice(index, 1)
		this.persistCurrentCart()
	},

	clear() {
		this.ensureCurrentCartLoaded()
		this.state.items = []
		this.persistCurrentCart()
	},

	hasItems() {
		this.ensureCurrentCartLoaded()
		return this.state.items.length > 0
	},

	getItems() {
		this.ensureCurrentCartLoaded()
		return this.state.items.map(cloneCartItem)
	},

	getTotalQuantity() {
		this.ensureCurrentCartLoaded()
		return this.state.items.reduce((sum, item) => sum + item.quantity, 0)
	},

	getTotalPrice() {
		this.ensureCurrentCartLoaded()
		return this.state.items.reduce((sum, item) => sum + Number(item.dish.price) * item.quantity, 0)
	}
}

export default cartStore
