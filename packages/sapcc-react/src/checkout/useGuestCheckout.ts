import { useCallback, useContext } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { CartContext } from '../cart/CartContext'
import type { Cart } from '../cart/cart.types'

/**
 * Hook for guest checkout — sets a guest email on the cart.
 *
 * In SAP Commerce Cloud, guest checkout requires setting an email
 * on the cart via `PUT /users/{userId}/carts/{cartId}/email`.
 * After the email is set, the standard checkout flow
 * (delivery address → delivery mode → payment → place order) proceeds.
 *
 * Must be used within a `<SapccProvider>`.
 *
 * @returns The current guest email and a mutation to set it
 *
 * @example
 * ```tsx
 * function GuestCheckoutForm() {
 *   const { guestEmail, setGuestEmail } = useGuestCheckout()
 *
 *   return (
 *     <div>
 *       {guestEmail && <p>Checking out as: {guestEmail}</p>}
 *       <input
 *         type="email"
 *         placeholder="Enter email for guest checkout"
 *         onBlur={(e) => setGuestEmail.mutate(e.target.value)}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */
export function useGuestCheckout() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error(
      'useGuestCheckout must be used within a <SapccProvider>. ' +
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

  // ── Set guest email mutation ───────────────────────────────────────

  const setGuestEmail = useMutation({
    mutationFn: async (email: string) => {
      const activeCart = await ensureCart()
      await client.put(
        `${getCartPath(activeCart)}/email`,
        undefined,
        { email },
      )
    },
    onSettled: async () => {
      await refreshCart()
    },
  })

  return {
    /** Current guest email (from cart.user.uid, null if not set) */
    guestEmail: cart?.user?.uid ?? null,
    /** Mutation to set the guest email on the cart */
    setGuestEmail,
  }
}
