import { queryOptions } from '@tanstack/react-query'
import type { OccClient } from '../http/occ-client'
import type {
  LanguageList,
  CurrencyList,
  CountryList,
  RegionList,
  TitleList,
  CardTypeList,
  CountryType,
} from './site-context.types'

/** 5 minutes — site context reference data changes infrequently */
const STALE_TIME = 5 * 60 * 1000

/**
 * TanStack Query option factories for SAP Commerce Cloud site-context endpoints.
 *
 * Each factory returns a `queryOptions()` object suitable for `useQuery()`.
 * Keys are namespaced under `['sapcc', 'site-context', ...]`.
 *
 * @example
 * ```ts
 * const client = useSapccClient()
 * const { data } = useQuery(siteContextQueries.languages(client))
 * ```
 */
export const siteContextQueries = {
  /** All active languages for the current base site */
  languages: (client: OccClient) =>
    queryOptions({
      queryKey: ['sapcc', 'site-context', 'languages'] as const,
      queryFn: async () => {
        const response = await client.get<LanguageList>('/languages')
        return response.data.languages
      },
      staleTime: STALE_TIME,
    }),

  /** All active currencies for the current base site */
  currencies: (client: OccClient) =>
    queryOptions({
      queryKey: ['sapcc', 'site-context', 'currencies'] as const,
      queryFn: async () => {
        const response = await client.get<CurrencyList>('/currencies')
        return response.data.currencies
      },
      staleTime: STALE_TIME,
    }),

  /** Countries, optionally filtered by type (SHIPPING or BILLING) */
  countries: (client: OccClient, type?: CountryType) =>
    queryOptions({
      queryKey: ['sapcc', 'site-context', 'countries', type] as const,
      queryFn: async () => {
        const response = await client.get<CountryList>('/countries', type ? { type } : undefined)
        return response.data.countries
      },
      staleTime: STALE_TIME,
    }),

  /** Regions for a specific country */
  regions: (client: OccClient, countryIsoCode: string) =>
    queryOptions({
      queryKey: ['sapcc', 'site-context', 'regions', countryIsoCode] as const,
      queryFn: async () => {
        const response = await client.get<RegionList>(
          `/countries/${encodeURIComponent(countryIsoCode)}/regions`,
        )
        return response.data.regions
      },
      staleTime: STALE_TIME,
      enabled: Boolean(countryIsoCode),
    }),

  /** Title prefixes (Mr., Mrs., Dr., etc.) */
  titles: (client: OccClient) =>
    queryOptions({
      queryKey: ['sapcc', 'site-context', 'titles'] as const,
      queryFn: async () => {
        const response = await client.get<TitleList>('/titles')
        return response.data.titles
      },
      staleTime: STALE_TIME,
    }),

  /** Payment card types (Visa, Mastercard, etc.) */
  cardTypes: (client: OccClient) =>
    queryOptions({
      queryKey: ['sapcc', 'site-context', 'cardTypes'] as const,
      queryFn: async () => {
        const response = await client.get<CardTypeList>('/cardtypes')
        return response.data.cardTypes
      },
      staleTime: STALE_TIME,
    }),
} as const
