import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { siteContextQueries } from './site-context.queries'

/**
 * Fetches the list of regions for a specific country.
 *
 * The query is automatically disabled when `countryIsoCode` is empty/falsy,
 * making it safe to use with dependent dropdowns.
 *
 * @param countryIsoCode - ISO code of the country (e.g., 'US', 'DE')
 * @returns TanStack Query result with `data: Region[]`
 *
 * @example
 * ```tsx
 * const [country, setCountry] = useState('')
 * const { data: regions } = useRegions(country)
 * // regions query is disabled until a country is selected
 * ```
 */
export function useRegions(countryIsoCode: string) {
  const client = useSapccClient()
  return useQuery(siteContextQueries.regions(client, countryIsoCode))
}
