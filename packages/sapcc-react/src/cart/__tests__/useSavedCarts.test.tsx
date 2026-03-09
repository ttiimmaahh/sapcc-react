import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, waitFor, cleanup, renderHook } from '@testing-library/react'
import { useAuth } from '../../auth/useAuth'
import { useSavedCarts } from '../useSavedCarts'
import { renderHookWithProviders } from '../../../test/test-utils'
import { resetCartState } from '../../../test/mocks/handlers/cart'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

describe('useSavedCarts', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCartState()
  })

  afterEach(() => {
    cleanup()
  })

  function useAuthWithSavedCarts() {
    const auth = useAuth()
    const savedCarts = useSavedCarts()
    return { auth, savedCarts }
  }

  it('throws when used outside SapccProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useSavedCarts())
    }).toThrow('useSavedCarts must be used within a <SapccProvider>')

    consoleSpy.mockRestore()
  })

  it('returns empty saved carts when not authenticated', async () => {
    const { result } = renderHookWithProviders(() => useSavedCarts(), {
      configOverrides: authConfig,
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
    })

    expect(result.current.savedCarts).toEqual([])
  })

  it('fetches saved carts when authenticated', async () => {
    const { result } = renderHookWithProviders(() => useAuthWithSavedCarts(), {
      configOverrides: authConfig,
    })

    // Login first
    await act(async () => {
      await result.current.auth.login({
        username: 'user@test.com',
        password: 'secret123',
      })
    })

    // Wait for saved carts query to resolve
    await waitFor(() => {
      expect(result.current.savedCarts.savedCarts.length).toBeGreaterThan(0)
    })

    expect(result.current.savedCarts.savedCarts).toHaveLength(2)
    expect(result.current.savedCarts.savedCarts[0]?.name).toBe('My Saved Cart')
  })

  describe('saveCart', () => {
    it('saves the current cart', async () => {
      const { result } = renderHookWithProviders(() => useAuthWithSavedCarts(), {
        configOverrides: authConfig,
      })

      await act(async () => {
        await result.current.auth.login({
          username: 'user@test.com',
          password: 'secret123',
        })
      })

      await act(async () => {
        const savedCart = await result.current.savedCarts.saveCart.mutateAsync({
          cartId: 'cart-001',
          saveCartName: 'My Wishlist',
          saveCartDescription: 'Items I want later',
        })

        expect(savedCart.name).toBe('My Wishlist')
      })

      expect(result.current.savedCarts.saveCart.isSuccess).toBe(true)
    })
  })

  describe('restoreCart', () => {
    it('restores a saved cart', async () => {
      const { result } = renderHookWithProviders(() => useAuthWithSavedCarts(), {
        configOverrides: authConfig,
      })

      await act(async () => {
        await result.current.auth.login({
          username: 'user@test.com',
          password: 'secret123',
        })
      })

      await act(async () => {
        const restored = await result.current.savedCarts.restoreCart.mutateAsync('saved-cart-001')
        expect(restored).toBeDefined()
        expect(restored.code).toBeDefined()
      })

      expect(result.current.savedCarts.restoreCart.isSuccess).toBe(true)
    })
  })

  describe('cloneCart', () => {
    it('clones a saved cart', async () => {
      const { result } = renderHookWithProviders(() => useAuthWithSavedCarts(), {
        configOverrides: authConfig,
      })

      await act(async () => {
        await result.current.auth.login({
          username: 'user@test.com',
          password: 'secret123',
        })
      })

      await act(async () => {
        const cloned = await result.current.savedCarts.cloneCart.mutateAsync('saved-cart-001')
        expect(cloned).toBeDefined()
      })

      expect(result.current.savedCarts.cloneCart.isSuccess).toBe(true)
    })
  })

  describe('deleteCart', () => {
    it('deletes a saved cart', async () => {
      const { result } = renderHookWithProviders(() => useAuthWithSavedCarts(), {
        configOverrides: authConfig,
      })

      await act(async () => {
        await result.current.auth.login({
          username: 'user@test.com',
          password: 'secret123',
        })
      })

      await act(async () => {
        await result.current.savedCarts.deleteCart.mutateAsync('saved-cart-001')
      })

      expect(result.current.savedCarts.deleteCart.isSuccess).toBe(true)
    })
  })
})
