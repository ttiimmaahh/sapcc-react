import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/mocks/server'
import { renderHookWithProviders } from '../../../test/test-utils'
import { useCountries } from '../useCountries'

describe('useCountries', () => {
  it('fetches all countries without type filter', async () => {
    const { result } = renderHookWithProviders(() => useCountries())

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(3)
    expect(result.current.data!.map((c) => c.isocode)).toEqual(['US', 'DE', 'JP'])
  })

  it('fetches shipping countries when type is SHIPPING', async () => {
    const { result } = renderHookWithProviders(() => useCountries({ type: 'SHIPPING' }))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data!.map((c) => c.isocode)).toEqual(['US', 'DE'])
  })

  it('fetches billing countries when type is BILLING', async () => {
    const { result } = renderHookWithProviders(() => useCountries({ type: 'BILLING' }))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data!.map((c) => c.isocode)).toEqual(['US', 'JP'])
  })

  it('returns error state on failure', async () => {
    server.use(
      http.get('https://test.example.com/occ/v2/test-site/countries', () => {
        return HttpResponse.json(
          { errors: [{ type: 'ServerError', message: 'Error' }] },
          { status: 500 },
        )
      }),
    )

    const { result } = renderHookWithProviders(() => useCountries())

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
