export const DISH_STATUS = {
	ON: 'on',
	OFF: 'off'
}

const STORAGE_KEY = 'order-system-dishes'

const defaultCategories = [
	{ id: 1, name: '热菜' },
	{ id: 2, name: '凉菜' },
	{ id: 3, name: '主食' },
	{ id: 4, name: '饮品' }
]

const defaultDishes = [
	{
		id: 'dish-1',
		categoryId: 1,
		name: '宫保鸡丁',
		price: 28,
		image: '/static/product/goods1.png',
		images: ['/static/product/goods1.png', '/static/product/goods2.png'],
		description: '经典川味热菜，鸡丁鲜嫩，花生香脆，酸甜微辣。',
		sales: 128,
		status: DISH_STATUS.ON
	},
	{
		id: 'dish-2',
		categoryId: 1,
		name: '麻婆豆腐',
		price: 22,
		image: '/static/product/goods2.png',
		images: ['/static/product/goods2.png', '/static/product/goods1.png'],
		description: '豆腐滑嫩入味，麻辣开胃，适合配饭。',
		sales: 96,
		status: DISH_STATUS.ON
	},
	{
		id: 'dish-3',
		categoryId: 2,
		name: '凉拌黄瓜',
		price: 12,
		image: '/static/product/goods1.png',
		images: ['/static/product/goods1.png'],
		description: '清爽解腻，蒜香十足，适合搭配热菜。',
		sales: 75,
		status: DISH_STATUS.ON
	},
	{
		id: 'dish-4',
		categoryId: 2,
		name: '口水鸡',
		price: 26,
		image: '/static/product/goods2.png',
		images: ['/static/product/goods2.png'],
		description: '鸡肉嫩滑，酱汁香辣，适合作为餐前凉菜。',
		sales: 81,
		status: DISH_STATUS.ON
	},
	{
		id: 'dish-5',
		categoryId: 3,
		name: '米饭',
		price: 2,
		image: '/static/product/goods1.png',
		images: ['/static/product/goods1.png'],
		description: '现蒸米饭，颗粒分明。',
		sales: 220,
		status: DISH_STATUS.ON
	},
	{
		id: 'dish-6',
		categoryId: 4,
		name: '酸梅汤',
		price: 8,
		image: '/static/product/goods2.png',
		images: ['/static/product/goods2.png'],
		description: '冰爽解辣，酸甜适口。',
		sales: 64,
		status: DISH_STATUS.OFF
	}
]

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

function cloneCategory(category) {
	return { ...category }
}

function normalizeDish(data, currentDish = {}) {
	const image = data.image || currentDish.image || '/static/product/goods1.png'
	const images = Array.isArray(data.images) && data.images.length
		? data.images.filter(Boolean)
		: Array.isArray(currentDish.images) && currentDish.images.length
			? currentDish.images.filter(Boolean)
			: [image]

	return {
		id: data.id || currentDish.id || `dish-${Date.now()}`,
		categoryId: Number(data.categoryId ?? currentDish.categoryId ?? defaultCategories[0].id),
		name: String(data.name ?? currentDish.name ?? '').trim(),
		price: Number(data.price ?? currentDish.price ?? 0),
		image: image || images[0] || '/static/product/goods1.png',
		images: images.length ? images : [image || '/static/product/goods1.png'],
		description: String(data.description ?? currentDish.description ?? '').trim(),
		sales: Number(data.sales ?? currentDish.sales ?? 0),
		status: data.status || currentDish.status || DISH_STATUS.ON
	}
}

function cloneDish(dish) {
	const normalizedDish = normalizeDish(dish)
	return {
		...normalizedDish,
		images: [...normalizedDish.images]
	}
}

function loadDishes() {
	const stored = safeGetStorage(STORAGE_KEY)
	if (!Array.isArray(stored) || !stored.length) {
		return defaultDishes.map(cloneDish)
	}

	return stored.map(dish => cloneDish(dish))
}

const dishStore = {
	state: {
		categories: defaultCategories.map(cloneCategory),
		dishes: []
	},

	init() {
		this.state.dishes = loadDishes()
	},

	persistDishes() {
		safeSetStorage(STORAGE_KEY, this.state.dishes.map(cloneDish))
	},

	getCategories() {
		return this.state.categories.map(cloneCategory)
	},

	getCategoryById(categoryId) {
		const category = this.state.categories.find(item => item.id === Number(categoryId))
		return category ? cloneCategory(category) : null
	},

	getDishList(includeOffShelf = false) {
		return this.state.dishes
			.filter(dish => includeOffShelf || this.isOnShelf(dish))
			.map(cloneDish)
	},

	getDishById(id) {
		const dish = this.state.dishes.find(item => String(item.id) === String(id))
		return dish ? cloneDish(dish) : null
	},

	isOnShelf(dish) {
		return dish?.status === DISH_STATUS.ON
	},

	addDish(data) {
		const dish = normalizeDish(data)
		this.state.dishes.unshift(dish)
		this.persistDishes()
		return cloneDish(dish)
	},

	updateDish(data) {
		const index = this.state.dishes.findIndex(item => String(item.id) === String(data.id))
		if (index === -1) {
			return null
		}

		const updatedDish = normalizeDish(data, this.state.dishes[index])
		this.state.dishes.splice(index, 1, updatedDish)
		this.persistDishes()
		return cloneDish(updatedDish)
	},

	toggleDishStatus(id) {
		const dish = this.state.dishes.find(item => String(item.id) === String(id))
		if (!dish) {
			return null
		}

		dish.status = this.isOnShelf(dish) ? DISH_STATUS.OFF : DISH_STATUS.ON
		this.persistDishes()
		return cloneDish(dish)
	}
}

dishStore.init()

export default dishStore
