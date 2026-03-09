import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useAuth } from '../../auth/useAuth'
import { useCart } from '../useCart'
import { useCartEntries } from '../useCartEntries'
import { useCartVouchers } from '../useCartVouchers'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import { resetCartState } from '../../../test/mocks/handlers/cart'
import { createCart, createCartEntry, createVoucher } from '../../../test/mocks/fixtures/cart'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

const BASE_URL = 'https://test.example.com/occ/v2/test-site'

describe('cart lifecycle integration', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCartState()
  })

  it('anonymous user: creates cart, adds entry, persists GUID', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        cart: useCart(),
        entries: useCartEntries(),
      }),
      { configOverrides: authConfig },
    )

    // Initially no cart
    await waitFor(() => {
      expect(result.current.cart.isInitialized).toBe(true)
    })
    expect(result.current.cart.cart).toBeNull()
    expect(result.current.cart.isAnonymous).toBe(true)

    // Add an entry — this triggers lazy cart creation via ensureCart
    await act(async () => {
      await result.current.entries.addEntry.mutateAsync({
        productCode: 'PROD_001',
        quantity: 2,
      })
    })

    // Cart should now exist and GUID should be persisted
    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    expect(result.current.cart.cart?.guid).toBeTruthy()
    expect(localStorage.getItem('sapcc_cart_guid')).toBe(
      result.current.cart.cart?.guid,
    )
  })

  it('anonymous user: loads existing cart from persisted GUID on mount', async () => {
    const existingGuid = 'existing-anon-guid-123'

    // Pre-set up an anonymous cart in MSW state
    const existingCart = createCart({
      code: 'existing-anon-cart',
      guid: existingGuid,
      entries: [createCartEntry({ entryNumber: 0 })],
    })

    server.use(
      http.get(
        `${BASE_URL}/users/anonymous/carts/${existingGuid}`,
        () => {
          return HttpResponse.json(existingCart)
        },
      ),
    )

    // Persist the GUID in localStorage before mounting
    localStorage.setItem('sapcc_cart_guid', existingGuid)

    const { result } = renderHookWithProviders(
      () => useCart(),
      { configOverrides: authConfig },
    )

    // Should load the existing cart from the persisted GUID
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
      expect(result.current.cart).not.toBeNull()
    })

    expect(result.current.cart?.guid).toBe(existingGuid)
    expect(result.current.cart?.entries).toHaveLength(1)
    expect(result.current.isAnonymous).toBe(true)
  })

  it('authenticated user: loads cart on login', async () => {
    const userCartData = createCart({
      code: 'user-cart-after-login',
      guid: undefined,
      entries: [
        createCartEntry({ entryNumber: 0 }),
        createCartEntry({ entryNumber: 1 }),
      ],
    })

    server.use(
      http.get(`${BASE_URL}/users/current/carts/current`, () => {
        return HttpResponse.json(userCartData)
      }),
    )

    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        cart: useCart(),
      }),
      { configOverrides: authConfig },
    )

    // Wait for initial anonymous state to settle
    await waitFor(() => {
      expect(result.current.cart.isInitialized).toBe(true)
    })
    expect(result.current.cart.cart).toBeNull()
    expect(result.current.cart.isAnonymous).toBe(true)

    // Login
    await act(async () => {
      await result.current.auth.login({
        username: 'user@test.com',
        password: 'secret123',
      })
    })

    // After login, cart should switch to authenticated and load user cart
    await waitFor(() => {
      expect(result.current.cart.isAnonymous).toBe(false)
      expect(result.current.cart.cart).not.toBeNull()
    })

    expect(result.current.cart.cart?.code).toBe('user-cart-after-login')
    expect(result.current.cart.cart?.entries).toHaveLength(2)
  })

  it('merges anonymous cart into user cart on login', async () => {
    const anonGuid = 'anon-guid-to-merge'
    let mergeRequested = false
    let capturedOldCartId: string | null = null
    let capturedMergeGuid: string | null = null

    const mergedCart = createCart({
      code: 'merged-user-cart',
      guid: undefined,
      entries: [
        createCartEntry({ entryNumber: 0 }),
        createCartEntry({ entryNumber: 1 }),
        createCartEntry({ entryNumber: 2 }),
      ],
    })

    server.use(
      // Intercept cart creation/merge for the authenticated user
      http.post(`${BASE_URL}/users/current/carts`, ({ request }) => {
        const url = new URL(request.url)
        capturedOldCartId = url.searchParams.get('oldCartId')
        capturedMergeGuid = url.searchParams.get('toMergeCartGuid')

        if (capturedOldCartId && capturedMergeGuid) {
          mergeRequested = true
          return HttpResponse.json(mergedCart)
        }

        // Regular cart creation
        return HttpResponse.json(
          createCart({ code: 'new-user-cart', guid: undefined }),
        )
      }),
    )

    // Pre-set anonymous cart GUID (simulating an existing anonymous cart)
    localStorage.setItem('sapcc_cart_guid', anonGuid)

    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        cart: useCart(),
      }),
      { configOverrides: authConfig },
    )

    // Wait for anonymous cart to be loaded/initialized
    await waitFor(() => {
      expect(result.current.cart.isInitialized).toBe(true)
    })
    expect(result.current.cart.isAnonymous).toBe(true)

    // Login — should trigger anonymous→auth cart merge
    await act(async () => {
      await result.current.auth.login({
        username: 'user@test.com',
        password: 'secret123',
      })
    })

    // Wait for the merge to complete and cart to update
    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
      expect(result.current.cart.isAnonymous).toBe(false)
    })

    // Verify merge was requested with correct params
    expect(mergeRequested).toBe(true)
    expect(capturedOldCartId).toBe(anonGuid)
    expect(capturedMergeGuid).toBe(anonGuid)

    // The merged cart should be the active cart
    expect(result.current.cart.cart?.code).toBe('merged-user-cart')
    expect(result.current.cart.cart?.entries).toHaveLength(3)

    // Anonymous GUID should be cleared from localStorage after merge
    expect(localStorage.getItem('sapcc_cart_guid')).toBeNull()
  })

  it('full cart lifecycle: add entry, update quantity, apply voucher', async () => {
    // Server-side cart state, advanced between mutation steps.
    // Start with a cart that already has the entry (simulates what
    // the server would return after `addEntry` succeeds).
    let serverCart = createCart({
      code: 'anon-cart-001',
      guid: 'anon-guid-001',
      entries: [
        createCartEntry({
          entryNumber: 0,
          product: { code: 'SKU_A', name: 'Product A', images: [] },
          quantity: 1,
        }),
      ],
      totalItems: 1,
      totalUnitCount: 1,
    })

    // Override ALL anonymous cart GET requests to return our mutable state
    server.use(
      http.get(
        `${BASE_URL}/users/anonymous/carts/:cartId`,
        () => HttpResponse.json(serverCart),
      ),
    )

    const { result } = renderHookWithProviders(
      () => ({
        cart: useCart(),
        entries: useCartEntries(),
        vouchers: useCartVouchers(),
      }),
      { configOverrides: authConfig },
    )

    await waitFor(() => {
      expect(result.current.cart.isInitialized).toBe(true)
    })
    expect(result.current.cart.cart).toBeNull()

    // 1. Add entry — triggers ensureCart → createCart → POST, then refreshCart → GET
    await act(async () => {
      await result.current.entries.addEntry.mutateAsync({
        productCode: 'SKU_A',
        quantity: 1,
      })
    })

    // After addEntry, wait for the refreshCart (onSettled) to settle
    await waitFor(() => {
      expect(result.current.cart.cart?.guid).toBe('anon-guid-001')
    })

    // 2. Advance server state, then update entry
    serverCart = createCart({
      ...serverCart,
      entries: [
        createCartEntry({
          entryNumber: 0,
          product: { code: 'SKU_A', name: 'Product A', images: [] },
          quantity: 5,
        }),
      ],
      totalUnitCount: 5,
    })

    await act(async () => {
      await result.current.entries.updateEntry.mutateAsync({
        entryNumber: 0,
        quantity: 5,
      })
    })

    await waitFor(() => {
      expect(result.current.cart.cart?.totalUnitCount).toBe(5)
    })

    // 3. Advance server state with a voucher applied
    serverCart = createCart({
      ...serverCart,
      appliedVouchers: [createVoucher({ code: 'SAVE10', voucherCode: 'SAVE10' })],
    })

    await act(async () => {
      await result.current.vouchers.applyVoucher.mutateAsync('SAVE10')
    })

    await waitFor(() => {
      expect(result.current.vouchers.vouchers).toHaveLength(1)
    })
    expect(result.current.vouchers.vouchers[0]?.code).toBe('SAVE10')
  })

  it('handles cart not found gracefully (expired cart)', async () => {
    const expiredGuid = 'expired-cart-guid'

    server.use(
      http.get(
        `${BASE_URL}/users/anonymous/carts/${expiredGuid}`,
        () => {
          return HttpResponse.json(
            {
              errors: [
                {
                  type: 'CartError',
                  message: 'Cart not found',
                  reason: 'notFound',
                },
              ],
            },
            { status: 404 },
          )
        },
      ),
    )

    // Persist an expired cart GUID
    localStorage.setItem('sapcc_cart_guid', expiredGuid)

    const { result } = renderHookWithProviders(
      () => useCart(),
      { configOverrides: authConfig },
    )

    // Cart should initialize with null and clear the expired GUID
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(result.current.cart).toBeNull()
    expect(localStorage.getItem('sapcc_cart_guid')).toBeNull()
  })
})
