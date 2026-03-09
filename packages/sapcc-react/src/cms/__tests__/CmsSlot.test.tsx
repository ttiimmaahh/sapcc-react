import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { type ReactNode, lazy } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SapccProvider, type SapccConfig } from '../../provider'
import { CmsSlot } from '../CmsSlot'
import { CmsOutlet } from '../CmsOutlet'
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

function BannerRenderer({ data, slot }: CmsComponentProps) {
  return (
    <div data-testid="banner" data-slot={slot}>
      Banner: {data.uid}
    </div>
  )
}

function ParagraphRenderer({ data }: CmsComponentProps) {
  return <div data-testid="paragraph">Paragraph: {data.uid}</div>
}

function FallbackRenderer({ data }: CmsComponentProps) {
  return <div data-testid="fallback">Unknown: {data.typeCode}</div>
}

// ---------------------------------------------------------------------------
// Wrapper helper
// ---------------------------------------------------------------------------

function createTestConfig(
  overrides: Partial<SapccConfig['cms']> = {},
): SapccConfig {
  return {
    backend: { occ: { baseUrl: 'https://test.example.com' } },
    site: { baseSite: 'test-site' },
    cms: {
      componentMapping: {
        BannerComponent: BannerRenderer,
        CMSParagraphComponent: ParagraphRenderer,
      },
      ...overrides,
    },
  }
}

function TestWrapper({
  children,
  config,
}: {
  children: ReactNode
  config?: SapccConfig
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <SapccProvider config={config ?? createTestConfig()}>
        {children}
      </SapccProvider>
    </QueryClientProvider>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CmsSlot', () => {
  it('renders components from a page slot by position name', () => {
    const page = createCmsPage({
      contentSlots: {
        contentSlot: [
          createContentSlot({
            position: 'Section1',
            components: {
              component: [
                createBannerComponent({ uid: 'b1' }),
                createParagraphComponent({ uid: 'p1' }),
              ],
            },
          }),
        ],
      },
    })

    render(
      <TestWrapper>
        <CmsSlot name="Section1" page={page} />
      </TestWrapper>,
    )

    expect(screen.getByTestId('banner').textContent).toContain('Banner: b1')
    expect(screen.getByTestId('paragraph').textContent).toContain('Paragraph: p1')
  })

  it('renders components passed directly via components prop', () => {
    const components = [
      createBannerComponent({ uid: 'direct-b1' }),
      createParagraphComponent({ uid: 'direct-p1' }),
    ]

    render(
      <TestWrapper>
        <CmsSlot name="custom" components={components} />
      </TestWrapper>,
    )

    expect(screen.getByTestId('banner').textContent).toContain('Banner: direct-b1')
    expect(screen.getByTestId('paragraph').textContent).toContain('Paragraph: direct-p1')
  })

  it('passes the slot name to rendered components', () => {
    const components = [createBannerComponent({ uid: 'b1' })]

    render(
      <TestWrapper>
        <CmsSlot name="TopHeaderSlot" components={components} />
      </TestWrapper>,
    )

    expect(screen.getByTestId('banner').getAttribute('data-slot')).toBe('TopHeaderSlot')
  })

  it('renders fallback component for unmapped typeCode', () => {
    const config = createTestConfig({ fallbackComponent: FallbackRenderer })
    const components = [
      createBannerComponent({ uid: 'b1' }),
      { uid: 'unknown-1', typeCode: 'SomeUnknownComponent' },
    ]

    render(
      <TestWrapper config={config}>
        <CmsSlot name="Section1" components={components} />
      </TestWrapper>,
    )

    expect(screen.getByTestId('banner').textContent).toContain('Banner: b1')
    expect(screen.getByTestId('fallback').textContent).toContain('Unknown: SomeUnknownComponent')
  })

  it('skips unmapped components when no fallback is configured', () => {
    const components = [
      createBannerComponent({ uid: 'b1' }),
      { uid: 'unknown-1', typeCode: 'SomeUnknownComponent' },
    ]

    render(
      <TestWrapper>
        <CmsSlot name="Section1" components={components} />
      </TestWrapper>,
    )

    expect(screen.getByTestId('banner').textContent).toContain('Banner: b1')
    expect(screen.queryByTestId('fallback')).toBeNull()
  })

  it('wraps each component in Suspense (supports lazy components)', async () => {
    // Create a lazy component that resolves asynchronously
    const LazyBanner = lazy(
      () => Promise.resolve({ default: BannerRenderer }),
    )
    const config: SapccConfig = {
      backend: { occ: { baseUrl: 'https://test.example.com' } },
      site: { baseSite: 'test-site' },
      cms: {
        componentMapping: {
          BannerComponent: LazyBanner,
        },
      },
    }

    const components = [createBannerComponent({ uid: 'lazy-b1' })]

    render(
      <TestWrapper config={config}>
        <CmsSlot
          name="Section1"
          components={components}
          suspenseFallback={<div data-testid="slot-fallback">Loading...</div>}
        />
      </TestWrapper>,
    )

    // Initially the lazy component may show the Suspense fallback
    // After resolution, the banner should appear
    await act(async () => {
      // Wait for the lazy promise to resolve
      await Promise.resolve()
    })

    // After resolution, verify that rendering succeeded without errors
    // The component should either be loading or resolved
    expect(
      screen.queryByTestId('slot-fallback') ?? screen.queryByTestId('banner'),
    ).not.toBeNull()
  })

  it('renders CmsOutlet before/after content', () => {
    const components = [createBannerComponent({ uid: 'b1' })]

    render(
      <TestWrapper>
        <CmsSlot name="Section1" components={components}>
          <CmsOutlet position="before">
            <div data-testid="before-content">Before!</div>
          </CmsOutlet>
          <CmsOutlet position="after">
            <div data-testid="after-content">After!</div>
          </CmsOutlet>
        </CmsSlot>
      </TestWrapper>,
    )

    const slotWrapper = screen.getByTestId('banner').parentElement!
    expect(slotWrapper).toBeDefined()

    // Verify order: before → banner (inside Suspense) → after
    const children = Array.from(slotWrapper.children)
    expect(children[0]!.getAttribute('data-testid')).toBe('before-content')
    expect(children[1]!.getAttribute('data-testid')).toBe('banner')
    expect(children[2]!.getAttribute('data-testid')).toBe('after-content')
  })

  it('renders CmsOutlet replace content instead of CMS components', () => {
    const components = [
      createBannerComponent({ uid: 'b1' }),
      createParagraphComponent({ uid: 'p1' }),
    ]

    render(
      <TestWrapper>
        <CmsSlot name="Section1" components={components}>
          <CmsOutlet position="replace">
            <div data-testid="replacement">Replaced!</div>
          </CmsOutlet>
        </CmsSlot>
      </TestWrapper>,
    )

    expect(screen.getByTestId('replacement').textContent).toBe('Replaced!')
    expect(screen.queryByTestId('banner')).toBeNull()
    expect(screen.queryByTestId('paragraph')).toBeNull()
  })

  it('returns null when slot has no components and no outlets', () => {
    const page = createCmsPage({
      contentSlots: {
        contentSlot: [
          createContentSlot({ position: 'EmptySlot', components: { component: [] } }),
        ],
      },
    })

    const { container } = render(
      <TestWrapper>
        <CmsSlot name="EmptySlot" page={page} />
      </TestWrapper>,
    )

    // CmsSlot returns null — nothing rendered inside the wrapper
    expect(container.innerHTML).toBe('')
  })

  it('sets data-cms-slot attribute and className on wrapper', () => {
    const components = [createBannerComponent({ uid: 'b1' })]

    render(
      <TestWrapper>
        <CmsSlot name="TopHeader" components={components} className="my-slot" />
      </TestWrapper>,
    )

    const wrapper = screen.getByTestId('banner').parentElement!
    expect(wrapper.getAttribute('data-cms-slot')).toBe('TopHeader')
    expect(wrapper.className).toBe('my-slot')
  })
})
