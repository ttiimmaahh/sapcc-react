import { http, HttpResponse } from 'msw'
import {
  createOrder,
  createDeliveryModeList,
} from '../fixtures/checkout'
import {
  createAddress,
  createDeliveryMode,
  createPaymentDetails,
} from '../fixtures/cart'
import type { Address, DeliveryMode, PaymentDetails } from '../../../src/cart/cart.types'

const BASE_URL = 'https://test.example.com/occ/v2/test-site'

// In-memory checkout state for realistic handler behavior
let deliveryAddress: Address | null = null
let selectedDeliveryMode: DeliveryMode | null = null
let paymentDetails: PaymentDetails | null = null
let guestEmail: string | null = null

/** Reset checkout state between tests */
export function resetCheckoutState(): void {
  deliveryAddress = null
  selectedDeliveryMode = null
  paymentDetails = null
  guestEmail = null
}

export const checkoutHandlers = [
  // ── Set Delivery Address (PUT /users/:userId/carts/:cartId/addresses/delivery) ──
  http.put(
    `${BASE_URL}/users/:userId/carts/:cartId/addresses/delivery`,
    async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      deliveryAddress = createAddress({
        firstName: body.firstName as string,
        lastName: body.lastName as string,
        line1: body.line1 as string,
        town: body.town as string,
        postalCode: body.postalCode as string,
      })
      return HttpResponse.json(deliveryAddress)
    },
  ),

  // ── Get Delivery Modes (GET /users/:userId/carts/:cartId/deliverymodes) ──
  http.get(
    `${BASE_URL}/users/:userId/carts/:cartId/deliverymodes`,
    () => {
      return HttpResponse.json(createDeliveryModeList())
    },
  ),

  // ── Set Delivery Mode (PUT /users/:userId/carts/:cartId/deliverymode) ──
  http.put(
    `${BASE_URL}/users/:userId/carts/:cartId/deliverymode`,
    ({ request }) => {
      const url = new URL(request.url)
      const deliveryModeId = url.searchParams.get('deliveryModeId')

      if (!deliveryModeId) {
        return HttpResponse.json(
          { errors: [{ type: 'ValidationError', message: 'deliveryModeId is required' }] },
          { status: 400 },
        )
      }

      selectedDeliveryMode = createDeliveryMode({ code: deliveryModeId })
      return new HttpResponse(null, { status: 200 })
    },
  ),

  // ── Create Payment Details (POST /users/:userId/carts/:cartId/paymentdetails) ──
  http.post(
    `${BASE_URL}/users/:userId/carts/:cartId/paymentdetails`,
    async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      paymentDetails = createPaymentDetails({
        accountHolderName: body.accountHolderName as string,
      })
      return HttpResponse.json(paymentDetails, { status: 201 })
    },
  ),

  // ── Set Guest Email (PUT /users/:userId/carts/:cartId/email) ──
  http.put(
    `${BASE_URL}/users/:userId/carts/:cartId/email`,
    ({ request }) => {
      const url = new URL(request.url)
      const email = url.searchParams.get('email')

      if (!email) {
        return HttpResponse.json(
          { errors: [{ type: 'ValidationError', message: 'email is required' }] },
          { status: 400 },
        )
      }

      guestEmail = email
      return new HttpResponse(null, { status: 200 })
    },
  ),

  // ── Place Order (POST /users/:userId/orders) ──
  http.post(
    `${BASE_URL}/users/:userId/orders`,
    ({ request }) => {
      const url = new URL(request.url)
      const cartId = url.searchParams.get('cartId')
      const termsChecked = url.searchParams.get('termsChecked')

      if (!cartId) {
        return HttpResponse.json(
          { errors: [{ type: 'CartError', message: 'Cart ID is required' }] },
          { status: 400 },
        )
      }

      if (termsChecked !== 'true') {
        return HttpResponse.json(
          { errors: [{ type: 'ValidationError', message: 'Terms must be accepted' }] },
          { status: 400 },
        )
      }

      const order = createOrder({
        deliveryAddress: deliveryAddress ?? undefined,
        deliveryMode: selectedDeliveryMode ?? undefined,
        paymentInfo: paymentDetails ?? undefined,
        guestCustomer: Boolean(guestEmail),
        user: guestEmail ? { uid: guestEmail } : undefined,
      })

      return HttpResponse.json(order, { status: 201 })
    },
  ),
]
