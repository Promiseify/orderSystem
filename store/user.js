const STORAGE_KEY = 'order-system-current-user-id'

const users = {
	customer: {
		id: 'customer',
		nickname: '顾客小张',
		avatar: '/static/avatar.png',
		role: 'customer'
	},
	manager: {
		id: 'manager',
		nickname: '店长小李',
		avatar: '/static/avatar.png',
		role: 'manager'
	},
	admin: {
		id: 'admin',
		nickname: '管理员小王',
		avatar: '/static/avatar.png',
		role: 'admin'
	}
}

const roleLabelMap = {
	customer: '顾客',
	manager: '店长',
	admin: '管理员'
}

const managerRoles = ['manager', 'admin']

function cloneUser(user) {
	return user ? { ...user } : null
}

function getUserById(userId) {
	const user = users[userId]
	return user ? cloneUser(user) : null
}

function safeGetStorage(key) {
	if (typeof uni === 'undefined' || typeof uni.getStorageSync !== 'function') {
		return ''
	}

	try {
		return uni.getStorageSync(key)
	} catch (error) {
		return ''
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

function safeRemoveStorage(key) {
	if (typeof uni === 'undefined' || typeof uni.removeStorageSync !== 'function') {
		return
	}

	try {
		uni.removeStorageSync(key)
	} catch (error) {
		return
	}
}

const userStore = {
	state: {
		currentUser: null
	},

	init() {
		this.state.currentUser = getUserById(safeGetStorage(STORAGE_KEY))
	},

	persistCurrentUser() {
		const currentUserId = this.state.currentUser?.id || ''
		if (currentUserId) {
			safeSetStorage(STORAGE_KEY, currentUserId)
			return
		}

		safeRemoveStorage(STORAGE_KEY)
	},

	login(userId) {
		const user = getUserById(userId)
		if (!user) {
			return null
		}

		this.state.currentUser = user
		this.persistCurrentUser()
		return this.getCurrentUser()
	},

	logout() {
		this.state.currentUser = null
		this.persistCurrentUser()
	},

	isLoggedIn() {
		return !!this.state.currentUser
	},

	getCurrentUser() {
		return cloneUser(this.state.currentUser)
	},

	getCurrentUserId() {
		return this.state.currentUser?.id || ''
	},

	hasAnyRole(roles = []) {
		return roles.includes(this.state.currentUser?.role)
	},

	isCustomer() {
		return this.state.currentUser?.role === 'customer'
	},

	canManageOrders() {
		return this.hasAnyRole(managerRoles)
	},

	canManageDishes() {
		return this.canManageOrders()
	},

	getRoleLabel(role) {
		return roleLabelMap[role] || '未知身份'
	},

	getCurrentRoleLabel() {
		return this.getRoleLabel(this.getCurrentUser()?.role)
	},

	getDemoAccounts() {
		return Object.values(users).map(user => ({
			...cloneUser(user),
			roleLabel: this.getRoleLabel(user.role)
		}))
	}
}

userStore.init()

export default userStore
