import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { siteContextQueries } from './site-context.queries'
import type { CountryType } from './site-context.types'

export interface UseCountriesOptions {
  /** Filter countries by type (SHIPPING or BILLING) */
  type?: CountryType
}

/**
 * Fetches the list of countries, optionally filtered by type.
 *
 * @param options - Optional filter by SHIPPING or BILLING type
 * @returns TanStack Query result with `data: Country[]`
 *
 * @example
 * ```tsx
 * // All countries
 * const { data: countries } = useCountries()
 *
 * // Shipping countries only
 * const { data: shippingCountries } = useCountries({ type: 'SHIPPING' })
 * ```
 */
export function useCountries(options?: UseCountriesOptions) {
  const client = useSapccClient()
  return useQuery(siteContextQueries.countries(client, options?.type))
}
