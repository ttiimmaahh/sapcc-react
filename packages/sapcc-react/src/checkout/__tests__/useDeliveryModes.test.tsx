import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, waitFor, cleanup, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useCart } from '../../cart/useCart'
import { useDeliveryModes } from '../useDeliveryModes'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import { resetCartState } from '../../../test/mocks/handlers/cart'
import { resetCheckoutState } from '../../../test/mocks/handlers/checkout'
import {
  createCart,
  createAddress,
  createDeliveryMode,
} from '../../../test/mocks/fixtures/cart'

const BASE_URL = 'https://test.example.com/occ/v2/test-site'

describe('useDeliveryModes', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCartState()
    resetCheckoutState()
  })

  afterEach(() => {
    cleanup()
  })

  function useCartWithDeliveryModes() {
    const cart = useCart()
    const modes = useDeliveryModes()
    return { cart, modes }
  }

  it('throws when used outside SapccProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useDeliveryModes())
    }).toThrow('useDeliveryModes must be used within a <SapccProvider>')

    consoleSpy.mockRestore()
  })

  it('fetches delivery modes when cart has a delivery address', async () => {
    localStorage.setItem('sapcc_cart_guid', 'modes-guid')

    const cart = createCart({
      code: 'modes-cart',
      guid: 'modes-guid',
      deliveryAddress: createAddress(),
    })

    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/modes-guid`, () => {
        return HttpResponse.json(cart)
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithDeliveryModes())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    // Delivery modes should be fetched
    await waitFor(() => {
      expect(result.current.modes.deliveryModes.length).toBeGreaterThan(0)
    })

    expect(result.current.modes.deliveryModes[0]?.code).toBe('standard-gross')
  })

  it('returns empty modes when cart has no ID', async () => {
    const { result } = renderHookWithProviders(() => useCartWithDeliveryModes())

    await waitFor(() => {
      expect(result.current.cart.isInitialized).toBe(true)
    })

    // No cart ID = modes query should not run
    expect(result.current.modes.deliveryModes).toEqual([])
  })

  it('returns selected delivery mode from cart', async () => {
    localStorage.setItem('sapcc_cart_guid', 'selected-mode-guid')

    const selectedMode = createDeliveryMode({
      code: 'premium-gross',
      name: 'Premium Delivery',
    })

    const cart = createCart({
      code: 'selected-mode-cart',
      guid: 'selected-mode-guid',
      deliveryAddress: createAddress(),
      deliveryMode: selectedMode,
    })

    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/selected-mode-guid`, () => {
        return HttpResponse.json(cart)
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithDeliveryModes())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    expect(result.current.modes.selectedMode).not.toBeNull()
    expect(result.current.modes.selectedMode?.code).toBe('premium-gross')
  })

  it('sets delivery mode on cart', async () => {
    localStorage.setItem('sapcc_cart_guid', 'set-mode-guid')

    const cart = createCart({
      code: 'set-mode-cart',
      guid: 'set-mode-guid',
      deliveryAddress: createAddress(),
    })

    const cartWithMode = createCart({
      ...cart,
      deliveryMode: createDeliveryMode({ code: 'standard-gross' }),
    })

    let getCallCount = 0
    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/set-mode-guid`, () => {
        getCallCount++
        if (getCallCount <= 1) {
          return HttpResponse.json(cart)
        }
        return HttpResponse.json(cartWithMode)
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithDeliveryModes())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    await act(async () => {
      await result.current.modes.setDeliveryMode.mutateAsync('standard-gross')
    })

    expect(result.current.modes.setDeliveryMode.isSuccess).toBe(true)

    await waitFor(() => {
      expect(result.current.modes.selectedMode?.code).toBe('standard-gross')
    })
  })

  it('respects enabled option', async () => {
    localStorage.setItem('sapcc_cart_guid', 'disabled-modes-guid')

    const cart = createCart({
      code: 'disabled-modes-cart',
      guid: 'disabled-modes-guid',
      deliveryAddress: createAddress(),
    })

    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/disabled-modes-guid`, () => {
        return HttpResponse.json(cart)
      }),
    )

    function useCartWithDisabledModes() {
      const cartHook = useCart()
      const modesHook = useDeliveryModes({ enabled: false })
      return { cart: cartHook, modes: modesHook }
    }

    const { result } = renderHookWithProviders(() => useCartWithDisabledModes())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    // Modes should not be fetched when disabled
    expect(result.current.modes.deliveryModes).toEqual([])
    expect(result.current.modes.isLoading).toBe(false)
  })
})
