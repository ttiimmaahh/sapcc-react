import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, waitFor, cleanup, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useCart } from '../../cart/useCart'
import { usePaymentDetails } from '../usePaymentDetails'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import { resetCartState } from '../../../test/mocks/handlers/cart'
import { resetCheckoutState } from '../../../test/mocks/handlers/checkout'
import { createCart, createPaymentDetails } from '../../../test/mocks/fixtures/cart'
import type { SetPaymentDetailsParams } from '../checkout.types'

const BASE_URL = 'https://test.example.com/occ/v2/test-site'

describe('usePaymentDetails', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCartState()
    resetCheckoutState()
  })

  afterEach(() => {
    cleanup()
  })

  function useCartWithPayment() {
    const cart = useCart()
    const payment = usePaymentDetails()
    return { cart, payment }
  }

  it('throws when used outside SapccProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => usePaymentDetails())
    }).toThrow('usePaymentDetails must be used within a <SapccProvider>')

    consoleSpy.mockRestore()
  })

  it('starts with null payment details when cart has none', async () => {
    localStorage.setItem('sapcc_cart_guid', 'payment-test-guid')

    const cart = createCart({
      code: 'payment-cart',
      guid: 'payment-test-guid',
      paymentInfo: undefined,
    })

    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/payment-test-guid`, () => {
        return HttpResponse.json(cart)
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithPayment())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    expect(result.current.payment.paymentDetails).toBeNull()
  })

  it('returns existing payment details from cart', async () => {
    localStorage.setItem('sapcc_cart_guid', 'payment-existing-guid')

    const payment = createPaymentDetails({
      accountHolderName: 'John Doe',
      cardNumber: '************1234',
    })

    const cart = createCart({
      code: 'payment-existing-cart',
      guid: 'payment-existing-guid',
      paymentInfo: payment,
    })

    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/payment-existing-guid`, () => {
        return HttpResponse.json(cart)
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithPayment())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    expect(result.current.payment.paymentDetails).not.toBeNull()
    expect(result.current.payment.paymentDetails?.accountHolderName).toBe('John Doe')
  })

  it('creates payment details on cart', async () => {
    localStorage.setItem('sapcc_cart_guid', 'payment-create-guid')

    const cart = createCart({
      code: 'payment-create-cart',
      guid: 'payment-create-guid',
    })

    const cartWithPayment = createCart({
      ...cart,
      paymentInfo: createPaymentDetails({
        accountHolderName: 'Jane Smith',
        cardNumber: '************5678',
      }),
    })

    let getCallCount = 0
    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/payment-create-guid`, () => {
        getCallCount++
        if (getCallCount <= 1) {
          return HttpResponse.json(cart)
        }
        return HttpResponse.json(cartWithPayment)
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithPayment())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    const paymentData: SetPaymentDetailsParams = {
      accountHolderName: 'Jane Smith',
      cardNumber: '4111111111115678',
      cardType: { code: 'visa' },
      expiryMonth: '12',
      expiryYear: '2028',
      billingAddress: {
        firstName: 'Jane',
        lastName: 'Smith',
        line1: '123 Billing St',
        town: 'Springfield',
        postalCode: '62701',
        country: { isocode: 'US' },
      },
    }

    await act(async () => {
      const response = await result.current.payment.setPaymentDetails.mutateAsync(paymentData)
      // setPaymentDetails returns PaymentDetails
      expect(response).toBeDefined()
      expect(response.accountHolderName).toBeTruthy()
    })

    expect(result.current.payment.setPaymentDetails.isSuccess).toBe(true)

    await waitFor(() => {
      expect(result.current.payment.paymentDetails?.accountHolderName).toBe('Jane Smith')
    })
  })

  it('handles server error when creating payment details', async () => {
    localStorage.setItem('sapcc_cart_guid', 'payment-error-guid')

    const cart = createCart({
      code: 'payment-error-cart',
      guid: 'payment-error-guid',
    })

    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/payment-error-guid`, () => {
        return HttpResponse.json(cart)
      }),
      http.post(`${BASE_URL}/users/anonymous/carts/payment-error-guid/paymentdetails`, () => {
        return HttpResponse.json(
          { errors: [{ type: 'ValidationError', message: 'Invalid card number' }] },
          { status: 400 },
        )
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithPayment())

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    await act(async () => {
      try {
        await result.current.payment.setPaymentDetails.mutateAsync({
          accountHolderName: 'Bad Card',
          cardNumber: 'invalid',
          cardType: { code: 'visa' },
          expiryMonth: '01',
          expiryYear: '2020',
          billingAddress: {
            firstName: 'Bad',
            lastName: 'Card',
            line1: '1',
            town: 'X',
            postalCode: '0',
            country: { isocode: 'US' },
          },
        })
      } catch {
        // Expected to fail
      }
    })

    await waitFor(() => {
      expect(result.current.payment.setPaymentDetails.isError).toBe(true)
    })
  })

  it('creates cart before setting payment when no cart exists', async () => {
    const newCart = createCart({
      code: 'lazy-payment-cart',
      guid: 'lazy-payment-guid',
    })

    server.use(
      http.post(`${BASE_URL}/users/anonymous/carts`, () => {
        return HttpResponse.json(newCart)
      }),
      http.get(`${BASE_URL}/users/anonymous/carts/lazy-payment-guid`, () => {
        return HttpResponse.json(newCart)
      }),
    )

    const { result } = renderHookWithProviders(() => useCartWithPayment())

    await waitFor(() => {
      expect(result.current.cart.isInitialized).toBe(true)
    })

    expect(result.current.cart.cart).toBeNull()

    await act(async () => {
      await result.current.payment.setPaymentDetails.mutateAsync({
        accountHolderName: 'Lazy Payer',
        cardNumber: '4111111111111111',
        cardType: { code: 'visa' },
        expiryMonth: '06',
        expiryYear: '2029',
        billingAddress: {
          firstName: 'Lazy',
          lastName: 'Payer',
          line1: '100 Lazy Ln',
          town: 'Lazytown',
          postalCode: '00000',
          country: { isocode: 'US' },
        },
      })
    })

    expect(result.current.payment.setPaymentDetails.isSuccess).toBe(true)
  })
})
