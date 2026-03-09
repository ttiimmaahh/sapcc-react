import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { waitFor, cleanup, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useCartPromotions } from '../useCartPromotions'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import { resetCartState } from '../../../test/mocks/handlers/cart'
import { createCart, createCartPromotion } from '../../../test/mocks/fixtures/cart'

describe('useCartPromotions', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCartState()
  })

  afterEach(() => {
    cleanup()
  })

  it('throws when used outside SapccProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useCartPromotions())
    }).toThrow('useCartPromotions must be used within a <SapccProvider>')

    consoleSpy.mockRestore()
  })

  it('returns empty arrays when no cart exists', async () => {
    const { result } = renderHookWithProviders(() => useCartPromotions())

    await waitFor(() => {
      // Wait for initialization to settle
      expect(result.current).toBeDefined()
    })

    expect(result.current.appliedOrderPromotions).toEqual([])
    expect(result.current.appliedProductPromotions).toEqual([])
    expect(result.current.potentialOrderPromotions).toEqual([])
    expect(result.current.potentialProductPromotions).toEqual([])
    expect(result.current.hasPromotions).toBe(false)
  })

  it('returns applied promotions from cart', async () => {
    localStorage.setItem('sapcc_cart_guid', 'promo-guid')

    const orderPromotion = createCartPromotion({
      description: '10% off all orders',
    })
    const productPromotion = createCartPromotion({
      description: 'Buy 2 get 1 free',
    })

    const cart = createCart({
      code: 'promo-cart',
      guid: 'promo-guid',
      appliedOrderPromotions: [orderPromotion],
      appliedProductPromotions: [productPromotion],
    })

    server.use(
      http.get(
        'https://test.example.com/occ/v2/test-site/users/anonymous/carts/promo-guid',
        () => {
          return HttpResponse.json(cart)
        },
      ),
    )

    const { result } = renderHookWithProviders(() => useCartPromotions())

    await waitFor(() => {
      expect(result.current.hasPromotions).toBe(true)
    })

    expect(result.current.appliedOrderPromotions).toHaveLength(1)
    expect(result.current.appliedOrderPromotions[0]?.description).toBe('10% off all orders')
    expect(result.current.appliedProductPromotions).toHaveLength(1)
    expect(result.current.appliedProductPromotions[0]?.description).toBe('Buy 2 get 1 free')
  })

  it('hasPromotions is false when cart has no promotions', async () => {
    localStorage.setItem('sapcc_cart_guid', 'no-promo-guid')

    const cart = createCart({
      code: 'no-promo-cart',
      guid: 'no-promo-guid',
    })

    server.use(
      http.get(
        'https://test.example.com/occ/v2/test-site/users/anonymous/carts/no-promo-guid',
        () => {
          return HttpResponse.json(cart)
        },
      ),
    )

    const { result } = renderHookWithProviders(() => useCartPromotions())

    await waitFor(() => {
      expect(result.current).toBeDefined()
    })

    // Wait for cart to load
    await waitFor(() => {
      // Promotions might still be empty since default createCart doesn't add them
    })

    expect(result.current.hasPromotions).toBe(false)
  })
})
