import { describe, it, expect } from 'vitest'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/mocks/server'
import { renderHookWithProviders } from '../../../test/test-utils'
import { useLanguages } from '../useLanguages'

describe('useLanguages', () => {
  it('returns loading state initially, then resolves with languages', async () => {
    const { result } = renderHookWithProviders(() => useLanguages())

    // Initially loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    // Wait for data
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(3)
    expect(result.current.data![0]!.isocode).toBe('en')
    expect(result.current.data![1]!.isocode).toBe('de')
    expect(result.current.data![2]!.isocode).toBe('ja')
  })

  it('returns error state on failure', async () => {
    server.use(
      http.get('https://test.example.com/occ/v2/test-site/languages', () => {
        return HttpResponse.json(
          { errors: [{ type: 'ServerError', message: 'Internal error' }] },
          { status: 500 },
        )
      }),
    )

    const { result } = renderHookWithProviders(() => useLanguages())

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('returns languages with correct shape', async () => {
    const { result } = renderHookWithProviders(() => useLanguages())

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const lang = result.current.data![0]!
    expect(lang).toHaveProperty('isocode')
    expect(lang).toHaveProperty('name')
    expect(lang).toHaveProperty('nativeName')
    expect(lang).toHaveProperty('active')
  })
})
