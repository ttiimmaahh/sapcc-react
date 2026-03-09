import { describe, it, expect } from 'vitest'
import { act } from '@testing-library/react'
import { renderHookWithProviders } from '../../../test/test-utils'
import { useSiteContext } from '../SiteContextProvider'

describe('useSiteContext', () => {
  it('returns initial language and currency from config', () => {
    const { result } = renderHookWithProviders(() => useSiteContext())

    expect(result.current.language).toBe('en')
    expect(result.current.currency).toBe('USD')
    expect(result.current.baseSite).toBe('test-site')
  })

  it('updates language via setLanguage', () => {
    const { result } = renderHookWithProviders(() => useSiteContext())

    act(() => {
      result.current.setLanguage('de')
    })

    expect(result.current.language).toBe('de')
  })

  it('updates currency via setCurrency', () => {
    const { result } = renderHookWithProviders(() => useSiteContext())

    act(() => {
      result.current.setCurrency('EUR')
    })

    expect(result.current.currency).toBe('EUR')
  })

  it('invalidates queries when language changes', () => {
    const { result, queryClient } = renderHookWithProviders(() => useSiteContext())

    // Seed a dummy query in the sapcc namespace
    queryClient.setQueryData(['sapcc', 'test'], 'cached')
    expect(queryClient.getQueryData(['sapcc', 'test'])).toBe('cached')

    act(() => {
      result.current.setLanguage('ja')
    })

    // After invalidation the query state should be invalidated
    const state = queryClient.getQueryState(['sapcc', 'test'])
    expect(state?.isInvalidated).toBe(true)
  })

  it('invalidates queries when currency changes', () => {
    const { result, queryClient } = renderHookWithProviders(() => useSiteContext())

    queryClient.setQueryData(['sapcc', 'test'], 'cached')

    act(() => {
      result.current.setCurrency('JPY')
    })

    const state = queryClient.getQueryState(['sapcc', 'test'])
    expect(state?.isInvalidated).toBe(true)
  })
})
