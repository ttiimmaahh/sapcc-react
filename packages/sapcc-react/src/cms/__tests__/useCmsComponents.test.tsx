import { describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '../../../test/test-utils'
import { resetCmsState } from '../../../test/mocks/handlers/cms'
import { useCmsComponents } from '../useCmsComponents'

describe('useCmsComponents', () => {
  beforeEach(() => {
    resetCmsState()
  })

  it('batch-fetches multiple components by IDs', async () => {
    const { result } = renderHookWithProviders(() =>
      useCmsComponents(['SiteLogoComponent', 'HelpParagraph', 'HomepageLink']),
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data!.component).toBeDefined()
    expect(result.current.data!.component!.length).toBe(3)

    const uids = result.current.data!.component!.map((c) => c.uid)
    expect(uids).toContain('SiteLogoComponent')
    expect(uids).toContain('HelpParagraph')
    expect(uids).toContain('HomepageLink')
  })

  it('is disabled when componentIds is an empty array', () => {
    const { result } = renderHookWithProviders(() => useCmsComponents([]))

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('returns only components that exist for the given IDs', async () => {
    const { result } = renderHookWithProviders(() =>
      useCmsComponents(['SiteLogoComponent', 'NonExistent']),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Only 1 of the 2 requested IDs exists in mock data
    expect(result.current.data!.component!.length).toBe(1)
    expect(result.current.data!.component![0]!.uid).toBe('SiteLogoComponent')
  })

  it('returns pagination metadata in the response', async () => {
    const { result } = renderHookWithProviders(() =>
      useCmsComponents(['SiteLogoComponent', 'HelpParagraph']),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data!.pagination).toBeDefined()
  })
})
