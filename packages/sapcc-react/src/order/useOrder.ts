import { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { AuthContext } from '../auth/AuthContext'
import { orderQueries } from './order.queries'
import type { UseOrderOptions } from './order.types'

/**
 * Hook for fetching a single order by its code.
 *
 * Returns a TanStack Query result containing the full {@link Order} object.
 * Defaults to `fields: 'FULL'` for maximum detail.
 *
 * Automatically disabled when the user is not authenticated or when
 * `orderCode` is empty/falsy.
 *
 * Must be used within a `<SapccProvider>` with auth configured.
 *
 * @param orderCode - The order code to fetch
 * @param options - Fields and enabled options
 * @returns TanStack Query result with order detail data
 *
 * @example
 * ```tsx
 * function OrderDetail({ orderCode }: { orderCode: string }) {
 *   const order = useOrder(orderCode)
 *
 *   if (order.isLoading) return <p>Loading...</p>
 *   if (!order.data) return <p>Order not found</p>
 *
 *   return (
 *     <div>
 *       <h2>Order {order.data.code}</h2>
 *       <p>Status: {order.data.statusDisplay}</p>
 *       <p>Total: {order.data.totalPrice?.formattedValue}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useOrder(orderCode: string, options: UseOrderOptions = {}) {
  const client = useSapccClient()
  const authContext = useContext(AuthContext)

  const isAuthenticated = authContext?.isAuthenticated ?? false

  return useQuery(
    orderQueries.order(client, orderCode, {
      ...options,
      enabled: (options.enabled ?? true) && isAuthenticated,
    }),
  )
}
