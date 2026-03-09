import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  LocalStorageTokenStorage,
  InMemoryTokenStorage,
  createTokenStorage,
} from '../token-storage'
import { createTokenData } from '../../../test/mocks/fixtures/auth'

// ---------------------------------------------------------------------------
// LocalStorageTokenStorage
// ---------------------------------------------------------------------------

describe('LocalStorageTokenStorage', () => {
  let storage: LocalStorageTokenStorage

  beforeEach(() => {
    localStorage.clear()
    storage = new LocalStorageTokenStorage()
  })

  it('returns null when no token is stored', () => {
    expect(storage.getToken()).toBeNull()
  })

  it('stores and retrieves a token', () => {
    const token = createTokenData()
    storage.setToken(token)
    expect(storage.getToken()).toEqual(token)
  })

  it('removes a stored token', () => {
    const token = createTokenData()
    storage.setToken(token)
    storage.removeToken()
    expect(storage.getToken()).toBeNull()
  })

  it('returns null and clears storage for corrupted data', () => {
    localStorage.setItem('sapcc_auth_token', '{invalid json}}}')
    expect(storage.getToken()).toBeNull()
    // Storage should be cleared after reading corrupted data
    expect(localStorage.getItem('sapcc_auth_token')).toBeNull()
  })

  it('silently handles setToken when localStorage is full', () => {
    const originalSetItem = localStorage.setItem.bind(localStorage)
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })

    const token = createTokenData()
    expect(() => { storage.setToken(token) }).not.toThrow()

    vi.spyOn(localStorage, 'setItem').mockImplementation(originalSetItem)
  })

  it('silently handles removeToken when localStorage is unavailable', () => {
    vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
      throw new DOMException('SecurityError')
    })

    expect(() => { storage.removeToken() }).not.toThrow()

    vi.restoreAllMocks()
  })
})

// ---------------------------------------------------------------------------
// InMemoryTokenStorage
// ---------------------------------------------------------------------------

describe('InMemoryTokenStorage', () => {
  let storage: InMemoryTokenStorage

  beforeEach(() => {
    storage = new InMemoryTokenStorage()
  })

  it('returns null when no token is stored', () => {
    expect(storage.getToken()).toBeNull()
  })

  it('stores and retrieves a token', () => {
    const token = createTokenData()
    storage.setToken(token)
    expect(storage.getToken()).toEqual(token)
  })

  it('removes a stored token', () => {
    const token = createTokenData()
    storage.setToken(token)
    storage.removeToken()
    expect(storage.getToken()).toBeNull()
  })

  it('does not share state between instances', () => {
    const token = createTokenData()
    storage.setToken(token)

    const anotherStorage = new InMemoryTokenStorage()
    expect(anotherStorage.getToken()).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// createTokenStorage factory
// ---------------------------------------------------------------------------

describe('createTokenStorage', () => {
  it('returns LocalStorageTokenStorage in browser environment', () => {
    // happy-dom provides window and localStorage, but we need to verify
    // the detection function works. Directly test that the factory uses
    // localStorage when it can set/get items successfully.
    // happy-dom may not support the full localStorage API, so we test the logic.
    const canUseLocalStorage = (() => {
      try {
        const testKey = '__sapcc_storage_test__'
        localStorage.setItem(testKey, 'test')
        localStorage.removeItem(testKey)
        return true
      } catch {
        return false
      }
    })()

    const storage = createTokenStorage()
    if (canUseLocalStorage) {
      expect(storage).toBeInstanceOf(LocalStorageTokenStorage)
    } else {
      // In environments where localStorage doesn't pass the smoke test,
      // InMemory is the correct fallback
      expect(storage).toBeInstanceOf(InMemoryTokenStorage)
    }
  })

  it('returns InMemoryTokenStorage when localStorage is unavailable', () => {
    // Temporarily break localStorage
    const originalSetItem = localStorage.setItem.bind(localStorage)
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('SecurityError')
    })

    const storage = createTokenStorage()
    expect(storage).toBeInstanceOf(InMemoryTokenStorage)

    vi.spyOn(localStorage, 'setItem').mockImplementation(originalSetItem)
  })
})
