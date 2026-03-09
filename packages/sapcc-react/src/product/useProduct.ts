import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { productQueries } from './product.queries'
import type { UseProductOptions } from './product.types'

/**
 * Fetches a single product by product code.
 *
 * @param productCode - The unique product code (e.g., 'CAM001')
 * @param options - Optional fields level
 * @returns TanStack Query result with `Product` data
 *
 * @example
 * ```tsx
 * const { data: product, isLoading } = useProduct('CAM001', { fields: 'FULL' })
 * ```
 */
export function useProduct(productCode: string, options: UseProductOptions = {}) {
  const client = useSapccClient()
  return useQuery(productQueries.detail(client, productCode, options))
}
