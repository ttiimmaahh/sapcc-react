import { useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { AuthContext } from '../auth/AuthContext'
import { userQueries } from './user.queries'
import type {
  PaymentDetails,
  UpdatePaymentDetailsParams,
  UsePaymentMethodsOptions,
} from './user.types'

/**
 * Hook for managing the current user's saved payment methods.
 *
 * Provides the payment methods query and mutations for:
 * - Updating a saved payment method (holder name, card type, default status)
 * - Deleting a saved payment method
 *
 * Note: Creating payment methods is handled during checkout
 * (via `usePaymentDetails` in the checkout module), not here.
 *
 * Must be used within a `<SapccProvider>` with auth configured.
 *
 * @param options - Optional saved filter, fields level, and enabled flag
 * @returns Payment methods query data and mutation objects
 *
 * @example
 * ```tsx
 * function PaymentMethodsList() {
 *   const {
 *     paymentMethods,
 *     updatePaymentMethod,
 *     deletePaymentMethod,
 *   } = usePaymentMethods()
 *
 *   if (paymentMethods.isLoading) return <p>Loading...</p>
 *
 *   return (
 *     <ul>
 *       {paymentMethods.data?.map((pm) => (
 *         <li key={pm.id}>
 *           {pm.cardType?.name} ****{pm.cardNumber?.slice(-4)}
 *           {pm.defaultPayment && ' (Default)'}
 *           <button onClick={() => deletePaymentMethod.mutate(pm.id!)}>
 *             Remove
 *           </button>
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function usePaymentMethods(options: UsePaymentMethodsOptions = {}) {
  const client = useSapccClient()
  const queryClient = useQueryClient()
  const authContext = useContext(AuthContext)

  const isAuthenticated = authContext?.isAuthenticated ?? false

  // ── Payment methods query ────────────────────────────────────────────

  const paymentMethods = useQuery(
    userQueries.paymentMethods(client, {
      ...options,
      enabled: (options.enabled ?? true) && isAuthenticated,
    }),
  )

  // ── Helper: invalidate payment methods list ──────────────────────────

  const invalidatePaymentMethods = async () => {
    await queryClient.invalidateQueries({ queryKey: ['sapcc', 'user', 'payments'] })
  }

  // ── Update payment method mutation ───────────────────────────────────

  const updatePaymentMethod = useMutation({
    mutationFn: async ({
      paymentDetailsId,
      ...params
    }: UpdatePaymentDetailsParams & { paymentDetailsId: string }) => {
      const response = await client.put<PaymentDetails>(
        `/users/current/paymentdetails/${paymentDetailsId}`,
        params,
      )
      return response.data
    },
    onSettled: async () => {
      await invalidatePaymentMethods()
    },
  })

  // ── Delete payment method mutation ───────────────────────────────────

  const deletePaymentMethod = useMutation({
    mutationFn: async (paymentDetailsId: string) => {
      await client.delete<undefined>(`/users/current/paymentdetails/${paymentDetailsId}`)
    },
    onSettled: async () => {
      await invalidatePaymentMethods()
    },
  })

  return {
    /** Payment methods list query result (array of PaymentDetails objects) */
    paymentMethods,
    /** Mutation to update a saved payment method (requires paymentDetailsId) */
    updatePaymentMethod,
    /** Mutation to delete a saved payment method by ID */
    deletePaymentMethod,
  }
}
