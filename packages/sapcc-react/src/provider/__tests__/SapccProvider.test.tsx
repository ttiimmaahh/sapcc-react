import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { SapccProvider, useSapccConfig, useSapccClient } from '../SapccProvider'
import { OccClient } from '../../http/occ-client'
import {
  createTestQueryClient,
  defaultTestConfig,
  renderHookWithProviders,
} from '../../../test/test-utils'

describe('SapccProvider', () => {
  it('renders children', () => {
    const queryClient = createTestQueryClient()

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <SapccProvider config={defaultTestConfig}>{children}</SapccProvider>
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => 'rendered', { wrapper: Wrapper })
    expect(result.current).toBe('rendered')
  })

  it('provides resolved config via useSapccConfig', () => {
    const { result } = renderHookWithProviders(() => useSapccConfig())

    expect(result.current.backend.occ.baseUrl).toBe('https://test.example.com')
    expect(result.current.backend.occ.prefix).toBe('/occ/v2')
    expect(result.current.site.baseSite).toBe('test-site')
    expect(result.current.site.language).toBe('en')
    expect(result.current.site.currency).toBe('USD')
  })

  it('applies default values for optional config fields', () => {
    const { result } = renderHookWithProviders(() => useSapccConfig())

    expect(result.current.http.interceptors).toEqual([])
    expect(result.current.http.retries).toBe(1)
    expect(result.current.dev.logging).toBe(false)
    expect(result.current.cms.componentMapping).toEqual({})
  })

  it('deep merges config overrides with defaults', () => {
    const { result } = renderHookWithProviders(() => useSapccConfig(), {
      configOverrides: {
        site: { language: 'de', currency: 'EUR' },
        dev: { logging: true },
      },
    })

    // Overridden values
    expect(result.current.site.language).toBe('de')
    expect(result.current.site.currency).toBe('EUR')
    expect(result.current.dev.logging).toBe(true)

    // Preserved defaults
    expect(result.current.backend.occ.prefix).toBe('/occ/v2')
    expect(result.current.http.retries).toBe(1)
  })

  it('provides OccClient via useSapccClient', () => {
    const { result } = renderHookWithProviders(() => useSapccClient())
    expect(result.current).toBeInstanceOf(OccClient)
  })

  it('throws when useSapccConfig is used outside provider', () => {
    expect(() => {
      renderHook(() => useSapccConfig())
    }).toThrow('useSapccConfig must be used within a <SapccProvider>')
  })

  it('throws when useSapccClient is used outside provider', () => {
    expect(() => {
      renderHook(() => useSapccClient())
    }).toThrow('useSapccClient must be used within a <SapccProvider>')
  })

  it('memoizes config — same reference on re-render', () => {
    const { result, rerender } = renderHookWithProviders(() => useSapccConfig())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })

  it('memoizes client — same reference on re-render', () => {
    const { result, rerender } = renderHookWithProviders(() => useSapccClient())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })

  it('includes auth config when provided', () => {
    const { result } = renderHookWithProviders(() => useSapccConfig(), {
      configOverrides: {
        auth: { clientId: 'test-client' },
      },
    })

    expect(result.current.auth).toBeDefined()
    expect(result.current.auth?.clientId).toBe('test-client')
    expect(result.current.auth?.tokenEndpoint).toBe('/authorizationserver/oauth/token')
  })
})
