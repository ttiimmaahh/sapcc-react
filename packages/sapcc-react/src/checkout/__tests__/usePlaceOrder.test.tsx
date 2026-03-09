import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, waitFor, cleanup, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useCart } from '../../cart/useCart'
import { useCartEntries } from '../../cart/useCartEntries'
import { usePlaceOrder } from '../usePlaceOrder'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import { resetCartState } from '../../../test/mocks/handlers/cart'
import { resetCheckoutState } from '../../../test/mocks/handlers/checkout'
import { createCart, createCartEntry } from '../../../test/mocks/fixtures/cart'
import { createOrder } from '../../../test/mocks/fixtures/checkout'

const BASE_URL = 'https://test.example.com/occ/v2/test-site'

describe('usePlaceOrder', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCartState()
    resetCheckoutState()
  })

  afterEach(() => {
    cleanup()
  })

  function useCartWithPlaceOrder() {
    const cart = useCart()
    const entries = useCartEntries()
    const order = usePlaceOrder()
    return { cart, entries, order }
  }

  it('throws when used outside SapccProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => usePlaceOrder())
    }).toThrow('usePlaceOrder must be used within a <SapccProvider>')

    consoleSpy.mockRestore()
  })

  it('throws when placing order without an active cart', async () => {
    const { result } = renderHookWithProviders(() => useCartWithPlaceOrder())

    await waitFor(() => {
      expect(result.current.cart.isInitialized).toBe(true)
    })

    expect(result.current.cart.cart).toBeNull()

    await act(async () => {
      try {
        await result.current.order.placeOrder.mutateAsync({ termsChecked: true })
      } catch (error) {
        expect((error as Error).message).toBe('No active cart to place order from')
      }
    })

    await waitFor(() => {
      expect(result.current.order.placeOrder.isError).toBe(true)
    })
  })

  it('places an order successfully and returns Order', async () => {
    localStorage.setItem('sapcc_cart_guid', 'order-guid')

    const cart = createCart({
      code: 'order-cart',
      guid: 'order-guid',
      entries: [createCartEntry({ entryNumber: 0 })],
    })

    const placedOrder = createOrder({
      code: 'ORD-12345',
      status: 'CREATED',
      statusDisplay: 'Created',
    })

    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/order-guid`, () => {
        return HttpResponse.json(cart)
      }),
      http.post(`${BASE_URL}/users/anonymous/orders`, () => {
        return HttpResponse.json(placedOrder, { status: 201 })
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithPlaceOrder())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    let orderResult: unknown
    await act(async () => {
      orderResult = await result.current.order.placeOrder.mutateAsync({
        termsChecked: true,
      })
    })

    expect(orderResult).toBeDefined()
    expect((orderResult as { code: string }).code).toBe('ORD-12345')
  })

  it('passes securityCode when provided', async () => {
    localStorage.setItem('sapcc_cart_guid', 'sec-code-guid')

    const cart = createCart({
      code: 'sec-code-cart',
      guid: 'sec-code-guid',
    })

    let capturedSecurityCode: string | null = null

    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/sec-code-guid`, () => {
        return HttpResponse.json(cart)
      }),
      http.post(`${BASE_URL}/users/anonymous/orders`, ({ request }) => {
        const url = new URL(request.url)
        capturedSecurityCode = url.searchParams.get('securityCode')
        return HttpResponse.json(createOrder(), { status: 201 })
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithPlaceOrder())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    await act(async () => {
      await result.current.order.placeOrder.mutateAsync({
        termsChecked: true,
        securityCode: '123',
      })
    })

    expect(capturedSecurityCode).toBe('123')
  })
})
