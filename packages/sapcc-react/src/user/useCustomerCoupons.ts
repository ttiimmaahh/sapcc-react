import { useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { AuthContext } from '../auth/AuthContext'
import { userQueries } from './user.queries'
import type {
  CustomerCoupon,
  UseCustomerCouponsOptions,
} from './user.types'

/**
 * Hook for managing the current user's customer coupons.
 *
 * Customer coupons are promotional codes assigned to individual users.
 * They can be claimed, disclaimed, and have notifications toggled.
 *
 * Provides a paginated query and mutations for:
 * - Claiming a coupon (adding to the user's collection)
 * - Disclaiming a coupon (removing from the user's collection)
 * - Toggling coupon notification (enable/disable alerts for a coupon)
 *
 * Must be used within a `<SapccProvider>` with auth configured.
 *
 * @param options - Pagination, fields, and enabled options
 * @returns Customer coupons query data and mutation objects
 *
 * @example
 * ```tsx
 * function MyCoupons() {
 *   const {
 *     customerCoupons,
 *     claimCoupon,
 *     disclaimCoupon,
 *     toggleCouponNotification,
 *   } = useCustomerCoupons({ pageSize: 20 })
 *
 *   if (customerCoupons.isLoading) return <p>Loading...</p>
 *
 *   return (
 *     <ul>
 *       {customerCoupons.data?.coupons?.map((coupon) => (
 *         <li key={coupon.couponId}>
 *           {coupon.name} — {coupon.status}
 *           <button onClick={() =>
 *             toggleCouponNotification.mutate(coupon.couponId)
 *           }>
 *             {coupon.notificationOn ? 'Disable' : 'Enable'} Alerts
 *           </button>
 *           <button onClick={() =>
 *             disclaimCoupon.mutate(coupon.couponId)
 *           }>
 *             Remove
 *           </button>
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useCustomerCoupons(options: UseCustomerCouponsOptions = {}) {
  const client = useSapccClient()
  const queryClient = useQueryClient()
  const authContext = useContext(AuthContext)

  const isAuthenticated = authContext?.isAuthenticated ?? false

  // ── Customer coupons query ───────────────────────────────────────────

  const customerCoupons = useQuery(
    userQueries.customerCoupons(client, {
      ...options,
      enabled: (options.enabled ?? true) && isAuthenticated,
    }),
  )

  // ── Helper: invalidate customer coupons ──────────────────────────────

  const invalidateCoupons = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['sapcc', 'user', 'coupons'],
    })
  }

  // ── Claim coupon mutation ────────────────────────────────────────────

  const claimCoupon = useMutation({
    mutationFn: async (couponCode: string) => {
      const response = await client.post<CustomerCoupon>(
        `/users/current/customercoupons/${couponCode}/claim`,
      )
      return response.data
    },
    onSettled: async () => {
      await invalidateCoupons()
    },
  })

  // ── Disclaim coupon mutation ─────────────────────────────────────────

  const disclaimCoupon = useMutation({
    mutationFn: async (couponCode: string) => {
      await client.delete<undefined>(
        `/users/current/customercoupons/${couponCode}/claim`,
      )
    },
    onSettled: async () => {
      await invalidateCoupons()
    },
  })

  // ── Toggle coupon notification mutation ──────────────────────────────

  const toggleCouponNotification = useMutation({
    mutationFn: async (couponCode: string) => {
      await client.patch<undefined>(
        `/users/current/customercoupons/${couponCode}/notification`,
      )
    },
    onSettled: async () => {
      await invalidateCoupons()
    },
  })

  return {
    /** Customer coupons paginated query result (CustomerCouponSearchResult) */
    customerCoupons,
    /** Mutation to claim a coupon by code */
    claimCoupon,
    /** Mutation to disclaim (remove) a coupon by code */
    disclaimCoupon,
    /** Mutation to toggle coupon notification on/off by code */
    toggleCouponNotification,
  }
}
