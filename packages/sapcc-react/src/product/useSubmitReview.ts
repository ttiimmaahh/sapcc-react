import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import type { Review, ReviewSubmission } from './product.types'

/**
 * Submits a new review for a product.
 *
 * On success, invalidates the product reviews cache so the list refreshes automatically.
 *
 * @param productCode - The product code to submit a review for
 * @returns TanStack Query mutation result
 *
 * @example
 * ```tsx
 * const { mutate: submitReview, isPending } = useSubmitReview('CAM001')
 *
 * submitReview({
 *   headline: 'Great camera!',
 *   comment: 'Best purchase I ever made.',
 *   rating: 5,
 * })
 * ```
 */
export function useSubmitReview(productCode: string) {
  const client = useSapccClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (review: ReviewSubmission) => {
      const response = await client.post<Review>(
        `/products/${encodeURIComponent(productCode)}/reviews`,
        review,
      )
      return response.data
    },
    onSuccess: async () => {
      // Invalidate reviews and product detail (which may include review count)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['sapcc', 'products', 'reviews', productCode],
        }),
        queryClient.invalidateQueries({
          queryKey: ['sapcc', 'products', 'detail', productCode],
        }),
      ])
    },
  })
}
