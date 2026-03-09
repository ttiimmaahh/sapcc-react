import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '../../../test/test-utils'
import { useProductSuggestions } from '../useProductSuggestions'

describe('useProductSuggestions', () => {
  it('returns suggestions for a term with at least 2 characters', async () => {
    const { result } = renderHookWithProviders(() =>
      useProductSuggestions('cam'),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data!.length).toBeGreaterThan(0)
    // MSW handler includes the search term in suggestion values
    expect(result.current.data![0]!.value).toContain('cam')
  })

  it('is disabled when term is less than 2 characters', () => {
    const { result } = renderHookWithProviders(() =>
      useProductSuggestions('c'),
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('is disabled for empty term', () => {
    const { result } = renderHookWithProviders(() =>
      useProductSuggestions(''),
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('returns suggestions with value property', async () => {
    const { result } = renderHookWithProviders(() =>
      useProductSuggestions('camera'),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    for (const suggestion of result.current.data!) {
      expect(suggestion).toHaveProperty('value')
      expect(typeof suggestion.value).toBe('string')
    }
  })
})
