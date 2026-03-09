import { http, HttpResponse } from 'msw'
import {
  createCart,
  createEmptyCart,
  createCartModification,
  createCartEntry,
  createSaveCartResult,
} from '../fixtures/cart'
import type { Cart } from '../../../src/cart/cart.types'

const BASE_URL = 'https://test.example.com/occ/v2/test-site'

// In-memory cart state for realistic handler behavior
let anonCart: Cart | null = null
let userCart: Cart | null = null

/** Reset cart state between tests */
export function resetCartState(): void {
  anonCart = null
  userCart = null
}

export const cartHandlers = [
  // ── Create Cart (POST /users/:userId/carts) ─────────────────────────
  http.post(`${BASE_URL}/users/:userId/carts`, ({ params, request }) => {
    const { userId } = params
    const url = new URL(request.url)

    // Cart merge flow: oldCartId + toMergeCartGuid present
    const oldCartId = url.searchParams.get('oldCartId')
    const toMergeCartGuid = url.searchParams.get('toMergeCartGuid')

    if (userId === 'current' && oldCartId && toMergeCartGuid) {
      // Merge anonymous cart into user cart
      const mergedCart = createCart({
        code: 'merged-cart-001',
        guid: undefined, // Authenticated carts don't need GUID
        entries: [
          createCartEntry({ entryNumber: 0 }),
          createCartEntry({ entryNumber: 1 }),
        ],
      })
      userCart = mergedCart
      return HttpResponse.json(mergedCart)
    }

    if (userId === 'anonymous') {
      const newCart = createEmptyCart({
        code: 'anon-cart-001',
        guid: 'anon-guid-001',
      })
      anonCart = newCart
      return HttpResponse.json(newCart)
    }

    // Authenticated cart creation
    const newCart = createEmptyCart({
      code: 'user-cart-001',
      guid: undefined,
    })
    userCart = newCart
    return HttpResponse.json(newCart)
  }),

  // ── Get Cart (GET /users/:userId/carts/:cartId) ─────────────────────
  http.get(`${BASE_URL}/users/:userId/carts/:cartId`, ({ params }) => {
    const { userId, cartId } = params

    if (cartId === 'NOT_FOUND') {
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
    }

    if (userId === 'anonymous') {
      // Return the anonymous cart matching the GUID
      if (anonCart && (anonCart.guid === cartId || anonCart.code === cartId)) {
        return HttpResponse.json(anonCart)
      }
      // If no matching anon cart, return a default one
      const cart = createCart({
        code: 'anon-cart-001',
        guid: cartId as string,
      })
      anonCart = cart
      return HttpResponse.json(cart)
    }

    // Authenticated: "current" is a special cartId that returns the most recent cart
    if (userId === 'current') {
      if (userCart) {
        return HttpResponse.json(userCart)
      }
      const cart = createCart({
        code: cartId as string,
        guid: undefined,
      })
      userCart = cart
      return HttpResponse.json(cart)
    }

    return HttpResponse.json(
      {
        errors: [
          { type: 'CartError', message: 'Cart not found', reason: 'notFound' },
        ],
      },
      { status: 404 },
    )
  }),

  // ── Add Entry (POST /users/:userId/carts/:cartId/entries) ───────────
  http.post(
    `${BASE_URL}/users/:userId/carts/:cartId/entries`,
    async ({ request }) => {
      const body = (await request.json()) as {
        product: { code: string }
        quantity: number
      }

      const newEntry = createCartEntry({
        entryNumber: 0,
        product: {
          code: body.product.code,
          name: `Product ${body.product.code}`,
          images: [],
        },
        quantity: body.quantity ?? 1,
      })

      return HttpResponse.json(
        createCartModification({
          entry: newEntry,
          quantity: body.quantity ?? 1,
          quantityAdded: body.quantity ?? 1,
        }),
      )
    },
  ),

  // ── Update Entry (PATCH /users/:userId/carts/:cartId/entries/:entryNumber) ──
  http.patch(
    `${BASE_URL}/users/:userId/carts/:cartId/entries/:entryNumber`,
    async ({ request, params }) => {
      const body = (await request.json()) as { quantity: number }
      const { entryNumber } = params

      return HttpResponse.json(
        createCartModification({
          entry: createCartEntry({
            entryNumber: Number(entryNumber),
            quantity: body.quantity,
          }),
          quantity: body.quantity,
          quantityAdded: body.quantity,
        }),
      )
    },
  ),

  // ── Remove Entry (DELETE /users/:userId/carts/:cartId/entries/:entryNumber) ──
  http.delete(
    `${BASE_URL}/users/:userId/carts/:cartId/entries/:entryNumber`,
    () => {
      return new HttpResponse(null, { status: 204 })
    },
  ),

  // ── Apply Voucher (POST /users/:userId/carts/:cartId/vouchers) ──────
  http.post(
    `${BASE_URL}/users/:userId/carts/:cartId/vouchers`,
    ({ request }) => {
      const url = new URL(request.url)
      const voucherId = url.searchParams.get('voucherId')

      if (voucherId === 'INVALID_VOUCHER') {
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
      }

      return new HttpResponse(null, { status: 200 })
    },
  ),

  // ── Remove Voucher (DELETE /users/:userId/carts/:cartId/vouchers/:voucherId) ──
  http.delete(
    `${BASE_URL}/users/:userId/carts/:cartId/vouchers/:voucherId`,
    () => {
      return new HttpResponse(null, { status: 204 })
    },
  ),

  // ── Saved Carts (GET /users/current/carts?savedCartsOnly=true) ──────
  // This is handled by the general GET /users/:userId/carts/:cartId handler above
  // for individual carts, but the list endpoint is different.
  http.get(`${BASE_URL}/users/current/carts`, ({ request }) => {
    const url = new URL(request.url)
    const savedCartsOnly = url.searchParams.get('savedCartsOnly')

    if (savedCartsOnly === 'true') {
      return HttpResponse.json({
        carts: [
          createCart({
            code: 'saved-cart-001',
            name: 'My Saved Cart',
            description: 'A saved cart for later',
            savedTime: new Date().toISOString(),
          }),
          createCart({
            code: 'saved-cart-002',
            name: 'Holiday Wishlist',
            description: 'Items for the holidays',
            savedTime: new Date().toISOString(),
          }),
        ],
      })
    }

    // Regular cart list (not saved carts)
    return HttpResponse.json({
      carts: userCart ? [userCart] : [],
    })
  }),

  // ── Save Cart (PATCH /users/current/carts/:cartId/save) ─────────────
  http.patch(`${BASE_URL}/users/current/carts/:cartId/save`, ({ request }) => {
    const url = new URL(request.url)
    const saveCartName = url.searchParams.get('saveCartName')
    const saveCartDescription = url.searchParams.get('saveCartDescription')

    return HttpResponse.json(
      createSaveCartResult({
        name: saveCartName ?? 'Saved Cart',
        description: saveCartDescription ?? '',
      }),
    )
  }),

  // ── Restore Cart (PATCH /users/current/carts/:cartId/restoresavedcart) ──
  http.patch(
    `${BASE_URL}/users/current/carts/:cartId/restoresavedcart`,
    ({ params }) => {
      const { cartId } = params
      return HttpResponse.json(
        createSaveCartResult({
          code: cartId as string,
        }),
      )
    },
  ),

  // ── Clone Cart (POST /users/current/carts/:cartId/clonesavedcart) ───
  http.post(
    `${BASE_URL}/users/current/carts/:cartId/clonesavedcart`,
    () => {
      return HttpResponse.json(
        createSaveCartResult({
          code: 'cloned-cart-001',
        }),
      )
    },
  ),

  // ── Delete Cart (DELETE /users/current/carts/:cartId) ───────────────
  http.delete(`${BASE_URL}/users/current/carts/:cartId`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
