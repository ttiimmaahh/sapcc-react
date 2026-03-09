import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { productQueries } from './product.queries'
import type { UseProductReviewsOptions } from './product.types'

/**
 * Fetches reviews for a product.
 *
 * @param productCode - The product code to fetch reviews for
 * @param options - Optional maxCount limit
 * @returns TanStack Query result with `Review[]` data
 *
 * @example
 * ```tsx
 * const { data: reviews } = useProductReviews('CAM001')
 * ```
 */
export function useProductReviews(
  productCode: string,
  options: UseProductReviewsOptions = {},
) {
  const client = useSapccClient()
  return useQuery(productQueries.reviews(client, productCode, options))
}
