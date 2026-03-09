import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { productQueries } from './product.queries'
import type { UseProductSuggestionsOptions } from './product.types'

/**
 * Fetches typeahead suggestions for a search term.
 * Only fires when the term is at least 2 characters.
 *
 * @param term - The search term to get suggestions for
 * @param options - Optional max results and fields
 * @returns TanStack Query result with `Suggestion[]` data
 *
 * @example
 * ```tsx
 * const { data: suggestions } = useProductSuggestions(inputValue, { max: 5 })
 * ```
 */
export function useProductSuggestions(
  term: string,
  options: UseProductSuggestionsOptions = {},
) {
  const client = useSapccClient()
  return useQuery(productQueries.suggestions(client, term, options))
}
