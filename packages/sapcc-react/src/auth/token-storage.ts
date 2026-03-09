import type { TokenData, TokenStorage } from './auth.types'

const STORAGE_KEY = 'sapcc_auth_token'

/**
 * Token storage backed by localStorage (browser environments).
 *
 * Serializes TokenData as JSON. Gracefully handles corrupted data by
 * returning null and clearing the invalid entry.
 */
export class LocalStorageTokenStorage implements TokenStorage {
  getToken(): TokenData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as TokenData
    } catch {
      // Corrupted data — clear it
      this.removeToken()
      return null
    }
  }

  setToken(token: TokenData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(token))
    } catch {
      // Storage full or unavailable — silent failure
    }
  }

  removeToken(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Storage unavailable — silent failure
    }
  }
}

/**
 * In-memory token storage for SSR and test environments.
 *
 * Tokens are not persisted across page loads. This is the correct
 * behavior for server-side rendering where localStorage is unavailable.
 */
export class InMemoryTokenStorage implements TokenStorage {
  private token: TokenData | null = null

  getToken(): TokenData | null {
    return this.token
  }

  setToken(token: TokenData): void {
    this.token = token
  }

  removeToken(): void {
    this.token = null
  }
}

/**
 * Detects whether localStorage is available in the current environment.
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__sapcc_storage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Creates the appropriate token storage adapter for the current environment.
 *
 * - Browser with localStorage available: `LocalStorageTokenStorage`
 * - SSR / Node.js / localStorage unavailable: `InMemoryTokenStorage`
 *
 * @returns A TokenStorage instance
 */
export function createTokenStorage(): TokenStorage {
  if (typeof window !== 'undefined' && isLocalStorageAvailable()) {
    return new LocalStorageTokenStorage()
  }
  return new InMemoryTokenStorage()
}
