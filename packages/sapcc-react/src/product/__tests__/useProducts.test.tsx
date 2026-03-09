import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '../../../test/test-utils'
import { useProducts } from '../useProducts'

describe('useProducts', () => {
  it('returns loading state initially, then resolves with search results', async () => {
    const { result } = renderHookWithProviders(() =>
      useProducts({ query: 'camera' }),
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data!.products.length).toBeGreaterThan(0)
    expect(result.current.data!.pagination).toBeDefined()
    expect(result.current.data!.freeTextSearch).toBe('camera')
  })

  it('is disabled when query is empty (default behavior)', () => {
    const { result } = renderHookWithProviders(() => useProducts({ query: '' }))

    // Should not fire — remains idle
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('is disabled when query is not provided', () => {
    const { result } = renderHookWithProviders(() => useProducts())

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('can be explicitly enabled with empty query', async () => {
    const { result } = renderHookWithProviders(() =>
      useProducts({ query: '', enabled: true }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data!.products).toBeDefined()
  })

  it('passes pagination parameters correctly', async () => {
    const { result } = renderHookWithProviders(() =>
      useProducts({ query: 'camera', currentPage: 1, pageSize: 10 }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data!.pagination.currentPage).toBe(1)
    expect(result.current.data!.pagination.pageSize).toBe(10)
  })

  it('includes facets and sorts in results', async () => {
    const { result } = renderHookWithProviders(() =>
      useProducts({ query: 'camera' }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data!.sorts).toBeDefined()
    expect(result.current.data!.sorts.length).toBeGreaterThan(0)
    expect(result.current.data!.facets).toBeDefined()
  })
})
