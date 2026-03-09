import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  LocalStorageCartStorage,
  InMemoryCartStorage,
  createCartStorage,
} from '../cart-storage'

// ---------------------------------------------------------------------------
// LocalStorageCartStorage
// ---------------------------------------------------------------------------

describe('LocalStorageCartStorage', () => {
  let storage: LocalStorageCartStorage

  beforeEach(() => {
    localStorage.clear()
    storage = new LocalStorageCartStorage()
  })

  it('returns null when no GUID is stored', () => {
    expect(storage.getCartGuid()).toBeNull()
  })

  it('stores and retrieves a cart GUID', () => {
    storage.setCartGuid('test-guid-123')
    expect(storage.getCartGuid()).toBe('test-guid-123')
  })

  it('removes a stored cart GUID', () => {
    storage.setCartGuid('test-guid-123')
    storage.removeCartGuid()
    expect(storage.getCartGuid()).toBeNull()
  })

  it('overwrites previous GUID on setCartGuid', () => {
    storage.setCartGuid('guid-1')
    storage.setCartGuid('guid-2')
    expect(storage.getCartGuid()).toBe('guid-2')
  })

  it('silently handles setCartGuid when localStorage is full', () => {
    const originalSetItem = localStorage.setItem.bind(localStorage)
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })

    expect(() => {
      storage.setCartGuid('test-guid')
    }).not.toThrow()

    vi.spyOn(localStorage, 'setItem').mockImplementation(originalSetItem)
  })

  it('silently handles getCartGuid when localStorage is unavailable', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError')
    })

    expect(storage.getCartGuid()).toBeNull()

    vi.restoreAllMocks()
  })

  it('silently handles removeCartGuid when localStorage is unavailable', () => {
    vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
      throw new DOMException('SecurityError')
    })

    expect(() => {
      storage.removeCartGuid()
    }).not.toThrow()

    vi.restoreAllMocks()
  })
})

// ---------------------------------------------------------------------------
// InMemoryCartStorage
// ---------------------------------------------------------------------------

describe('InMemoryCartStorage', () => {
  let storage: InMemoryCartStorage

  beforeEach(() => {
    storage = new InMemoryCartStorage()
  })

  it('returns null when no GUID is stored', () => {
    expect(storage.getCartGuid()).toBeNull()
  })

  it('stores and retrieves a cart GUID', () => {
    storage.setCartGuid('in-memory-guid')
    expect(storage.getCartGuid()).toBe('in-memory-guid')
  })

  it('removes a stored cart GUID', () => {
    storage.setCartGuid('in-memory-guid')
    storage.removeCartGuid()
    expect(storage.getCartGuid()).toBeNull()
  })

  it('does not share state between instances', () => {
    storage.setCartGuid('guid-1')

    const anotherStorage = new InMemoryCartStorage()
    expect(anotherStorage.getCartGuid()).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// createCartStorage factory
// ---------------------------------------------------------------------------

describe('createCartStorage', () => {
  it('returns LocalStorageCartStorage in browser environment', () => {
    // happy-dom provides window and localStorage, but may not pass the smoke test
    const canUseLocalStorage = (() => {
      try {
        const testKey = '__sapcc_cart_storage_test__'
        localStorage.setItem(testKey, 'test')
        localStorage.removeItem(testKey)
        return true
      } catch {
        return false
      }
    })()

    const storage = createCartStorage()
    if (canUseLocalStorage) {
      expect(storage).toBeInstanceOf(LocalStorageCartStorage)
    } else {
      // In environments where localStorage doesn't pass the smoke test,
      // InMemory is the correct fallback
      expect(storage).toBeInstanceOf(InMemoryCartStorage)
    }
  })

  it('returns InMemoryCartStorage when localStorage is unavailable', () => {
    const originalSetItem = localStorage.setItem.bind(localStorage)
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('SecurityError')
    })

    const storage = createCartStorage()
    expect(storage).toBeInstanceOf(InMemoryCartStorage)

    vi.spyOn(localStorage, 'setItem').mockImplementation(originalSetItem)
  })
})
