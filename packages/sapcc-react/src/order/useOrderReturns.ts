import { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { AuthContext } from '../auth/AuthContext'
import { orderQueries } from './order.queries'
import type { UseOrderReturnsOptions } from './order.types'

/**
 * Hook for fetching the current user's paginated return request list.
 *
 * Returns a TanStack Query result containing a {@link ReturnRequestListPage}
 * with return requests, pagination info, and available sort options.
 *
 * Automatically disabled when the user is not authenticated.
 *
 * Must be used within a `<SapccProvider>` with auth configured.
 *
 * @param options - Pagination, sorting, fields, and enabled options
 * @returns TanStack Query result with return request list data
 *
 * @example
 * ```tsx
 * function MyReturns() {
 *   const returns = useOrderReturns({ pageSize: 10 })
 *
 *   if (returns.isLoading) return <p>Loading returns...</p>
 *
 *   return (
 *     <ul>
 *       {returns.data?.returnRequests?.map((ret) => (
 *         <li key={ret.rma}>
 *           RMA: {ret.rma} — Status: {ret.status}
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useOrderReturns(options: UseOrderReturnsOptions = {}) {
  const client = useSapccClient()
  const authContext = useContext(AuthContext)

  const isAuthenticated = authContext?.isAuthenticated ?? false

  return useQuery(
    orderQueries.returnRequests(client, {
      ...options,
      enabled: (options.enabled ?? true) && isAuthenticated,
    }),
  )
}
