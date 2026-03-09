import { useContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { AuthContext } from '../auth/AuthContext'
import { CartContext } from './CartContext'
import { cartQueries } from './cart.queries'
import type { Cart, SaveCartResult, SaveCartParams, UseSavedCartsOptions } from './cart.types'

/**
 * Hook for managing saved carts (save, restore, clone, delete).
 *
 * Saved carts are an authenticated-only feature. The hook is disabled
 * when the user is not authenticated.
 *
 * Must be used within a `<SapccProvider>` with auth configuration.
 *
 * @param options - Optional fields level and enabled flag
 * @returns Saved carts list and mutation functions
 *
 * @example
 * ```tsx
 * function SavedCartsList() {
 *   const { savedCarts, isLoading, restoreCart, deleteCart } = useSavedCarts()
 *
 *   if (isLoading) return <p>Loading saved carts...</p>
 *
 *   return (
 *     <ul>
 *       {savedCarts.map((cart) => (
 *         <li key={cart.code}>
 *           {cart.name} — {cart.totalItems} items
 *           <button onClick={() => restoreCart.mutate(cart.code)}>Restore</button>
 *           <button onClick={() => deleteCart.mutate(cart.code)}>Delete</button>
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useSavedCarts(options: UseSavedCartsOptions = {}) {
  const cartContext = useContext(CartContext)
  if (!cartContext) {
    throw new Error(
      'useSavedCarts must be used within a <SapccProvider>. ' +
        'Ensure your component tree is wrapped with <SapccProvider>.',
    )
  }

  const authContext = useContext(AuthContext)
  const isAuthenticated = authContext?.isAuthenticated ?? false

  const client = useSapccClient()
  const queryClient = useQueryClient()

  // Fetch saved carts (only when authenticated)
  const savedCartsQuery = useQuery(
    cartQueries.savedCarts(client, {
      ...options,
      enabled: (options.enabled ?? true) && isAuthenticated,
    }),
  )

  // ── Save Cart ──────────────────────────────────────────────────────

  const saveCart = useMutation({
    mutationFn: async ({
      cartId,
      ...params
    }: SaveCartParams & { cartId: string }) => {
      const response = await client.patch<SaveCartResult>(
        `/users/current/carts/${encodeURIComponent(cartId)}/save`,
        undefined,
        {
          saveCartName: params.saveCartName,
          saveCartDescription: params.saveCartDescription,
        },
      )
      return response.data.savedCartData
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sapcc', 'cart'] })
    },
  })

  // ── Restore Cart ───────────────────────────────────────────────────

  const restoreCart = useMutation({
    mutationFn: async (cartId: string) => {
      const response = await client.patch<SaveCartResult>(
        `/users/current/carts/${encodeURIComponent(cartId)}/restoresavedcart`,
      )
      return response.data.savedCartData
    },
    onSuccess: async (restoredCart: Cart) => {
      cartContext.setActiveCart(restoredCart)
      await queryClient.invalidateQueries({ queryKey: ['sapcc', 'cart'] })
    },
  })

  // ── Clone Cart ─────────────────────────────────────────────────────

  const cloneCart = useMutation({
    mutationFn: async (cartId: string) => {
      const response = await client.post<SaveCartResult>(
        `/users/current/carts/${encodeURIComponent(cartId)}/clonesavedcart`,
      )
      return response.data.savedCartData
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sapcc', 'cart'] })
    },
  })

  // ── Delete Cart ────────────────────────────────────────────────────

  const deleteCart = useMutation({
    mutationFn: async (cartId: string) => {
      await client.delete(`/users/current/carts/${encodeURIComponent(cartId)}`)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sapcc', 'cart'] })
    },
  })

  return {
    /** List of saved carts */
    savedCarts: savedCartsQuery.data ?? [],
    /** Whether saved carts are loading */
    isLoading: savedCartsQuery.isLoading,
    /** Whether the query errored */
    isError: savedCartsQuery.isError,
    /** Error if the query failed */
    error: savedCartsQuery.error,
    /** Save the current cart */
    saveCart,
    /** Restore a saved cart as the active cart */
    restoreCart,
    /** Clone a saved cart */
    cloneCart,
    /** Delete a saved cart */
    deleteCart,
  }
}
