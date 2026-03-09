import { useContext } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { CartContext } from '../cart/CartContext'
import type { Order, PlaceOrderParams } from './checkout.types'

/**
 * Hook for placing an order from the active cart.
 *
 * Sends `POST /users/{userId}/orders` with the cart ID and terms acceptance.
 * On success, invalidates cart queries (the cart becomes an order) and
 * returns the created Order.
 *
 * Must be used within a `<SapccProvider>`.
 *
 * @returns Mutation to place an order
 *
 * @example
 * ```tsx
 * function PlaceOrderButton() {
 *   const { placeOrder } = usePlaceOrder()
 *
 *   const handlePlaceOrder = async () => {
 *     const order = await placeOrder.mutateAsync({ termsChecked: true })
 *     console.log('Order placed:', order.code)
 *   }
 *
 *   return (
 *     <button
 *       disabled={placeOrder.isPending}
 *       onClick={handlePlaceOrder}
 *     >
 *       {placeOrder.isPending ? 'Placing...' : 'Place Order'}
 *     </button>
 *   )
 * }
 * ```
 */
export function usePlaceOrder() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error(
      'usePlaceOrder must be used within a <SapccProvider>. ' +
        'Ensure your component tree is wrapped with <SapccProvider>.',
    )
  }

  const client = useSapccClient()
  const queryClient = useQueryClient()
  const { userId, cartId } = context

  // ── Place order mutation ───────────────────────────────────────────

  const placeOrder = useMutation({
    mutationFn: async (params: PlaceOrderParams): Promise<Order> => {
      if (!cartId) {
        throw new Error('No active cart to place order from')
      }

      const queryParams: Record<string, string | boolean> = {
        cartId,
        termsChecked: params.termsChecked,
        fields: 'FULL',
      }

      if (params.securityCode) {
        queryParams.securityCode = params.securityCode
      }

      const response = await client.post<Order>(
        `/users/${encodeURIComponent(userId)}/orders`,
        undefined,
        queryParams,
      )
      return response.data
    },
    onSuccess: () => {
      // Invalidate all cart queries — the cart is now an order
      void queryClient.invalidateQueries({ queryKey: ['sapcc', 'cart'] })
      // Invalidate checkout queries too
      void queryClient.invalidateQueries({ queryKey: ['sapcc', 'checkout'] })
    },
  })

  return {
    /** Mutation to place an order from the active cart */
    placeOrder,
  }
}
