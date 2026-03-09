import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '../../../test/test-utils'
import { useProductReviews } from '../useProductReviews'

describe('useProductReviews', () => {
  it('returns loading state initially, then resolves with reviews', async () => {
    const { result } = renderHookWithProviders(() =>
      useProductReviews('CAM001'),
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // MSW handler returns 3 reviews
    expect(result.current.data).toHaveLength(3)
  })

  it('returns reviews with correct shape', async () => {
    const { result } = renderHookWithProviders(() =>
      useProductReviews('CAM001'),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const review = result.current.data![0]!
    expect(review).toHaveProperty('headline')
    expect(review).toHaveProperty('comment')
    expect(review).toHaveProperty('rating')
    expect(typeof review.rating).toBe('number')
  })

  it('is disabled when productCode is empty', () => {
    const { result } = renderHookWithProviders(() => useProductReviews(''))

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})
