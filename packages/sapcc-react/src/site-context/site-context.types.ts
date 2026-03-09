/**
 * SAP Commerce Cloud OCC site-context types.
 *
 * These types mirror the OCC v2 REST API response shapes for
 * languages, currencies, countries, regions, titles, card types, and base sites.
 */

// ── Individual entity types ────────────────────────────────────────

export interface Language {
  isocode: string
  name: string
  nativeName: string
  active: boolean
}

export interface Currency {
  isocode: string
  name: string
  symbol: string
  active: boolean
}

export interface Country {
  isocode: string
  name: string
}

export interface Region {
  isocode: string
  name: string
  countryIso: string
}

export interface Title {
  code: string
  name: string
}

export interface CardType {
  code: string
  name: string
}

export interface BaseSite {
  uid: string
  name?: string
  stores?: string[]
  theme?: string
}

// ── OCC list response wrappers ─────────────────────────────────────

export interface LanguageList {
  languages: Language[]
}

export interface CurrencyList {
  currencies: Currency[]
}

export interface CountryList {
  countries: Country[]
}

export interface RegionList {
  regions: Region[]
}

export interface TitleList {
  titles: Title[]
}

export interface CardTypeList {
  cardTypes: CardType[]
}

// ── Country type filter ────────────────────────────────────────────

export type CountryType = 'SHIPPING' | 'BILLING'
