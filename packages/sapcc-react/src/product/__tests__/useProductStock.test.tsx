import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '../../../test/test-utils'
import { useProductStock } from '../useProductStock'

describe('useProductStock', () => {
  it('returns stock info for an in-stock product', async () => {
    const { result } = renderHookWithProviders(() =>
      useProductStock('CAM001'),
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data!.stockLevelStatus).toBe('inStock')
    expect(result.current.data!.stockLevel).toBeGreaterThan(0)
  })

  it('returns out of stock for an out-of-stock product', async () => {
    const { result } = renderHookWithProviders(() =>
      useProductStock('OUT_OF_STOCK'),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data!.stockLevelStatus).toBe('outOfStock')
    expect(result.current.data!.stockLevel).toBe(0)
  })

  it('is disabled when productCode is empty', () => {
    const { result } = renderHookWithProviders(() => useProductStock(''))

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })
})
