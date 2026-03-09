import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/mocks/server'
import { renderHookWithProviders } from '../../../test/test-utils'
import { useRegions } from '../useRegions'

describe('useRegions', () => {
  it('fetches regions for a country', async () => {
    const { result } = renderHookWithProviders(() => useRegions('US'))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(3)
    expect(result.current.data![0]!.isocode).toBe('US-CA')
    expect(result.current.data![0]!.name).toBe('California')
  })

  it('does not fetch when countryIsoCode is empty', () => {
    const { result } = renderHookWithProviders(() => useRegions(''))

    // Query should be disabled — not loading, no data, no fetching
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isFetching).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns error state on failure', async () => {
    server.use(
      http.get('https://test.example.com/occ/v2/test-site/countries/:iso/regions', () => {
        return HttpResponse.json(
          { errors: [{ type: 'ServerError', message: 'Error' }] },
          { status: 500 },
        )
      }),
    )

    const { result } = renderHookWithProviders(() => useRegions('US'))

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
