import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/mocks/server'
import { renderHookWithProviders } from '../../../test/test-utils'
import { useCurrencies } from '../useCurrencies'

describe('useCurrencies', () => {
  it('fetches and returns currencies', async () => {
    const { result } = renderHookWithProviders(() => useCurrencies())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(3)
    expect(result.current.data![0]!.isocode).toBe('USD')
    expect(result.current.data![0]!.symbol).toBe('$')
    expect(result.current.data![1]!.isocode).toBe('EUR')
    expect(result.current.data![2]!.isocode).toBe('JPY')
  })

  it('returns error state on failure', async () => {
    server.use(
      http.get('https://test.example.com/occ/v2/test-site/currencies', () => {
        return HttpResponse.json(
          { errors: [{ type: 'ServerError', message: 'Service unavailable' }] },
          { status: 503 },
        )
      }),
    )

    const { result } = renderHookWithProviders(() => useCurrencies())

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})
