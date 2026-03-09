import { createContext } from 'react'
import type { Cart, CartStorage } from './cart.types'

/**
 * Values exposed by the CartContext to child hooks.
 */
export interface CartContextValue {
  /** The active cart data (null if no cart exists yet) */
  cart: Cart | null
  /** Whether the cart is currently loading */
  isLoading: boolean
  /** Whether the cart has been initialized (initial load attempted) */
  isInitialized: boolean
  /** The active cart identifier (code for auth, GUID for anonymous) */
  cartId: string | null
  /** The current user scope ('anonymous' or 'current') */
  userId: string
  /** Whether the user is anonymous */
  isAnonymous: boolean
  /** CartStorage instance for GUID persistence */
  cartStorage: CartStorage
  /** Creates a new cart and returns it */
  createCart: () => Promise<Cart>
  /** Ensures a cart exists (returns existing or creates new) */
  ensureCart: () => Promise<Cart>
  /** Refreshes the active cart data */
  refreshCart: () => Promise<void>
  /** Sets the active cart (used internally after merge) */
  setActiveCart: (cart: Cart) => void
}

/**
 * React context for cart state and actions.
 *
 * @internal — consumed by useCart, useCartEntries, useCartVouchers, etc.
 */
export const CartContext = createContext<CartContextValue | null>(null)
