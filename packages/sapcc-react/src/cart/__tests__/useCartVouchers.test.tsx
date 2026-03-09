import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { act, waitFor, cleanup } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useCart } from '../useCart'
import { useCartVouchers } from '../useCartVouchers'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import { resetCartState } from '../../../test/mocks/handlers/cart'
import { createCart, createVoucher } from '../../../test/mocks/fixtures/cart'

describe('useCartVouchers', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCartState()
  })

  afterEach(() => {
    cleanup()
  })

  function useCartWithVouchers() {
    const cart = useCart()
    const vouchers = useCartVouchers()
    return { cart, vouchers }
  }

  it('starts with empty vouchers array', async () => {
    const { result } = renderHookWithProviders(() => useCartWithVouchers())

    await waitFor(() => {
      expect(result.current.cart.isInitialized).toBe(true)
    })

    expect(result.current.vouchers.vouchers).toEqual([])
  })

  describe('applyVoucher', () => {
    it('applies a voucher code successfully', async () => {
      localStorage.setItem('sapcc_cart_guid', 'voucher-guid')

      const cart = createCart({
        code: 'voucher-cart',
        guid: 'voucher-guid',
      })

      // After voucher application, cart refresh returns voucher
      const cartWithVoucher = createCart({
        code: 'voucher-cart',
        guid: 'voucher-guid',
        appliedVouchers: [createVoucher({ code: 'SAVE10' })],
      })

      let getCallCount = 0
      server.use(
        http.get(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts/voucher-guid',
          () => {
            getCallCount++
            // First call returns cart without voucher, second (after refresh) with voucher
            if (getCallCount <= 1) {
              return HttpResponse.json(cart)
            }
            return HttpResponse.json(cartWithVoucher)
          },
        ),
      )

      const { result } = renderHookWithProviders(() => useCartWithVouchers())

      await waitFor(() => {
        expect(result.current.cart.cart).not.toBeNull()
      })

      await act(async () => {
        await result.current.vouchers.applyVoucher.mutateAsync('SAVE10')
      })

      expect(result.current.vouchers.applyVoucher.isSuccess).toBe(true)
    })

    it('handles invalid voucher error', async () => {
      localStorage.setItem('sapcc_cart_guid', 'invalid-voucher-guid')

      const cart = createCart({
        code: 'inv-voucher-cart',
        guid: 'invalid-voucher-guid',
      })

      server.use(
        http.get(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts/invalid-voucher-guid',
          () => {
            return HttpResponse.json(cart)
          },
        ),
        http.post(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts/invalid-voucher-guid/vouchers',
          () => {
            return HttpResponse.json(
              {
                errors: [
                  {
                    type: 'VoucherOperationError',
                    message: 'Voucher not found',
                    reason: 'notFound',
                  },
                ],
              },
              { status: 400 },
            )
          },
        ),
      )

      const { result } = renderHookWithProviders(() => useCartWithVouchers())

      await waitFor(() => {
        expect(result.current.cart.cart).not.toBeNull()
      })

      await act(async () => {
        try {
          await result.current.vouchers.applyVoucher.mutateAsync('INVALID_VOUCHER')
        } catch {
          // Expected — mutation should fail with 400
        }
      })

      await waitFor(() => {
        expect(result.current.vouchers.applyVoucher.isError).toBe(true)
      })
    })
  })

  describe('removeVoucher', () => {
    it('removes a voucher code successfully', async () => {
      localStorage.setItem('sapcc_cart_guid', 'remove-voucher-guid')

      const cartWithVoucher = createCart({
        code: 'rm-voucher-cart',
        guid: 'remove-voucher-guid',
        appliedVouchers: [createVoucher({ code: 'REMOVE-ME' })],
      })

      const cartWithoutVoucher = createCart({
        code: 'rm-voucher-cart',
        guid: 'remove-voucher-guid',
        appliedVouchers: [],
      })

      let getCallCount = 0
      server.use(
        http.get(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts/remove-voucher-guid',
          () => {
            getCallCount++
            if (getCallCount <= 1) {
              return HttpResponse.json(cartWithVoucher)
            }
            return HttpResponse.json(cartWithoutVoucher)
          },
        ),
      )

      const { result } = renderHookWithProviders(() => useCartWithVouchers())

      await waitFor(() => {
        expect(result.current.cart.isInitialized).toBe(true)
        expect(result.current.cart.cart).not.toBeNull()
      })

      await act(async () => {
        await result.current.vouchers.removeVoucher.mutateAsync('REMOVE-ME')
      })

      expect(result.current.vouchers.removeVoucher.isSuccess).toBe(true)
    })
  })
})
