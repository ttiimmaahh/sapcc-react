import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '../../../test/test-utils'
import { useProduct } from '../useProduct'

describe('useProduct', () => {
  it('returns loading state initially, then resolves with product data', async () => {
    const { result } = renderHookWithProviders(() => useProduct('CAM001'))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data!.code).toBe('CAM001')
    expect(result.current.data!.name).toBe('Product CAM001')
  })

  it('returns error state for non-existent product (404)', async () => {
    const { result } = renderHookWithProviders(() => useProduct('NOT_FOUND'))

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('is disabled when productCode is empty', () => {
    const { result } = renderHookWithProviders(() => useProduct(''))

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('returns product with expected shape', async () => {
    const { result } = renderHookWithProviders(() => useProduct('PROD_SHAPE'))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const product = result.current.data!
    expect(product).toHaveProperty('code')
    expect(product).toHaveProperty('name')
    expect(product).toHaveProperty('price')
    expect(product).toHaveProperty('images')
    expect(product).toHaveProperty('stock')
  })
})
