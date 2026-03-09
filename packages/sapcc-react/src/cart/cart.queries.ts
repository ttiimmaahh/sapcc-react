import { queryOptions } from '@tanstack/react-query'
import type { OccClient } from '../http/occ-client'
import type { Cart, UseCartOptions, UseSavedCartsOptions } from './cart.types'

/** 10 seconds — cart data changes frequently during shopping */
const CART_STALE_TIME = 10 * 1000

/** 30 seconds — saved carts change less frequently */
const SAVED_CARTS_STALE_TIME = 30 * 1000

/**
 * TanStack Query option factories for SAP Commerce Cloud cart endpoints.
 *
 * Each factory returns a `queryOptions()` object suitable for `useQuery()`.
 * Keys are namespaced under `['sapcc', 'cart', ...]`.
 *
 * @example
 * ```ts
 * const client = useSapccClient()
 *
 * // Active cart
 * const { data } = useQuery(cartQueries.active(client, 'current', '00001234'))
 *
 * // Saved carts
 * const { data } = useQuery(cartQueries.savedCarts(client))
 * ```
 */
export const cartQueries = {
  /**
   * Fetches the active cart for a user.
   *
   * @param client - OccClient instance
   * @param userId - 'anonymous' or 'current'
   * @param cartId - Cart code (authenticated) or GUID (anonymous)
   * @param options - Optional fields level and enabled flag
   */
  active: (
    client: OccClient,
    userId: string,
    cartId: string,
    options: UseCartOptions = {},
  ) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'cart',
        'active',
        userId,
        cartId,
        options.fields ?? 'FULL',
      ] as const,
      queryFn: async () => {
        const response = await client.get<Cart>(
          `/users/${encodeURIComponent(userId)}/carts/${encodeURIComponent(cartId)}`,
          { fields: options.fields ?? 'FULL' },
        )
        return response.data
      },
      staleTime: CART_STALE_TIME,
      enabled: (options.enabled ?? true) && Boolean(cartId),
    }),

  /**
   * Fetches all carts for the current user (for cart list / saved carts).
   *
   * @param client - OccClient instance
   * @param options - Optional fields level and enabled flag
   */
  savedCarts: (client: OccClient, options: UseSavedCartsOptions = {}) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'cart',
        'saved',
        options.fields ?? 'DEFAULT',
      ] as const,
      queryFn: async () => {
        const response = await client.get<{ carts?: Cart[] }>(
          '/users/current/carts',
          {
            savedCartsOnly: true,
            fields: options.fields ?? 'DEFAULT',
          },
        )
        return response.data.carts ?? []
      },
      staleTime: SAVED_CARTS_STALE_TIME,
      enabled: options.enabled ?? true,
    }),
} as const
