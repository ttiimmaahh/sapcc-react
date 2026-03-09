import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SapccContext } from '../provider/SapccContext'
import { AuthContext } from '../auth/AuthContext'
import type { Cart, CartStorage as CartStorageType } from './cart.types'
import { CartContext, type CartContextValue } from './CartContext'
import { createCartStorage } from './cart-storage'

/**
 * Internal cart provider that manages the cart lifecycle.
 *
 * This provider:
 * 1. Detects existing anonymous carts via CartStorage (localStorage GUID)
 * 2. Creates new carts on demand (lazy — only when first mutation occurs)
 * 3. Tracks the active cart identifier (code for auth, GUID for anonymous)
 * 4. Switches userId from 'anonymous' to 'current' based on auth state
 * 5. Provides cart actions via CartContext for child hooks
 *
 * Placed inside SapccProvider, after AuthProvider (if present).
 *
 * @internal
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const sapccContext = useContext(SapccContext)
  if (!sapccContext) {
    throw new Error('CartProvider must be used within a <SapccProvider>')
  }

  const { client } = sapccContext
  const queryClient = useQueryClient()

  // Auth context may not be available (no auth config)
  const authContext = useContext(AuthContext)
  const isAuthenticated = authContext?.isAuthenticated ?? false

  const userId = isAuthenticated ? 'current' : 'anonymous'

  // ── Stable refs for storage (created once) ──────────────────────────

  const storageRef = useRef<CartStorageType | null>(null)
  storageRef.current ??= createCartStorage()
  const cartStorage = storageRef.current

  // ── Cart state ──────────────────────────────────────────────────────

  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // The active cart identifier: code (auth) or GUID (anon)
  const cartId = useMemo(() => {
    if (cart) {
      return isAuthenticated ? cart.code : (cart.guid ?? cart.code)
    }
    // Check storage for persisted anonymous GUID
    if (!isAuthenticated) {
      return cartStorage.getCartGuid()
    }
    return null
  }, [cart, isAuthenticated, cartStorage])

  const isAnonymous = !isAuthenticated

  // Track previous auth state to detect anonymous → authenticated transitions
  const prevAuthRef = useRef(isAuthenticated)

  // ── Load existing cart on mount / auth change (with merge) ────────

  useEffect(() => {
    let cancelled = false
    const wasAuthenticated = prevAuthRef.current
    prevAuthRef.current = isAuthenticated

    async function loadCart() {
      // Detect anonymous → authenticated transition (login)
      const justLoggedIn = isAuthenticated && !wasAuthenticated
      const storedAnonGuid = cartStorage.getCartGuid()

      setIsLoading(true)
      try {
        // If user just logged in and has an anonymous cart, merge it
        if (justLoggedIn && storedAnonGuid) {
          // POST /users/current/carts with merge params
          const response = await client.post<Cart>(
            '/users/current/carts',
            undefined,
            {
              oldCartId: storedAnonGuid,
              toMergeCartGuid: storedAnonGuid,
              fields: 'FULL',
            },
          )
          // Clear anonymous GUID — it's been merged into the user cart
          cartStorage.removeCartGuid()
          if (!cancelled) {
            setCart(response.data)
          }
          return
        }

        // For anonymous users, check if we have a persisted GUID
        const storedGuid = !isAuthenticated ? storedAnonGuid : null

        // For authenticated users, try to load the most recent cart
        // For anonymous users, load the cart if we have a stored GUID
        if (isAuthenticated || storedGuid) {
          const loadCartId = isAuthenticated ? 'current' : storedGuid ?? ''
          const response = await client.get<Cart>(
            `/users/${encodeURIComponent(userId)}/carts/${encodeURIComponent(loadCartId)}`,
            { fields: 'FULL' },
          )
          if (!cancelled) {
            setCart(response.data)
          }
        } else if (!cancelled) {
          setCart(null)
        }
      } catch {
        // Cart doesn't exist or is expired — clear storage
        if (!cancelled) {
          if (!isAuthenticated) {
            cartStorage.removeCartGuid()
          }
          setCart(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }
    }

    void loadCart()

    return () => {
      cancelled = true
    }
    // Re-run when auth state changes
  }, [isAuthenticated, userId, client, cartStorage])

  // ── Cart actions ──────────────────────────────────────────────────

  const createCart = useCallback(async (): Promise<Cart> => {
    setIsLoading(true)
    try {
      const response = await client.post<Cart>(
        `/users/${encodeURIComponent(userId)}/carts`,
      )
      const newCart = response.data
      setCart(newCart)

      // Persist anonymous cart GUID
      if (!isAuthenticated && newCart.guid) {
        cartStorage.setCartGuid(newCart.guid)
      }

      return newCart
    } finally {
      setIsLoading(false)
    }
  }, [client, userId, isAuthenticated, cartStorage])

  const ensureCart = useCallback(async (): Promise<Cart> => {
    if (cart) return cart
    return createCart()
  }, [cart, createCart])

  const refreshCart = useCallback(async (): Promise<void> => {
    if (!cartId) return

    try {
      const response = await client.get<Cart>(
        `/users/${encodeURIComponent(userId)}/carts/${encodeURIComponent(cartId)}`,
        { fields: 'FULL' },
      )
      setCart(response.data)
    } catch {
      // If cart is gone, clear it
      setCart(null)
      if (!isAuthenticated) {
        cartStorage.removeCartGuid()
      }
    }

    // Also invalidate TanStack Query cache for cart queries
    void queryClient.invalidateQueries({ queryKey: ['sapcc', 'cart'] })
  }, [cartId, client, userId, isAuthenticated, cartStorage, queryClient])

  const setActiveCart = useCallback(
    (newCart: Cart) => {
      setCart(newCart)
      if (!isAuthenticated && newCart.guid) {
        cartStorage.setCartGuid(newCart.guid)
      }
    },
    [isAuthenticated, cartStorage],
  )

  // ── Context value ────────────────────────────────────────────────

  const contextValue = useMemo<CartContextValue>(
    () => ({
      cart,
      isLoading,
      isInitialized,
      cartId,
      userId,
      isAnonymous,
      cartStorage,
      createCart,
      ensureCart,
      refreshCart,
      setActiveCart,
    }),
    [
      cart,
      isLoading,
      isInitialized,
      cartId,
      userId,
      isAnonymous,
      cartStorage,
      createCart,
      ensureCart,
      refreshCart,
      setActiveCart,
    ],
  )

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
}
