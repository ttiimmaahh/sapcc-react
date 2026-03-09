import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import type { CancelOrderParams } from './order.types'

/**
 * Hook for requesting an order cancellation.
 *
 * Sends a cancellation request to SAP Commerce Cloud for specific order
 * entries with specified quantities. On success, invalidates both
 * the order detail and order history queries to reflect the status change.
 *
 * Must be used within a `<SapccProvider>` with auth configured.
 *
 * @returns TanStack Mutation for cancelling orders
 *
 * @example
 * ```tsx
 * function CancelOrderButton({ orderCode, entries }: Props) {
 *   const cancelOrder = useOrderCancellation()
 *
 *   return (
 *     <button
 *       disabled={cancelOrder.isPending}
 *       onClick={() => cancelOrder.mutate({
 *         orderCode,
 *         cancellationRequestEntryInputs: entries.map((e) => ({
 *           orderEntryNumber: e.entryNumber,
 *           quantity: e.quantity,
 *         })),
 *       })}
 *     >
 *       {cancelOrder.isPending ? 'Cancelling...' : 'Cancel Order'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useOrderCancellation() {
  const client = useSapccClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CancelOrderParams) => {
      await client.post<undefined>(
        `/users/current/orders/${encodeURIComponent(params.orderCode)}/cancellation`,
        {
          cancellationRequestEntryInputs:
            params.cancellationRequestEntryInputs,
        },
      )
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['sapcc', 'order'],
      })
    },
  })
}
