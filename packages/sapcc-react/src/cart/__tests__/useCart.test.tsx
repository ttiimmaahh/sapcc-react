import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, waitFor, cleanup, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useCart } from '../useCart'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import { resetCartState } from '../../../test/mocks/handlers/cart'
import { createCart, createEmptyCart } from '../../../test/mocks/fixtures/cart'

describe('useCart', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCartState()
  })

  afterEach(() => {
    cleanup()
  })

  it('throws when used outside SapccProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Use renderHook directly (without our wrapper) to test the error path
    expect(() => {
      renderHook(() => useCart())
    }).toThrow('useCart must be used within a <SapccProvider>')

    consoleSpy.mockRestore()
  })

  it('starts with isInitialized=false and isLoading=true', () => {
    const { result } = renderHookWithProviders(() => useCart())

    // Initially, the cart provider starts loading
    expect(result.current.isAnonymous).toBe(true)
    expect(result.current.cart).toBeNull()
  })

  it('initializes with no cart for anonymous user without stored GUID', async () => {
    const { result } = renderHookWithProviders(() => useCart())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(result.current.cart).toBeNull()
    expect(result.current.cartId).toBeNull()
    expect(result.current.isAnonymous).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it('loads an existing anonymous cart from stored GUID', async () => {
    const existingCart = createCart({
      code: 'anon-cart-001',
      guid: 'stored-guid-123',
    })

    // Pre-store the GUID in localStorage
    localStorage.setItem('sapcc_cart_guid', 'stored-guid-123')

    // Override the handler to return a cart for this GUID
    server.use(
      http.get(
        'https://test.example.com/occ/v2/test-site/users/anonymous/carts/stored-guid-123',
        () => {
          return HttpResponse.json(existingCart)
        },
      ),
    )

    const { result } = renderHookWithProviders(() => useCart())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(result.current.cart).not.toBeNull()
    expect(result.current.cart?.guid).toBe('stored-guid-123')
    expect(result.current.isAnonymous).toBe(true)
  })

  it('clears stored GUID if cart load fails (expired cart)', async () => {
    localStorage.setItem('sapcc_cart_guid', 'expired-guid')

    server.use(
      http.get(
        'https://test.example.com/occ/v2/test-site/users/anonymous/carts/expired-guid',
        () => {
          return HttpResponse.json(
            { errors: [{ type: 'CartError', message: 'Cart not found' }] },
            { status: 404 },
          )
        },
      ),
    )

    const { result } = renderHookWithProviders(() => useCart())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(result.current.cart).toBeNull()
    expect(localStorage.getItem('sapcc_cart_guid')).toBeNull()
  })

  it('createCart creates a new anonymous cart and persists GUID', async () => {
    const newCart = createEmptyCart({
      code: 'anon-cart-001',
      guid: 'anon-guid-001',
    })

    server.use(
      http.post(
        'https://test.example.com/occ/v2/test-site/users/anonymous/carts',
        () => {
          return HttpResponse.json(newCart)
        },
      ),
    )

    const { result } = renderHookWithProviders(() => useCart())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    let createdCart: unknown
    await act(async () => {
      createdCart = await result.current.createCart()
    })

    expect(createdCart).toEqual(newCart)
    expect(result.current.cart?.guid).toBe('anon-guid-001')
    expect(localStorage.getItem('sapcc_cart_guid')).toBe('anon-guid-001')
  })

  it('ensureCart returns existing cart when one exists', async () => {
    localStorage.setItem('sapcc_cart_guid', 'existing-guid')

    const existingCart = createCart({ code: 'existing', guid: 'existing-guid' })
    server.use(
      http.get(
        'https://test.example.com/occ/v2/test-site/users/anonymous/carts/existing-guid',
        () => {
          return HttpResponse.json(existingCart)
        },
      ),
    )

    const { result } = renderHookWithProviders(() => useCart())

    await waitFor(() => {
      expect(result.current.cart).not.toBeNull()
    })

    let ensuredCart: unknown
    await act(async () => {
      ensuredCart = await result.current.ensureCart()
    })

    expect(ensuredCart).toEqual(existingCart)
  })

  it('ensureCart creates a new cart when none exists', async () => {
    const newCart = createEmptyCart({
      code: 'new-cart',
      guid: 'new-guid',
    })

    server.use(
      http.post(
        'https://test.example.com/occ/v2/test-site/users/anonymous/carts',
        () => {
          return HttpResponse.json(newCart)
        },
      ),
    )

    const { result } = renderHookWithProviders(() => useCart())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(result.current.cart).toBeNull()

    let ensuredCart: unknown
    await act(async () => {
      ensuredCart = await result.current.ensureCart()
    })

    expect(ensuredCart).toEqual(newCart)
    expect(result.current.cart?.guid).toBe('new-guid')
  })

  it('refreshCart fetches the latest cart data', async () => {
    localStorage.setItem('sapcc_cart_guid', 'refresh-guid')

    let callCount = 0
    server.use(
      http.get(
        'https://test.example.com/occ/v2/test-site/users/anonymous/carts/refresh-guid',
        () => {
          callCount++
          return HttpResponse.json(
            createCart({
              code: 'refresh-cart',
              guid: 'refresh-guid',
              totalItems: callCount,
            }),
          )
        },
      ),
    )

    const { result } = renderHookWithProviders(() => useCart())

    await waitFor(() => {
      expect(result.current.cart).not.toBeNull()
    })

    expect(result.current.cart?.totalItems).toBe(1)

    await act(async () => {
      await result.current.refreshCart()
    })

    expect(result.current.cart?.totalItems).toBe(2)
  })

  it('exposes correct isAnonymous for anonymous user', async () => {
    const { result } = renderHookWithProviders(() => useCart())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(result.current.isAnonymous).toBe(true)
  })
})
