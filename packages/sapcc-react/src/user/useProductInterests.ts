import { useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { AuthContext } from '../auth/AuthContext'
import { userQueries } from './user.queries'
import type {
  ProductInterestRelation,
  AddProductInterestParams,
  RemoveProductInterestParams,
  UseProductInterestsOptions,
} from './user.types'

/**
 * Hook for managing the current user's product interest subscriptions.
 *
 * Product interests allow users to subscribe to notifications for products
 * (e.g., back-in-stock alerts, price reductions).
 *
 * Provides a paginated query and mutations for:
 * - Adding a product interest (subscribing to a notification type)
 * - Removing a product interest (unsubscribing)
 *
 * Note: Product interest add/remove uses query parameters, not request body,
 * following the SAP Commerce OCC API pattern.
 *
 * Must be used within a `<SapccProvider>` with auth configured.
 *
 * @param options - Pagination, filtering, fields, and enabled options
 * @returns Product interests query data and mutation objects
 *
 * @example
 * ```tsx
 * function ProductWatchlist() {
 *   const {
 *     productInterests,
 *     addInterest,
 *     removeInterest,
 *   } = useProductInterests({ pageSize: 20 })
 *
 *   if (productInterests.isLoading) return <p>Loading...</p>
 *
 *   return (
 *     <ul>
 *       {productInterests.data?.results?.map((item) => (
 *         <li key={item.product.code}>
 *           {item.product.name}
 *           {item.productInterestEntry?.map((entry) => (
 *             <span key={entry.interestType}> ({entry.interestType})</span>
 *           ))}
 *           <button onClick={() => removeInterest.mutate({
 *             productCode: item.product.code!,
 *             notificationType: item.productInterestEntry?.[0]?.interestType ?? 'BACK_IN_STOCK',
 *           })}>
 *             Unsubscribe
 *           </button>
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useProductInterests(options: UseProductInterestsOptions = {}) {
  const client = useSapccClient()
  const queryClient = useQueryClient()
  const authContext = useContext(AuthContext)

  const isAuthenticated = authContext?.isAuthenticated ?? false

  // ── Product interests query ──────────────────────────────────────────

  const productInterests = useQuery(
    userQueries.productInterests(client, {
      ...options,
      enabled: (options.enabled ?? true) && isAuthenticated,
    }),
  )

  // ── Helper: invalidate product interests ─────────────────────────────

  const invalidateInterests = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['sapcc', 'user', 'interests'],
    })
  }

  // ── Add product interest mutation ────────────────────────────────────

  const addInterest = useMutation({
    mutationFn: async (params: AddProductInterestParams) => {
      // OCC API uses query parameters for product interest creation
      const response = await client.post<ProductInterestRelation>(
        '/users/current/productinterests',
        undefined,
        {
          productCode: params.productCode,
          notificationType: params.notificationType,
        },
      )
      return response.data
    },
    onSettled: async () => {
      await invalidateInterests()
    },
  })

  // ── Remove product interest mutation ─────────────────────────────────

  const removeInterest = useMutation({
    mutationFn: async (params: RemoveProductInterestParams) => {
      // OCC API uses query parameters for product interest deletion
      await client.delete<undefined>('/users/current/productinterests', {
        productCode: params.productCode,
        notificationType: params.notificationType,
      })
    },
    onSettled: async () => {
      await invalidateInterests()
    },
  })

  return {
    /** Product interests paginated query result (ProductInterestSearchResult) */
    productInterests,
    /** Mutation to add a product interest subscription */
    addInterest,
    /** Mutation to remove a product interest subscription */
    removeInterest,
  }
}
