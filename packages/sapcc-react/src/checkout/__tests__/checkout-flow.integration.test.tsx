import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useCart } from '../../cart/useCart'
import { useCartEntries } from '../../cart/useCartEntries'
import { useDeliveryAddress } from '../useDeliveryAddress'
import { useDeliveryModes } from '../useDeliveryModes'
import { usePaymentDetails } from '../usePaymentDetails'
import { usePlaceOrder } from '../usePlaceOrder'
import { useGuestCheckout } from '../useGuestCheckout'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import { resetCartState } from '../../../test/mocks/handlers/cart'
import { resetCheckoutState } from '../../../test/mocks/handlers/checkout'
import {
  createCart,
  createCartEntry,
  createAddress,
  createDeliveryMode,
  createPaymentDetails,
} from '../../../test/mocks/fixtures/cart'
import { createOrder } from '../../../test/mocks/fixtures/checkout'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

const BASE_URL = 'https://test.example.com/occ/v2/test-site'

describe('checkout flow integration', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCartState()
    resetCheckoutState()
  })

  it('full anonymous checkout: add to cart → address → delivery mode → payment → place order', async () => {
    // ── Server state ──────────────────────────────────────────────────

    // Step 0: Empty cart after creation
    let serverCart = createCart({
      code: 'anon-cart-001',
      guid: 'anon-guid-001',
      entries: [],
      totalItems: 0,
      totalUnitCount: 0,
    })

    // Override the anonymous cart GET handler to return our mutable state
    server.use(
      http.get(
        `${BASE_URL}/users/anonymous/carts/:cartId`,
        () => HttpResponse.json(serverCart),
      ),
    )

    // ── Render all hooks ──────────────────────────────────────────────

    const { result } = renderHookWithProviders(
      () => ({
        cart: useCart(),
        entries: useCartEntries(),
        address: useDeliveryAddress(),
        modes: useDeliveryModes(),
        payment: usePaymentDetails(),
        order: usePlaceOrder(),
      }),
      { configOverrides: authConfig },
    )

    await waitFor(() => {
      expect(result.current.cart.isInitialized).toBe(true)
    })
    expect(result.current.cart.cart).toBeNull()

    // ── Step 1: Add item to cart ──────────────────────────────────────

    serverCart = createCart({
      ...serverCart,
      entries: [
        createCartEntry({
          entryNumber: 0,
          product: { code: 'SKU_LAPTOP', name: 'Laptop Pro', images: [] },
          quantity: 1,
        }),
      ],
      totalItems: 1,
      totalUnitCount: 1,
    })

    await act(async () => {
      await result.current.entries.addEntry.mutateAsync({
        productCode: 'SKU_LAPTOP',
        quantity: 1,
      })
    })

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
      expect(result.current.cart.cart?.guid).toBe('anon-guid-001')
    })

    // ── Step 2: Set delivery address ──────────────────────────────────

    serverCart = createCart({
      ...serverCart,
      deliveryAddress: createAddress({
        firstName: 'Alice',
        lastName: 'Checkout',
        line1: '42 Commerce Blvd',
        town: 'Tech City',
        postalCode: '10001',
        country: { isocode: 'US', name: 'United States' },
      }),
    })

    await act(async () => {
      await result.current.address.setDeliveryAddress.mutateAsync({
        firstName: 'Alice',
        lastName: 'Checkout',
        line1: '42 Commerce Blvd',
        town: 'Tech City',
        postalCode: '10001',
        country: { isocode: 'US' },
      })
    })

    await waitFor(() => {
      expect(result.current.address.deliveryAddress?.firstName).toBe('Alice')
    })

    // ── Step 3: Select delivery mode ──────────────────────────────────

    // Delivery modes should now be fetchable since address is set
    await waitFor(() => {
      expect(result.current.modes.deliveryModes.length).toBeGreaterThan(0)
    })

    serverCart = createCart({
      ...serverCart,
      deliveryMode: createDeliveryMode({ code: 'standard-gross' }),
    })

    await act(async () => {
      await result.current.modes.setDeliveryMode.mutateAsync('standard-gross')
    })

    await waitFor(() => {
      expect(result.current.modes.selectedMode?.code).toBe('standard-gross')
    })

    // ── Step 4: Set payment details ───────────────────────────────────

    serverCart = createCart({
      ...serverCart,
      paymentInfo: createPaymentDetails({
        accountHolderName: 'Alice Checkout',
        cardNumber: '************4242',
      }),
    })

    await act(async () => {
      await result.current.payment.setPaymentDetails.mutateAsync({
        accountHolderName: 'Alice Checkout',
        cardNumber: '4242424242424242',
        cardType: { code: 'visa' },
        expiryMonth: '12',
        expiryYear: '2028',
        billingAddress: {
          firstName: 'Alice',
          lastName: 'Checkout',
          line1: '42 Commerce Blvd',
          town: 'Tech City',
          postalCode: '10001',
          country: { isocode: 'US' },
        },
      })
    })

    await waitFor(() => {
      expect(result.current.payment.paymentDetails?.accountHolderName).toBe('Alice Checkout')
    })

    // ── Step 5: Place order ───────────────────────────────────────────

    const placedOrder = createOrder({
      code: 'ORD-INTEG-001',
      status: 'CREATED',
      statusDisplay: 'Created',
    })

    server.use(
      http.post(`${BASE_URL}/users/anonymous/orders`, () => {
        return HttpResponse.json(placedOrder, { status: 201 })
      }),
    )

    let orderResult: unknown
    await act(async () => {
      orderResult = await result.current.order.placeOrder.mutateAsync({
        termsChecked: true,
      })
    })

    expect(orderResult).toBeDefined()
    expect((orderResult as { code: string }).code).toBe('ORD-INTEG-001')
  })

  it('guest checkout flow: set email → address → delivery mode → payment → place order', async () => {
    let serverCart = createCart({
      code: 'guest-cart-001',
      guid: 'guest-guid-001',
      entries: [
        createCartEntry({
          entryNumber: 0,
          product: { code: 'SKU_PHONE', name: 'Phone Plus', images: [] },
          quantity: 1,
        }),
      ],
      totalItems: 1,
      totalUnitCount: 1,
    })

    server.use(
      http.get(
        `${BASE_URL}/users/anonymous/carts/:cartId`,
        () => HttpResponse.json(serverCart),
      ),
    )

    localStorage.setItem('sapcc_cart_guid', 'guest-guid-001')

    const { result } = renderHookWithProviders(
      () => ({
        cart: useCart(),
        guest: useGuestCheckout(),
        address: useDeliveryAddress(),
        modes: useDeliveryModes(),
        payment: usePaymentDetails(),
        order: usePlaceOrder(),
      }),
      { configOverrides: authConfig },
    )

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    // ── Step 1: Set guest email ───────────────────────────────────────

    serverCart = createCart({
      ...serverCart,
      user: { uid: 'guest@shop.com', name: 'Guest' },
    })

    await act(async () => {
      await result.current.guest.setGuestEmail.mutateAsync('guest@shop.com')
    })

    await waitFor(() => {
      expect(result.current.guest.guestEmail).toBe('guest@shop.com')
    })

    // ── Step 2: Set delivery address ──────────────────────────────────

    serverCart = createCart({
      ...serverCart,
      deliveryAddress: createAddress({
        firstName: 'Guest',
        lastName: 'Buyer',
        line1: '100 Guest Lane',
        town: 'Guestville',
        postalCode: '90210',
      }),
    })

    await act(async () => {
      await result.current.address.setDeliveryAddress.mutateAsync({
        firstName: 'Guest',
        lastName: 'Buyer',
        line1: '100 Guest Lane',
        town: 'Guestville',
        postalCode: '90210',
        country: { isocode: 'US' },
      })
    })

    await waitFor(() => {
      expect(result.current.address.deliveryAddress?.firstName).toBe('Guest')
    })

    // ── Step 3: Select delivery mode ──────────────────────────────────

    await waitFor(() => {
      expect(result.current.modes.deliveryModes.length).toBeGreaterThan(0)
    })

    serverCart = createCart({
      ...serverCart,
      deliveryMode: createDeliveryMode({ code: 'premium-gross' }),
    })

    await act(async () => {
      await result.current.modes.setDeliveryMode.mutateAsync('premium-gross')
    })

    await waitFor(() => {
      expect(result.current.modes.selectedMode?.code).toBe('premium-gross')
    })

    // ── Step 4: Set payment details ───────────────────────────────────

    serverCart = createCart({
      ...serverCart,
      paymentInfo: createPaymentDetails({ accountHolderName: 'Guest Buyer' }),
    })

    await act(async () => {
      await result.current.payment.setPaymentDetails.mutateAsync({
        accountHolderName: 'Guest Buyer',
        cardNumber: '5555555555554444',
        cardType: { code: 'master' },
        expiryMonth: '06',
        expiryYear: '2027',
        billingAddress: {
          firstName: 'Guest',
          lastName: 'Buyer',
          line1: '100 Guest Lane',
          town: 'Guestville',
          postalCode: '90210',
          country: { isocode: 'US' },
        },
      })
    })

    await waitFor(() => {
      expect(result.current.payment.paymentDetails?.accountHolderName).toBe('Guest Buyer')
    })

    // ── Step 5: Place order ───────────────────────────────────────────

    const guestOrder = createOrder({
      code: 'ORD-GUEST-001',
      guestCustomer: true,
      user: { uid: 'guest@shop.com' },
    })

    server.use(
      http.post(`${BASE_URL}/users/anonymous/orders`, () => {
        return HttpResponse.json(guestOrder, { status: 201 })
      }),
    )

    let orderResult: unknown
    await act(async () => {
      orderResult = await result.current.order.placeOrder.mutateAsync({
        termsChecked: true,
      })
    })

    expect(orderResult).toBeDefined()
    expect((orderResult as { code: string }).code).toBe('ORD-GUEST-001')
    expect((orderResult as { guestCustomer: boolean }).guestCustomer).toBe(true)
  })

  it('handles place order failure gracefully', async () => {
    localStorage.setItem('sapcc_cart_guid', 'fail-order-guid')

    const cart = createCart({
      code: 'fail-order-cart',
      guid: 'fail-order-guid',
    })

    server.use(
      http.get(`${BASE_URL}/users/anonymous/carts/fail-order-guid`, () => {
        return HttpResponse.json(cart)
      }),
      http.post(`${BASE_URL}/users/anonymous/orders`, () => {
        return HttpResponse.json(
          { errors: [{ type: 'PlaceOrderError', message: 'Payment declined' }] },
          { status: 400 },
        )
      }),
    )

    const { result } = renderHookWithProviders(
      () => ({
        cart: useCart(),
        order: usePlaceOrder(),
      }),
      { configOverrides: authConfig },
    )

    await waitFor(() => {
      expect(result.current.cart.cart).not.toBeNull()
    })

    await act(async () => {
      try {
        await result.current.order.placeOrder.mutateAsync({ termsChecked: true })
      } catch {
        // Expected failure
      }
    })

    await waitFor(() => {
      expect(result.current.order.placeOrder.isError).toBe(true)
    })

    // Cart should still exist after failed order
    expect(result.current.cart.cart).not.toBeNull()
  })
})
