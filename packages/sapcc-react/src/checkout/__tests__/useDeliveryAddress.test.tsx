import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, waitFor, cleanup, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useCart } from '../../cart/useCart'
import { useDeliveryAddress } from '../useDeliveryAddress'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import { resetCartState } from '../../../test/mocks/handlers/cart'
import { resetCheckoutState } from '../../../test/mocks/handlers/checkout'
import { createCart, createAddress } from '../../../test/mocks/fixtures/cart'
import type { SetDeliveryAddressParams } from '../checkout.types'

const BASE_URL = 'https://test.example.com/occ/v2/test-site'

describe('useDeliveryAddress', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCartState()
    resetCheckoutState()
  })

  afterEach(() => {
    cleanup()
  })

  function useCartWithDeliveryAddress() {
    const cart = useCart()
    const delivery = useDeliveryAddress()
    return { cart, delivery }
  }

  it('throws when used outside SapccProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useDeliveryAddress())
    }).toThrow('useDeliveryAddress must be used within a <SapccProvider>')

    consoleSpy.mockRestore()
  })

  it('starts with null delivery address when cart has none', async () => {
    localStorage.setItem('sapcc_cart_guid', 'addr-test-guid')

    const cart = createCart({
      code: 'addr-cart',
      guid: 'addr-test-guid',
      deliveryAddress: undefined,
    })

    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/addr-test-guid`, () => {
        return HttpResponse.json(cart)
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithDeliveryAddress())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    expect(result.current.delivery.deliveryAddress).toBeNull()
  })

  it('returns existing delivery address from cart', async () => {
    localStorage.setItem('sapcc_cart_guid', 'addr-existing-guid')

    const address = createAddress({
      firstName: 'John',
      lastName: 'Doe',
      line1: '123 Main St',
    })

    const cart = createCart({
      code: 'addr-existing-cart',
      guid: 'addr-existing-guid',
      deliveryAddress: address,
    })

    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/addr-existing-guid`, () => {
        return HttpResponse.json(cart)
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithDeliveryAddress())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    expect(result.current.delivery.deliveryAddress).not.toBeNull()
    expect(result.current.delivery.deliveryAddress?.firstName).toBe('John')
    expect(result.current.delivery.deliveryAddress?.line1).toBe('123 Main St')
  })

  it('sets delivery address on existing cart', async () => {
    localStorage.setItem('sapcc_cart_guid', 'addr-set-guid')

    const cart = createCart({
      code: 'addr-set-cart',
      guid: 'addr-set-guid',
    })

    const cartWithAddress = createCart({
      ...cart,
      deliveryAddress: createAddress({
        firstName: 'Jane',
        lastName: 'Smith',
        line1: '456 Oak Ave',
        town: 'Portland',
        postalCode: '97201',
      }),
    })

    let getCallCount = 0
    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/addr-set-guid`, () => {
        getCallCount++
        if (getCallCount <= 1) {
          return HttpResponse.json(cart)
        }
        return HttpResponse.json(cartWithAddress)
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithDeliveryAddress())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    const addressData: SetDeliveryAddressParams = {
      firstName: 'Jane',
      lastName: 'Smith',
      line1: '456 Oak Ave',
      town: 'Portland',
      postalCode: '97201',
      country: { isocode: 'US' },
    }

    await act(async () => {
      await result.current.delivery.setDeliveryAddress.mutateAsync(addressData)
    })

    expect(result.current.delivery.setDeliveryAddress.isSuccess).toBe(true)

    // After refresh, the address should be on the cart
    await waitFor(() => {
      expect(result.current.delivery.deliveryAddress?.firstName).toBe('Jane')
    })
  })

  it('creates cart before setting address when no cart exists', async () => {
    const newCart = createCart({
      code: 'lazy-addr-cart',
      guid: 'lazy-addr-guid',
    })

    const cartWithAddress = createCart({
      ...newCart,
      deliveryAddress: createAddress({ firstName: 'Lazy' }),
    })

    server.use(
      http.post(`${BASE_URL}/users/anonymous/carts`, () => {
        return HttpResponse.json(newCart)
      }),
      http.get(`${BASE_URL}/users/anonymous/carts/lazy-addr-guid`, () => {
        return HttpResponse.json(cartWithAddress)
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithDeliveryAddress())

    await waitFor(() => {
      expect(result.current.cart.isInitialized).toBe(true)
    })

    expect(result.current.cart.cart).toBeNull()

    await act(async () => {
      await result.current.delivery.setDeliveryAddress.mutateAsync({
        firstName: 'Lazy',
        lastName: 'User',
        line1: '789 Elm St',
        town: 'Denver',
        postalCode: '80201',
        country: { isocode: 'US' },
      })
    })

    expect(result.current.delivery.setDeliveryAddress.isSuccess).toBe(true)
  })

  it('handles server error when setting address', async () => {
    localStorage.setItem('sapcc_cart_guid', 'addr-error-guid')

    const cart = createCart({
      code: 'addr-error-cart',
      guid: 'addr-error-guid',
    })

    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/addr-error-guid`, () => {
        return HttpResponse.json(cart)
      }),
      http.put(`${BASE_URL}/users/anonymous/carts/addr-error-guid/addresses/delivery`, () => {
        return HttpResponse.json(
          { errors: [{ type: 'ValidationError', message: 'Invalid address' }] },
          { status: 400 },
        )
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithDeliveryAddress())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    await act(async () => {
      try {
        await result.current.delivery.setDeliveryAddress.mutateAsync({
          firstName: '',
          lastName: '',
          line1: '',
          town: '',
          postalCode: '',
          country: { isocode: '' },
        })
      } catch {
        // Expected to fail
      }
    })

    await waitFor(() => {
      expect(result.current.delivery.setDeliveryAddress.isError).toBe(true)
    })
  })
})
