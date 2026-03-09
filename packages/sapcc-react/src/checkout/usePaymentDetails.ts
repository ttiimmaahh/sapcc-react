import { useCallback, useContext } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { CartContext } from '../cart/CartContext'
import type { Cart } from '../cart/cart.types'
import type { PaymentDetails, SetPaymentDetailsParams } from './checkout.types'

/**
 * Hook for managing payment details on the active cart.
 *
 * Provides the current payment details (read from cart data) and a
 * mutation to create/set payment details on the cart.
 *
 * Must be used within a `<SapccProvider>`.
 *
 * @returns The current payment details and a mutation to set them
 *
 * @example
 * ```tsx
 * function PaymentForm() {
 *   const { paymentDetails, setPaymentDetails } = usePaymentDetails()
 *
 *   const handleSubmit = (data: SetPaymentDetailsParams) => {
 *     setPaymentDetails.mutate(data)
 *   }
 *
 *   return (
 *     <div>
 *       {paymentDetails && <p>Card ending in {paymentDetails.cardNumber}</p>}
 *       <button onClick={() => handleSubmit(paymentData)}>
 *         Set Payment
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function usePaymentDetails() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error(
      'usePaymentDetails must be used within a <SapccProvider>. ' +
        'Ensure your component tree is wrapped with <SapccProvider>.',
    )
  }

  const client = useSapccClient()
  const { userId, cart, ensureCart, refreshCart } = context

  // ── Helper: get cart path ──────────────────────────────────────────

  const getCartPath = useCallback(
    (activeCart: Cart) => {
      const cartIdentifier =
        userId === 'anonymous'
          ? (activeCart.guid ?? activeCart.code)
          : activeCart.code
      return `/users/${encodeURIComponent(userId)}/carts/${encodeURIComponent(cartIdentifier)}`
    },
    [userId],
  )

  // ── Set payment details mutation ───────────────────────────────────

  const setPaymentDetails = useMutation({
    mutationFn: async (params: SetPaymentDetailsParams): Promise<PaymentDetails> => {
      const activeCart = await ensureCart()
      const response = await client.post<PaymentDetails>(
        `${getCartPath(activeCart)}/paymentdetails`,
        params,
      )
      return response.data
    },
    onSettled: async () => {
      await refreshCart()
    },
  })

  return {
    /** Current payment details on the cart (null if not set) */
    paymentDetails: cart?.paymentInfo ?? null,
    /** Mutation to create/set payment details on the cart */
    setPaymentDetails,
  }
}
