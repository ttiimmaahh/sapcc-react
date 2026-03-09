import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { productQueries } from './product.queries'
import type { UseProductsOptions } from './product.types'

/**
 * Searches products with free text, facets, sorting, and pagination.
 *
 * @param options - Search parameters (query, page, pageSize, sort, fields)
 * @returns TanStack Query result with `ProductSearchPage` data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useProducts({ query: 'camera', pageSize: 20 })
 * ```
 */
export function useProducts(options: UseProductsOptions = {}) {
  const client = useSapccClient()
  return useQuery(productQueries.search(client, options))
}
