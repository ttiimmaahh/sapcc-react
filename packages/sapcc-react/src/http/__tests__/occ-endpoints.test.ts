import { describe, it, expect } from 'vitest'
import { buildUrl, buildRawUrl, getEndpointNames } from '../occ-endpoints'

const BASE = 'https://api.example.com'
const PREFIX = '/occ/v2'
const SITE = 'electronics-spa'

describe('buildUrl', () => {
  it('builds a basic endpoint URL', () => {
    const url = buildUrl(BASE, PREFIX, SITE, 'languages')
    expect(url).toBe('https://api.example.com/occ/v2/electronics-spa/languages')
  })

  it('substitutes path parameters', () => {
    const url = buildUrl(BASE, PREFIX, SITE, 'regions', { isoCode: 'US' })
    expect(url).toBe('https://api.example.com/occ/v2/electronics-spa/countries/US/regions')
  })

  it('encodes path parameters', () => {
    const url = buildUrl(BASE, PREFIX, SITE, 'regions', { isoCode: 'U S' })
    expect(url).toBe('https://api.example.com/occ/v2/electronics-spa/countries/U%20S/regions')
  })

  it('appends query parameters', () => {
    const url = buildUrl(BASE, PREFIX, SITE, 'countries', undefined, { type: 'SHIPPING' })
    expect(url).toBe(
      'https://api.example.com/occ/v2/electronics-spa/countries?type=SHIPPING',
    )
  })

  it('combines path and query parameters', () => {
    const url = buildUrl(BASE, PREFIX, SITE, 'regions', { isoCode: 'US' }, { fields: 'FULL' })
    expect(url).toBe(
      'https://api.example.com/occ/v2/electronics-spa/countries/US/regions?fields=FULL',
    )
  })

  it('throws for unknown endpoint', () => {
    expect(() => buildUrl(BASE, PREFIX, SITE, 'nonexistent')).toThrow(
      'Unknown endpoint: "nonexistent"',
    )
  })

  it('throws for missing required path parameter', () => {
    expect(() => buildUrl(BASE, PREFIX, SITE, 'regions')).toThrow(
      /Missing required path parameter "isoCode"/,
    )
  })

  it('throws for unknown path parameter', () => {
    expect(() => buildUrl(BASE, PREFIX, SITE, 'languages', { bogus: 'val' })).toThrow(
      'Unknown path parameter "bogus"',
    )
  })
})

describe('buildRawUrl', () => {
  it('builds a URL from a raw path', () => {
    const url = buildRawUrl(BASE, PREFIX, SITE, '/products')
    expect(url).toBe('https://api.example.com/occ/v2/electronics-spa/products')
  })

  it('appends query params to raw URL', () => {
    const url = buildRawUrl(BASE, PREFIX, SITE, '/products', { query: 'camera', page: 0 })
    expect(url).toBe(
      'https://api.example.com/occ/v2/electronics-spa/products?query=camera&page=0',
    )
  })
})

describe('getEndpointNames', () => {
  it('returns all registered endpoint names', () => {
    const names = getEndpointNames()
    expect(names).toContain('languages')
    expect(names).toContain('currencies')
    expect(names).toContain('countries')
    expect(names).toContain('regions')
    expect(names).toContain('titles')
    expect(names).toContain('cardTypes')
    expect(names).toContain('baseSites')
  })

  it('returns at least 7 endpoints for Phase 1', () => {
    expect(getEndpointNames().length).toBeGreaterThanOrEqual(7)
  })
})
