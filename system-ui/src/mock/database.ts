import { DB_STORAGE_KEY } from '@/constants'
import { createDefaultDatabase } from '@/mock/seed'
import type { DatabaseState } from '@/types/models'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function loadDatabase(): DatabaseState {
  const raw = localStorage.getItem(DB_STORAGE_KEY)
  if (!raw) {
    const init = createDefaultDatabase()
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(init))
    return clone(init)
  }

  try {
    const parsed = JSON.parse(raw) as DatabaseState
    return clone(parsed)
  } catch {
    const fallback = createDefaultDatabase()
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(fallback))
    return clone(fallback)
  }
}

export function saveDatabase(db: DatabaseState): void {
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db))
}

export function resetDatabase(): DatabaseState {
  const next = createDefaultDatabase()
  saveDatabase(next)
  return clone(next)
}
