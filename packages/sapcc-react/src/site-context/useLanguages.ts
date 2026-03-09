import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { siteContextQueries } from './site-context.queries'

/**
 * Fetches the list of active languages for the current base site.
 *
 * @returns TanStack Query result with `data: Language[]`
 *
 * @example
 * ```tsx
 * const { data: languages, isLoading, error } = useLanguages()
 * ```
 */
export function useLanguages() {
  const client = useSapccClient()
  return useQuery(siteContextQueries.languages(client))
}
