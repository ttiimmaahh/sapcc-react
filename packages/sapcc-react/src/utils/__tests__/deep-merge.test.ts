import { describe, it, expect } from 'vitest'
import { deepMerge } from '../deep-merge'

describe('deepMerge', () => {
  it('shallow merges top-level properties', () => {
    const result = deepMerge(
      { a: 1, b: 2 } as Record<string, unknown>,
      { b: 3, c: 4 },
    )
    expect(result).toEqual({ a: 1, b: 3, c: 4 })
  })

  it('deep merges nested objects', () => {
    const target = { site: { language: 'en', currency: 'USD' } }
    const source = { site: { language: 'de' } }
    const result = deepMerge(target, source)
    expect(result).toEqual({ site: { language: 'de', currency: 'USD' } })
  })

  it('replaces arrays instead of concatenating', () => {
    const target = { tags: ['a', 'b'] }
    const source = { tags: ['c'] }
    const result = deepMerge(target, source)
    expect(result).toEqual({ tags: ['c'] })
  })

  it('null values overwrite the target', () => {
    const target = { a: { nested: 'value' } } as Record<string, unknown>
    const source = { a: null }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: null })
  })

  it('skips undefined values in source', () => {
    const target = { a: 1, b: 2 }
    const source = { a: undefined, b: 3 }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 1, b: 3 })
  })

  it('handles empty objects', () => {
    const target = { a: 1 }
    const result = deepMerge(target, {})
    expect(result).toEqual({ a: 1 })
  })

  it('preserves type of non-plain objects (Date, RegExp)', () => {
    const date = new Date('2026-01-01')
    const target = { createdAt: new Date('2020-01-01') } as Record<string, unknown>
    const source = { createdAt: date }
    const result = deepMerge(target, source)
    expect(result.createdAt).toBe(date)
  })

  it('supports multiple sources (left to right)', () => {
    const result = deepMerge(
      { a: 1 } as Record<string, unknown>,
      { a: 2, b: 2 },
      { a: 3, c: 3 },
    )
    expect(result).toEqual({ a: 3, b: 2, c: 3 })
  })

  it('does not mutate the target or sources', () => {
    const target = { a: { b: 1 } } as Record<string, unknown>
    const source = { a: { c: 2 } }
    const targetCopy = JSON.parse(JSON.stringify(target)) as Record<string, unknown>
    const sourceCopy = JSON.parse(JSON.stringify(source)) as Record<string, unknown>
    deepMerge(target, source)
    expect(target).toEqual(targetCopy)
    expect(source).toEqual(sourceCopy)
  })
})
