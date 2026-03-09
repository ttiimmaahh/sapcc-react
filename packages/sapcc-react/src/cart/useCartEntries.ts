import { useCallback, useContext } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { CartContext } from './CartContext'
import type { Cart, CartModification, AddEntryParams, UpdateEntryParams } from './cart.types'

/**
 * Hook for cart entry mutations: add, update, and remove entries.
 *
 * All mutations include optimistic updates — the UI updates immediately
 * while the server request is in flight, and rolls back on error.
 *
 * Must be used within a `<SapccProvider>`.
 *
 * @returns Mutation functions for managing cart entries
 *
 * @example
 * ```tsx
 * function AddToCartButton({ productCode }: { productCode: string }) {
 *   const { addEntry } = useCartEntries()
 *
 *   return (
 *     <button
 *       disabled={addEntry.isPending}
 *       onClick={() => addEntry.mutate({ productCode, quantity: 1 })}
 *     >
 *       Add to Cart
 *     </button>
 *   )
 * }
 * ```
 */
export function useCartEntries() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error(
      'useCartEntries must be used within a <SapccProvider>. ' +
        'Ensure your component tree is wrapped with <SapccProvider>.',
    )
  }

  const client = useSapccClient()
  const queryClient = useQueryClient()

  const { userId, ensureCart, refreshCart, setActiveCart, cart: currentCart } = context

  // ── Helper: get cart path ──────────────────────────────────────────

  const getCartPath = useCallback(
    (activeCart: Cart) => {
      const cartIdentifier =
        userId === 'anonymous' ? (activeCart.guid ?? activeCart.code) : activeCart.code
      return `/users/${encodeURIComponent(userId)}/carts/${encodeURIComponent(cartIdentifier)}`
    },
    [userId],
  )

  // ── Add Entry ──────────────────────────────────────────────────────

  const addEntry = useMutation({
    mutationFn: async (params: AddEntryParams) => {
      const activeCart = await ensureCart()
      const response = await client.post<CartModification>(
        `${getCartPath(activeCart)}/entries`,
        {
          product: { code: params.productCode },
          quantity: params.quantity ?? 1,
        },
      )
      return response.data
    },
    onMutate: async (params: AddEntryParams) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['sapcc', 'cart'] })

      // Snapshot previous cart for rollback
      const previousCart = currentCart

      // Optimistically add the entry
      if (currentCart) {
        const optimisticEntry = {
          entryNumber: currentCart.entries?.length ?? 0,
          product: { code: params.productCode, name: params.productCode, images: [] },
          quantity: params.quantity ?? 1,
        }

        const optimisticCart: Cart = {
          ...currentCart,
          entries: [...(currentCart.entries ?? []), optimisticEntry],
          totalItems: (currentCart.totalItems ?? 0) + 1,
          totalUnitCount: (currentCart.totalUnitCount ?? 0) + (params.quantity ?? 1),
        }
        setActiveCart(optimisticCart)
      }

      return { previousCart }
    },
    onError: (_error, _params, rollbackContext) => {
      // Roll back to the previous cart state
      if (rollbackContext?.previousCart) {
        setActiveCart(rollbackContext.previousCart)
      }
    },
    onSettled: async () => {
      // Always refresh the cart from the server after mutation
      await refreshCart()
    },
  })

  // ── Update Entry ───────────────────────────────────────────────────

  const updateEntry = useMutation({
    mutationFn: async (params: UpdateEntryParams) => {
      const activeCart = await ensureCart()
      const response = await client.patch<CartModification>(
        `${getCartPath(activeCart)}/entries/${String(params.entryNumber)}`,
        { quantity: params.quantity },
      )
      return response.data
    },
    onMutate: async (params: UpdateEntryParams) => {
      await queryClient.cancelQueries({ queryKey: ['sapcc', 'cart'] })
      const previousCart = currentCart

      if (currentCart?.entries) {
        const optimisticEntries = currentCart.entries.map((entry) =>
          entry.entryNumber === params.entryNumber
            ? { ...entry, quantity: params.quantity }
            : entry,
        )
        const optimisticCart: Cart = {
          ...currentCart,
          entries: optimisticEntries,
          totalUnitCount: optimisticEntries.reduce((sum, e) => sum + e.quantity, 0),
        }
        setActiveCart(optimisticCart)
      }

      return { previousCart }
    },
    onError: (_error, _params, rollbackContext) => {
      if (rollbackContext?.previousCart) {
        setActiveCart(rollbackContext.previousCart)
      }
    },
    onSettled: async () => {
      await refreshCart()
    },
  })

  // ── Remove Entry ───────────────────────────────────────────────────

  const removeEntry = useMutation({
    mutationFn: async (entryNumber: number) => {
      const activeCart = await ensureCart()
      await client.delete(
        `${getCartPath(activeCart)}/entries/${String(entryNumber)}`,
      )
    },
    onMutate: async (entryNumber: number) => {
      await queryClient.cancelQueries({ queryKey: ['sapcc', 'cart'] })
      const previousCart = currentCart

      if (currentCart?.entries) {
        const optimisticEntries = currentCart.entries.filter(
          (entry) => entry.entryNumber !== entryNumber,
        )
        const optimisticCart: Cart = {
          ...currentCart,
          entries: optimisticEntries,
          totalItems: optimisticEntries.length,
          totalUnitCount: optimisticEntries.reduce((sum, e) => sum + e.quantity, 0),
        }
        setActiveCart(optimisticCart)
      }

      return { previousCart }
    },
    onError: (_error, _params, rollbackContext) => {
      if (rollbackContext?.previousCart) {
        setActiveCart(rollbackContext.previousCart)
      }
    },
    onSettled: async () => {
      await refreshCart()
    },
  })

  return {
    /** Add a product to the cart */
    addEntry,
    /** Update an entry's quantity */
    updateEntry,
    /** Remove an entry from the cart */
    removeEntry,
  }
}
