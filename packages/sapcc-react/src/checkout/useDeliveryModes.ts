import { useCallback, useContext } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { CartContext } from '../cart/CartContext'
import type { Cart } from '../cart/cart.types'
import type { UseDeliveryModesOptions } from './checkout.types'
import { checkoutQueries } from './checkout.queries'

/**
 * Hook for managing delivery modes on the active cart.
 *
 * Fetches available delivery modes (via `useQuery`) and provides
 * a mutation to select a delivery mode. Delivery modes are only
 * available after a delivery address has been set on the cart.
 *
 * Must be used within a `<SapccProvider>`.
 *
 * @param options - Optional configuration (enabled flag)
 * @returns Available delivery modes, selected mode, and mutation to set mode
 *
 * @example
 * ```tsx
 * function DeliveryModeSelector() {
 *   const { deliveryModes, selectedMode, setDeliveryMode } = useDeliveryModes()
 *
 *   return (
 *     <select
 *       value={selectedMode?.code ?? ''}
 *       onChange={(e) => setDeliveryMode.mutate(e.target.value)}
 *     >
 *       {deliveryModes?.map((mode) => (
 *         <option key={mode.code} value={mode.code}>
 *           {mode.name} — {mode.deliveryCost?.formattedValue}
 *         </option>
 *       ))}
 *     </select>
 *   )
 * }
 * ```
 */
export function useDeliveryModes(options: UseDeliveryModesOptions = {}) {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error(
      'useDeliveryModes must be used within a <SapccProvider>. ' +
        'Ensure your component tree is wrapped with <SapccProvider>.',
    )
  }

  const client = useSapccClient()
  const { userId, cartId, cart, ensureCart, refreshCart } = context

  // ── Query: list available delivery modes ───────────────────────────

  const deliveryModesQuery = useQuery(
    checkoutQueries.deliveryModes(client, userId, cartId ?? '', {
      enabled: (options.enabled ?? true) && Boolean(cartId),
    }),
  )

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

  // ── Set delivery mode mutation ─────────────────────────────────────

  const setDeliveryMode = useMutation({
    mutationFn: async (deliveryModeId: string) => {
      const activeCart = await ensureCart()
      await client.put<Cart>(
        `${getCartPath(activeCart)}/deliverymode`,
        undefined,
        { deliveryModeId },
      )
    },
    onSettled: async () => {
      await refreshCart()
    },
  })

  return {
    /** Available delivery modes for the cart */
    deliveryModes: deliveryModesQuery.data ?? [],
    /** Whether delivery modes are loading */
    isLoading: deliveryModesQuery.isLoading,
    /** Currently selected delivery mode on the cart */
    selectedMode: cart?.deliveryMode ?? null,
    /** Mutation to set the delivery mode (pass the mode code) */
    setDeliveryMode,
  }
}
