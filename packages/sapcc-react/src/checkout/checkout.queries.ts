import { queryOptions } from '@tanstack/react-query'
import type { OccClient } from '../http/occ-client'
import type { DeliveryModeList, UseDeliveryModesOptions } from './checkout.types'

/** 30 seconds — delivery modes rarely change during a session */
const DELIVERY_MODES_STALE_TIME = 30 * 1000

/**
 * TanStack Query option factories for SAP Commerce Cloud checkout endpoints.
 *
 * Each factory returns a `queryOptions()` object suitable for `useQuery()`.
 * Keys are namespaced under `['sapcc', 'checkout', ...]`.
 *
 * @example
 * ```ts
 * const client = useSapccClient()
 *
 * // Available delivery modes for a cart
 * const { data } = useQuery(checkoutQueries.deliveryModes(client, 'current', '00001234'))
 * ```
 */
export const checkoutQueries = {
  /**
   * Fetches available delivery modes for a cart.
   *
   * Delivery modes are only available after a delivery address has been set
   * on the cart. The `enabled` option defaults to true when a cartId is present.
   *
   * @param client - OccClient instance
   * @param userId - 'anonymous' or 'current'
   * @param cartId - Cart code (authenticated) or GUID (anonymous)
   * @param options - Optional enabled flag
   */
  deliveryModes: (
    client: OccClient,
    userId: string,
    cartId: string,
    options: UseDeliveryModesOptions = {},
  ) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'checkout',
        'deliveryModes',
        userId,
        cartId,
      ] as const,
      queryFn: async () => {
        const response = await client.get<DeliveryModeList>(
          `/users/${encodeURIComponent(userId)}/carts/${encodeURIComponent(cartId)}/deliverymodes`,
        )
        return response.data.deliveryModes ?? []
      },
      staleTime: DELIVERY_MODES_STALE_TIME,
      enabled: (options.enabled ?? true) && Boolean(cartId),
    }),
} as const
