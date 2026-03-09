import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { siteContextQueries } from './site-context.queries'

/**
 * Fetches the list of active currencies for the current base site.
 *
 * @returns TanStack Query result with `data: Currency[]`
 *
 * @example
 * ```tsx
 * const { data: currencies, isLoading, error } = useCurrencies()
 * ```
 */
export function useCurrencies() {
  const client = useSapccClient()
  return useQuery(siteContextQueries.currencies(client))
}
