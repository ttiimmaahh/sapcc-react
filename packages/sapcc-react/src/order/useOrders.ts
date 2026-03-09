import { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { AuthContext } from '../auth/AuthContext'
import { orderQueries } from './order.queries'
import type { UseOrdersOptions } from './order.types'

/**
 * Hook for fetching the current user's paginated order history.
 *
 * Returns a TanStack Query result containing an {@link OrderHistoryPage}
 * with orders, pagination info, and available sort options.
 *
 * Automatically disabled when the user is not authenticated.
 *
 * Must be used within a `<SapccProvider>` with auth configured.
 *
 * @param options - Pagination, sorting, status filter, fields, and enabled options
 * @returns TanStack Query result with order history data
 *
 * @example
 * ```tsx
 * function OrderHistory() {
 *   const [page, setPage] = useState(0)
 *   const orders = useOrders({ currentPage: page, pageSize: 10 })
 *
 *   if (orders.isLoading) return <p>Loading orders...</p>
 *
 *   return (
 *     <ul>
 *       {orders.data?.orders?.map((order) => (
 *         <li key={order.code}>
 *           {order.code} — {order.statusDisplay} — {order.totalPrice?.formattedValue}
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useOrders(options: UseOrdersOptions = {}) {
  const client = useSapccClient()
  const authContext = useContext(AuthContext)

  const isAuthenticated = authContext?.isAuthenticated ?? false

  return useQuery(
    orderQueries.orders(client, {
      ...options,
      enabled: (options.enabled ?? true) && isAuthenticated,
    }),
  )
}
