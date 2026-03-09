import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '../../../test/test-utils'
import { useProductReferences } from '../useProductReferences'

describe('useProductReferences', () => {
  it('returns product references', async () => {
    const { result } = renderHookWithProviders(() =>
      useProductReferences('CAM001'),
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // MSW handler returns 3 references
    expect(result.current.data).toHaveLength(3)
  })

  it('returns references with correct shape', async () => {
    const { result } = renderHookWithProviders(() =>
      useProductReferences('CAM001'),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const ref = result.current.data![0]!
    expect(ref).toHaveProperty('referenceType')
    expect(ref).toHaveProperty('target')
    expect(ref.target).toHaveProperty('code')
    expect(ref.target).toHaveProperty('name')
  })

  it('filters by referenceType when provided', async () => {
    const { result } = renderHookWithProviders(() =>
      useProductReferences('CAM001', { referenceType: 'UPSELLING' }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // MSW handler sets all references to the requested type
    for (const ref of result.current.data!) {
      expect(ref.referenceType).toBe('UPSELLING')
    }
  })

  it('is disabled when productCode is empty', () => {
    const { result } = renderHookWithProviders(() => useProductReferences(''))

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})
