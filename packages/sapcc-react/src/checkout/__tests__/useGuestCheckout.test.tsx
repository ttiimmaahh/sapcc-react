import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, waitFor, cleanup, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useCart } from '../../cart/useCart'
import { useGuestCheckout } from '../useGuestCheckout'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import { resetCartState } from '../../../test/mocks/handlers/cart'
import { resetCheckoutState } from '../../../test/mocks/handlers/checkout'
import { createCart } from '../../../test/mocks/fixtures/cart'

const BASE_URL = 'https://test.example.com/occ/v2/test-site'

describe('useGuestCheckout', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCartState()
    resetCheckoutState()
  })

  afterEach(() => {
    cleanup()
  })

  function useCartWithGuest() {
    const cart = useCart()
    const guest = useGuestCheckout()
    return { cart, guest }
  }

  it('throws when used outside SapccProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useGuestCheckout())
    }).toThrow('useGuestCheckout must be used within a <SapccProvider>')

    consoleSpy.mockRestore()
  })

  it('starts with null guest email when cart has no user', async () => {
    localStorage.setItem('sapcc_cart_guid', 'guest-test-guid')

    const cart = createCart({
      code: 'guest-cart',
      guid: 'guest-test-guid',
    })

    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/guest-test-guid`, () => {
        return HttpResponse.json(cart)
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithGuest())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    expect(result.current.guest.guestEmail).toBeNull()
  })

  it('sets guest email on cart', async () => {
    localStorage.setItem('sapcc_cart_guid', 'guest-set-guid')

    const cart = createCart({
      code: 'guest-set-cart',
      guid: 'guest-set-guid',
    })

    const cartWithEmail = createCart({
      ...cart,
      user: { uid: 'guest@example.com', name: 'Guest' },
    })

    let getCallCount = 0
    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/guest-set-guid`, () => {
        getCallCount++
        if (getCallCount <= 1) {
          return HttpResponse.json(cart)
        }
        return HttpResponse.json(cartWithEmail)
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithGuest())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    await act(async () => {
      await result.current.guest.setGuestEmail.mutateAsync('guest@example.com')
    })

    expect(result.current.guest.setGuestEmail.isSuccess).toBe(true)

    await waitFor(() => {
      expect(result.current.guest.guestEmail).toBe('guest@example.com')
    })
  })

  it('creates cart before setting email when no cart exists', async () => {
    const newCart = createCart({
      code: 'lazy-guest-cart',
      guid: 'lazy-guest-guid',
    })

    server.use(
      http.post(`${BASE_URL}/users/anonymous/carts`, () => {
        return HttpResponse.json(newCart)
      }),
      http.get(`${BASE_URL}/users/anonymous/carts/lazy-guest-guid`, () => {
        return HttpResponse.json(newCart)
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithGuest())

    await waitFor(() => {
      expect(result.current.cart.isInitialized).toBe(true)
    })

    expect(result.current.cart.cart).toBeNull()

    await act(async () => {
      await result.current.guest.setGuestEmail.mutateAsync('lazy@example.com')
    })

    expect(result.current.guest.setGuestEmail.isSuccess).toBe(true)
  })
})
