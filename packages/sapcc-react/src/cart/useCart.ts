import { useContext } from 'react'
import { CartContext } from './CartContext'

/**
 * Hook to access the active cart and cart lifecycle actions.
 *
 * Must be used within a `<SapccProvider>`.
 *
 * The cart is loaded automatically on mount:
 * - For anonymous users, loads from a persisted GUID (localStorage)
 * - For authenticated users, loads the user's most recent cart
 * - If no cart exists, one is created lazily on the first mutation (e.g., addEntry)
 *
 * @returns Cart state and lifecycle actions
 *
 * @example
 * ```tsx
 * function CartSummary() {
 *   const { cart, isLoading, isInitialized } = useCart()
 *
 *   if (!isInitialized || isLoading) return <p>Loading cart...</p>
 *   if (!cart || !cart.entries?.length) return <p>Your cart is empty</p>
 *
 *   return (
 *     <div>
 *       <p>{cart.totalItems} items</p>
 *       <p>Total: {cart.totalPrice?.formattedValue}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error(
      'useCart must be used within a <SapccProvider>. ' +
        'Ensure your component tree is wrapped with <SapccProvider>.',
    )
  }

  return {
    /** The active cart data (null if no cart exists yet) */
    cart: context.cart,
    /** Whether the cart is currently loading */
    isLoading: context.isLoading,
    /** Whether the cart has been initialized (initial load attempted) */
    isInitialized: context.isInitialized,
    /** The active cart identifier */
    cartId: context.cartId,
    /** Whether the user is anonymous */
    isAnonymous: context.isAnonymous,
    /** Creates a new cart */
    createCart: context.createCart,
    /** Ensures a cart exists (returns existing or creates new) */
    ensureCart: context.ensureCart,
    /** Refreshes the active cart data */
    refreshCart: context.refreshCart,
  }
}
