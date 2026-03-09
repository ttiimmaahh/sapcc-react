import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import type { ReturnRequest, CreateReturnRequestParams } from './order.types'

/**
 * Hook for creating a return request (RMA) for an order.
 *
 * Sends a return request to SAP Commerce Cloud for specific order entries
 * with specified quantities. On success, invalidates both order and
 * return request queries to reflect the new return.
 *
 * Must be used within a `<SapccProvider>` with auth configured.
 *
 * @returns TanStack Mutation for creating return requests
 *
 * @example
 * ```tsx
 * function RequestReturnButton({ orderCode, entries }: Props) {
 *   const createReturn = useCreateReturn()
 *
 *   return (
 *     <button
 *       disabled={createReturn.isPending}
 *       onClick={() => createReturn.mutate({
 *         orderCode,
 *         returnRequestEntryInputs: entries.map((e) => ({
 *           orderEntryNumber: e.entryNumber,
 *           quantity: e.quantity,
 *         })),
 *       })}
 *     >
 *       {createReturn.isPending ? 'Submitting...' : 'Request Return'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useCreateReturn() {
  const client = useSapccClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateReturnRequestParams) => {
      const response = await client.post<ReturnRequest>(
        '/users/current/orderReturns',
        {
          orderCode: params.orderCode,
          returnRequestEntryInputs: params.returnRequestEntryInputs,
        },
      )
      return response.data
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['sapcc', 'order'],
      })
    },
  })
}
