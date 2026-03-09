import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { productQueries } from './product.queries'
import type { UseProductReferencesOptions } from './product.types'

/**
 * Fetches product references (cross-sell, upsell, similar products, etc.).
 *
 * @param productCode - The product code to get references for
 * @param options - Optional reference type and fields
 * @returns TanStack Query result with `ProductReference[]` data
 *
 * @example
 * ```tsx
 * const { data: similar } = useProductReferences('CAM001', {
 *   referenceType: 'SIMILAR',
 * })
 * ```
 */
export function useProductReferences(
  productCode: string,
  options: UseProductReferencesOptions = {},
) {
  const client = useSapccClient()
  return useQuery(productQueries.references(client, productCode, options))
}
