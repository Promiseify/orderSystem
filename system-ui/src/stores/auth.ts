import { defineStore } from 'pinia'
import { ROLE_MENU_SCOPE, ROLE_LABEL_MAP, SESSION_STORAGE_KEY } from '@/constants'
import { fetchProfile, loginByPassword, logoutRequest } from '@/api/auth'
import { getAccessToken, setAccessToken } from '@/api/http'
import { extractErrorMessage } from '@/utils/error'
import type { LoginPayload, RoleCode, SessionUser } from '@/types/models'

const PERMISSION_ROLE_MAP: Record<string, RoleCode[]> = {
  'category:write': ['admin', 'manager'],
  'dish:write': ['admin', 'manager'],
  'dish:delete': ['admin', 'manager'],
  'order:operate': ['admin', 'manager', 'clerk'],
  'user:manage': ['admin'],
  'admin:manage': ['admin'],
  'setting:write': ['admin', 'manager'],
  'report:view': ['admin', 'manager']
}

function saveSession(user: SessionUser | null) {
  if (!user) {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    return
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
}

function loadSession(): SessionUser | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    sessionUser: loadSession() as SessionUser | null,
    token: getAccessToken()
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.sessionUser && state.token),
    role: (state) => state.sessionUser?.role,
    roleLabel: (state) => (state.sessionUser ? ROLE_LABEL_MAP[state.sessionUser.role] : ''),
    allowMenus: (state) => (state.sessionUser ? ROLE_MENU_SCOPE[state.sessionUser.role] : [])
  },
  actions: {
    async bootstrap() {
      this.token = getAccessToken()
      if (!this.token) {
        this.logout()
        return
      }
      if (this.sessionUser) {
        return
      }
      try {
        const profile = await fetchProfile()
        this.sessionUser = profile
        saveSession(profile)
      } catch {
        this.logout()
      }
    },
    async login(payload: LoginPayload): Promise<{ ok: boolean; message: string }> {
      try {
        const result = await loginByPassword(payload)
        this.token = result.token
        this.sessionUser = result.user
        setAccessToken(result.token)
        saveSession(result.user)
        return { ok: true, message: '登录成功' }
      } catch (error) {
        return { ok: false, message: extractErrorMessage(error, '登录失败') }
      }
    },
    async logout() {
      try {
        if (this.token) {
          await logoutRequest()
        }
      } catch {
      } finally {
        this.sessionUser = null
        this.token = ''
        saveSession(null)
        setAccessToken('')
      }
    },
    can(permission: string): boolean {
      if (!this.sessionUser) {
        return false
      }
      const roles = PERMISSION_ROLE_MAP[permission]
      if (!roles) {
        return false
      }
      return roles.includes(this.sessionUser.role)
    },
    canVisit(menuKey: string): boolean {
      if (!this.sessionUser) {
        return false
      }
      return ROLE_MENU_SCOPE[this.sessionUser.role].includes(menuKey)
    }
  }
})
