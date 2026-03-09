import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { productQueries } from './product.queries'

/**
 * Fetches stock information for a product.
 *
 * @param productCode - The product code to check stock for
 * @returns TanStack Query result with `ProductStockResponse` data
 *
 * @example
 * ```tsx
 * const { data: stock } = useProductStock('CAM001')
 * ```
 */
export function useProductStock(productCode: string) {
  const client = useSapccClient()
  return useQuery(productQueries.stock(client, productCode))
}
