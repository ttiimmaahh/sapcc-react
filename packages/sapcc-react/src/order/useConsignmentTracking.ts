import { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { AuthContext } from '../auth/AuthContext'
import { orderQueries } from './order.queries'
import type { UseConsignmentTrackingOptions } from './order.types'

/**
 * Hook for fetching consignment (shipment) tracking information.
 *
 * Returns a TanStack Query result containing {@link ConsignmentTracking}
 * with carrier info, tracking ID/URL, and tracking events.
 *
 * Note: The SAP Commerce OCC tracking endpoint does NOT use the
 * `/users/current/` prefix — it's directly under the base site path:
 * `GET /orders/{orderCode}/consignments/{consignmentCode}/tracking`
 *
 * Automatically disabled when the user is not authenticated or when
 * `orderCode` or `consignmentCode` are empty/falsy.
 *
 * Must be used within a `<SapccProvider>` with auth configured.
 *
 * @param orderCode - The order code
 * @param consignmentCode - The consignment code within the order
 * @param options - Fields and enabled options
 * @returns TanStack Query result with tracking data
 *
 * @example
 * ```tsx
 * function TrackingInfo({ orderCode, consignmentCode }: Props) {
 *   const tracking = useConsignmentTracking(orderCode, consignmentCode)
 *
 *   if (tracking.isLoading) return <p>Loading tracking...</p>
 *   if (!tracking.data) return <p>No tracking info available</p>
 *
 *   return (
 *     <div>
 *       <p>Carrier: {tracking.data.carrierCode}</p>
 *       <a href={tracking.data.trackingUrl}>
 *         Track: {tracking.data.trackingID}
 *       </a>
 *       <ul>
 *         {tracking.data.trackingEvents?.map((evt, i) => (
 *           <li key={i}>{evt.detail} — {evt.location}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 */
export function useConsignmentTracking(
  orderCode: string,
  consignmentCode: string,
  options: UseConsignmentTrackingOptions = {},
) {
  const client = useSapccClient()
  const authContext = useContext(AuthContext)

  const isAuthenticated = authContext?.isAuthenticated ?? false

  return useQuery(
    orderQueries.consignmentTracking(client, orderCode, consignmentCode, {
      ...options,
      enabled: (options.enabled ?? true) && isAuthenticated,
    }),
  )
}
