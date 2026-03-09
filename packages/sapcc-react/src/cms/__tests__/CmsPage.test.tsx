import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SapccProvider, type SapccConfig } from '../../provider'
import { CmsPage } from '../CmsPage'
import type { CmsComponentProps } from '../cms.types'
import {
  createCmsPage,
  createContentSlot,
  createBannerComponent,
  createParagraphComponent,
} from '../../../test/mocks/fixtures/cms'

// ---------------------------------------------------------------------------
// Test components registered in the mapping
// ---------------------------------------------------------------------------

function BannerRenderer({ data }: CmsComponentProps) {
  return <div data-testid={`banner-${data.uid ?? ''}`}>Banner</div>
}

function ParagraphRenderer({ data }: CmsComponentProps) {
  return <div data-testid={`paragraph-${data.uid ?? ''}`}>Paragraph</div>
}

// ---------------------------------------------------------------------------
// Wrapper helper
// ---------------------------------------------------------------------------

function TestWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  const config: SapccConfig = {
    backend: { occ: { baseUrl: 'https://test.example.com' } },
    site: { baseSite: 'test-site' },
    cms: {
      componentMapping: {
        BannerComponent: BannerRenderer,
        CMSParagraphComponent: ParagraphRenderer,
      },
    },
  }
  return (
    <QueryClientProvider client={queryClient}>
      <SapccProvider config={config}>{children}</SapccProvider>
    </QueryClientProvider>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CmsPage', () => {
  it('renders all slots from a page', () => {
    const page = createCmsPage({
      uid: 'homepage',
      contentSlots: {
        contentSlot: [
          createContentSlot({
            position: 'TopHeaderSlot',
            components: {
              component: [createBannerComponent({ uid: 'top-b1' })],
            },
          }),
          createContentSlot({
            position: 'Section1',
            components: {
              component: [createParagraphComponent({ uid: 'sec1-p1' })],
            },
          }),
        ],
      },
    })

    render(
      <TestWrapper>
        <CmsPage page={page} />
      </TestWrapper>,
    )

    expect(screen.getByTestId('banner-top-b1')).toBeDefined()
    expect(screen.getByTestId('paragraph-sec1-p1')).toBeDefined()
  })

  it('shows loading fallback when loading', () => {
    render(
      <TestWrapper>
        <CmsPage
          loading={true}
          loadingFallback={<div data-testid="loading">Loading page...</div>}
        />
      </TestWrapper>,
    )

    expect(screen.getByTestId('loading').textContent).toBe('Loading page...')
  })

  it('renders nothing when loading without a fallback', () => {
    const { container } = render(
      <TestWrapper>
        <CmsPage loading={true} />
      </TestWrapper>,
    )

    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when page is undefined', () => {
    const { container } = render(
      <TestWrapper>
        <CmsPage />
      </TestWrapper>,
    )

    expect(container.innerHTML).toBe('')
  })

  it('passes className to the wrapper element', () => {
    const page = createCmsPage({
      uid: 'test-page',
      contentSlots: {
        contentSlot: [
          createContentSlot({
            position: 'Section1',
            components: {
              component: [createBannerComponent({ uid: 'b1' })],
            },
          }),
        ],
      },
    })

    render(
      <TestWrapper>
        <CmsPage page={page} className="cms-page-wrapper" />
      </TestWrapper>,
    )

    const wrapper = screen.getByTestId('banner-b1').closest('[data-cms-page]')
    expect(wrapper).toBeDefined()
    expect(wrapper!.className).toBe('cms-page-wrapper')
    expect(wrapper!.getAttribute('data-cms-page')).toBe('test-page')
  })
})
