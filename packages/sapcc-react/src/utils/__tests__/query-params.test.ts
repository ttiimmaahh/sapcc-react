import { describe, it, expect } from 'vitest'
import { buildQueryString } from '../query-params'

describe('buildQueryString', () => {
  it('builds a basic query string', () => {
    const result = buildQueryString({ foo: 'bar', baz: 'qux' })
    expect(result).toBe('?foo=bar&baz=qux')
  })

  it('filters out undefined values', () => {
    const result = buildQueryString({ foo: 'bar', baz: undefined, qux: 'val' })
    expect(result).toBe('?foo=bar&qux=val')
  })

  it('encodes special characters', () => {
    const result = buildQueryString({ q: 'hello world', filter: 'a&b=c' })
    expect(result).toBe('?q=hello%20world&filter=a%26b%3Dc')
  })

  it('returns empty string for no params', () => {
    const result = buildQueryString({})
    expect(result).toBe('')
  })

  it('returns empty string when all values are undefined', () => {
    const result = buildQueryString({ a: undefined, b: undefined })
    expect(result).toBe('')
  })

  it('handles boolean and number values', () => {
    const result = buildQueryString({ page: 0, active: true, verbose: false })
    expect(result).toBe('?page=0&active=true&verbose=false')
  })
})
