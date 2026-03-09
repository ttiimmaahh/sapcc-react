import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { siteContextQueries } from './site-context.queries'

/**
 * Fetches the list of title prefixes (Mr., Mrs., Dr., etc.).
 *
 * @returns TanStack Query result with `data: Title[]`
 *
 * @example
 * ```tsx
 * const { data: titles } = useTitles()
 * ```
 */
export function useTitles() {
  const client = useSapccClient()
  return useQuery(siteContextQueries.titles(client))
}
