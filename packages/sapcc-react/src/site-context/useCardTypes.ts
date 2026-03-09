import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { siteContextQueries } from './site-context.queries'

/**
 * Fetches the list of supported payment card types (Visa, Mastercard, etc.).
 *
 * @returns TanStack Query result with `data: CardType[]`
 *
 * @example
 * ```tsx
 * const { data: cardTypes } = useCardTypes()
 * ```
 */
export function useCardTypes() {
  const client = useSapccClient()
  return useQuery(siteContextQueries.cardTypes(client))
}
