import { useContext } from 'react'
import { CartContext } from './CartContext'

/**
 * Hook to access promotions applied to the active cart.
 *
 * This is a read-only hook — promotions are derived from the cart data
 * (no separate API call needed). The cart object already contains
 * applied and potential promotions.
 *
 * Must be used within a `<SapccProvider>`.
 *
 * @returns Applied and potential promotions from the active cart
 *
 * @example
 * ```tsx
 * function CartPromotions() {
 *   const { appliedOrderPromotions, appliedProductPromotions } = useCartPromotions()
 *
 *   return (
 *     <ul>
 *       {appliedOrderPromotions.map((p, i) => (
 *         <li key={i}>{p.description}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useCartPromotions() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error(
      'useCartPromotions must be used within a <SapccProvider>. ' +
        'Ensure your component tree is wrapped with <SapccProvider>.',
    )
  }

  const { cart } = context

  return {
    /** Order-level promotions currently applied to the cart */
    appliedOrderPromotions: cart?.appliedOrderPromotions ?? [],
    /** Product-level promotions currently applied to the cart */
    appliedProductPromotions: cart?.appliedProductPromotions ?? [],
    /** Potential order-level promotions that could be applied */
    potentialOrderPromotions: cart?.potentialOrderPromotions ?? [],
    /** Potential product-level promotions that could be applied */
    potentialProductPromotions: cart?.potentialProductPromotions ?? [],
    /** Whether any promotions are currently applied */
    hasPromotions:
      (cart?.appliedOrderPromotions?.length ?? 0) +
        (cart?.appliedProductPromotions?.length ?? 0) >
      0,
  }
}
