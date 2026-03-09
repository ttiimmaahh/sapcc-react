import type { CartStorage } from './cart.types'

const STORAGE_KEY = 'sapcc_cart_guid'

/**
 * CartStorage implementation using localStorage.
 * Persists the anonymous cart GUID across page reloads in the browser.
 */
export class LocalStorageCartStorage implements CartStorage {
  getCartGuid(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  }

  setCartGuid(guid: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, guid)
    } catch {
      // localStorage may be unavailable (private browsing, quota exceeded)
    }
  }

  removeCartGuid(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore errors
    }
  }
}

/**
 * CartStorage implementation using in-memory storage.
 * Used as a fallback for SSR environments where localStorage is not available.
 */
export class InMemoryCartStorage implements CartStorage {
  private guid: string | null = null

  getCartGuid(): string | null {
    return this.guid
  }

  setCartGuid(guid: string): void {
    this.guid = guid
  }

  removeCartGuid(): void {
    this.guid = null
  }
}

/**
 * Factory that creates the appropriate CartStorage implementation
 * based on the runtime environment.
 *
 * - Browser with working localStorage → LocalStorageCartStorage
 * - SSR or broken localStorage → InMemoryCartStorage
 */
export function createCartStorage(): CartStorage {
  // Detect if localStorage is available and functional
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const testKey = '__sapcc_cart_storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return new LocalStorageCartStorage()
    } catch {
      // localStorage exists but is non-functional
    }
  }
  return new InMemoryCartStorage()
}
