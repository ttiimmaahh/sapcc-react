import { describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '../../../test/test-utils'
import { resetCmsState } from '../../../test/mocks/handlers/cms'
import { useCmsPage } from '../useCmsPage'

describe('useCmsPage', () => {
  beforeEach(() => {
    resetCmsState()
  })

  it('fetches a content page by pageType and pageLabelOrId', async () => {
    const { result } = renderHookWithProviders(() =>
      useCmsPage({ pageType: 'ContentPage', pageLabelOrId: '/homepage' }),
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data!.uid).toBe('homepage')
    expect(result.current.data!.typeCode).toBe('ContentPage')
    expect(result.current.data!.label).toBe('/homepage')
  })

  it('fetches a page by direct pageId', async () => {
    const { result } = renderHookWithProviders(() =>
      useCmsPage({ pageId: 'faqPage' }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data!.uid).toBe('faqPage')
    expect(result.current.data!.title).toBe('Frequently Asked Questions')
  })

  it('fetches a product page by pageType and code', async () => {
    const { result } = renderHookWithProviders(() =>
      useCmsPage({ pageType: 'ProductPage', code: 'CAM001' }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data!.typeCode).toBe('ProductPage')
    expect(result.current.data!.template).toBe('ProductDetailsPageTemplate')
  })

  it('is disabled when no meaningful identifier is provided', () => {
    const { result } = renderHookWithProviders(() => useCmsPage({}))

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('is disabled when only pageType is provided without label or code', () => {
    const { result } = renderHookWithProviders(() =>
      useCmsPage({ pageType: 'ContentPage' }),
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('returns page with content slots', async () => {
    const { result } = renderHookWithProviders(() =>
      useCmsPage({ pageType: 'ContentPage', pageLabelOrId: '/homepage' }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const page = result.current.data!
    expect(page.contentSlots).toBeDefined()
    expect(page.contentSlots!.contentSlot).toBeDefined()
    expect(page.contentSlots!.contentSlot!.length).toBeGreaterThan(0)

    const slot = page.contentSlots!.contentSlot![0]!
    expect(slot).toHaveProperty('position')
    expect(slot).toHaveProperty('components')
  })

  // NOTE: This test uses rejects pattern — must be last in describe block
  it('returns error for non-existent page', async () => {
    const { result } = renderHookWithProviders(() =>
      useCmsPage({ pageId: 'nonexistent-page' }),
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})
