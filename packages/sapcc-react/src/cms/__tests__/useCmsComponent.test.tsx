import { describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '../../../test/test-utils'
import { resetCmsState } from '../../../test/mocks/handlers/cms'
import { useCmsComponent } from '../useCmsComponent'

describe('useCmsComponent', () => {
  beforeEach(() => {
    resetCmsState()
  })

  it('fetches a single component by ID', async () => {
    const { result } = renderHookWithProviders(() =>
      useCmsComponent('SiteLogoComponent'),
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data!.uid).toBe('SiteLogoComponent')
    expect(result.current.data!.name).toBe('Site Logo')
  })

  it('is disabled when componentId is empty', () => {
    const { result } = renderHookWithProviders(() => useCmsComponent(''))

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('returns component with expected base properties', async () => {
    const { result } = renderHookWithProviders(() =>
      useCmsComponent('HelpParagraph'),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const component = result.current.data!
    expect(component).toHaveProperty('uid')
    expect(component).toHaveProperty('typeCode')
    expect(component).toHaveProperty('name')
    expect(component).toHaveProperty('modifiedTime')
  })

  // NOTE: This test uses error state — must be last in describe block
  it('returns error for non-existent component', async () => {
    const { result } = renderHookWithProviders(() =>
      useCmsComponent('NonExistentComponent'),
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})
