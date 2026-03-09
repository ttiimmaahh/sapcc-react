import { useCallback, useContext } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { CartContext } from '../cart/CartContext'
import type { Cart } from '../cart/cart.types'
import type { SetDeliveryAddressParams } from './checkout.types'

/**
 * Hook for managing the delivery address on the active cart.
 *
 * Provides the current delivery address (read from cart data) and a
 * mutation to set/update the delivery address.
 *
 * Must be used within a `<SapccProvider>`.
 *
 * @returns The current delivery address and a mutation to set it
 *
 * @example
 * ```tsx
 * function DeliveryAddressForm() {
 *   const { deliveryAddress, setDeliveryAddress } = useDeliveryAddress()
 *
 *   const handleSubmit = (address: SetDeliveryAddressParams) => {
 *     setDeliveryAddress.mutate(address)
 *   }
 *
 *   return (
 *     <div>
 *       {deliveryAddress && <p>Current: {deliveryAddress.formattedAddress}</p>}
 *       <button onClick={() => handleSubmit(addressData)}>
 *         Set Address
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useDeliveryAddress() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error(
      'useDeliveryAddress must be used within a <SapccProvider>. ' +
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

  // ── Set delivery address mutation ──────────────────────────────────

  const setDeliveryAddress = useMutation({
    mutationFn: async (params: SetDeliveryAddressParams) => {
      const activeCart = await ensureCart()
      await client.put<Cart>(
        `${getCartPath(activeCart)}/addresses/delivery`,
        params,
      )
    },
    onSettled: async () => {
      await refreshCart()
    },
  })

  return {
    /** Current delivery address on the cart (null if not set) */
    deliveryAddress: cart?.deliveryAddress ?? null,
    /** Mutation to set the delivery address on the cart */
    setDeliveryAddress,
  }
}
