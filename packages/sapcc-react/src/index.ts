// sapcc-react — Headless React hooks for SAP Commerce Cloud OCC APIs
// Main barrel export — populated as modules are implemented

// Provider
export { SapccProvider, useSapccConfig, useSapccClient } from './provider'
export type { SapccProviderProps, SapccConfig, ResolvedSapccConfig, DeepPartial } from './provider'
export { resolveConfig, defaultConfig } from './provider'

// HTTP layer
export { OccClient } from './http'
export { OccError } from './http'
export { buildUrl, buildRawUrl, getEndpointNames } from './http'
export type {
  OccFields,
  HttpMethod,
  OccRequestConfig,
  OccResponse,
  OccErrorResponse,
  OccErrorDetail,
  Interceptor,
  OccClientConfig,
} from './http'

// Utilities
export { deepMerge, buildQueryString } from './utils'

// Site context
export {
  useSiteContext,
  siteContextQueries,
  useLanguages,
  useCurrencies,
  useCountries,
  useRegions,
  useTitles,
  useCardTypes,
} from './site-context'
export type {
  SiteContextState,
  UseCountriesOptions,
  Language,
  Currency,
  Country,
  Region,
  Title,
  CardType,
  BaseSite,
  LanguageList,
  CurrencyList,
  CountryList,
  RegionList,
  TitleList,
  CardTypeList,
  CountryType,
} from './site-context'
