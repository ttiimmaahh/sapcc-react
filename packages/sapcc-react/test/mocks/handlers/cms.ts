import { http, HttpResponse } from 'msw'
import {
  createCmsPage,
  createCmsComponent,
  createBannerComponent,
  createParagraphComponent,
  createLinkComponent,
  createCmsComponentListResponse,
} from '../fixtures/cms'
import type { CmsComponent, CmsPage } from '../../../src/cms/cms.types'

const BASE_URL = 'https://test.example.com/occ/v2/test-site'

// ---------------------------------------------------------------------------
// In-memory CMS state for realistic handler behavior
// ---------------------------------------------------------------------------

let pages: CmsPage[] = [
  createCmsPage({
    uid: 'homepage',
    name: 'Homepage',
    typeCode: 'ContentPage',
    label: '/homepage',
  }),
  createCmsPage({
    uid: 'faqPage',
    name: 'FAQ',
    typeCode: 'ContentPage',
    label: '/faq',
    template: 'AccountPageTemplate',
    title: 'Frequently Asked Questions',
  }),
  createCmsPage({
    uid: 'productPage',
    name: 'Product Detail',
    typeCode: 'ProductPage',
    label: undefined,
    template: 'ProductDetailsPageTemplate',
  }),
  createCmsPage({
    uid: 'categoryPage',
    name: 'Category Page',
    typeCode: 'CategoryPage',
    label: undefined,
    template: 'CategoryPageTemplate',
  }),
]

let components: CmsComponent[] = [
  createBannerComponent({ uid: 'SiteLogoComponent', name: 'Site Logo' }),
  createParagraphComponent({ uid: 'HelpParagraph', name: 'Help Text', content: '<p>Need help?</p>' }),
  createLinkComponent({ uid: 'HomepageLink', name: 'Homepage Link', url: '/' }),
  createCmsComponent({ uid: 'SearchBoxComponent', typeCode: 'SearchBoxComponent', name: 'Search Box' }),
]

/** Reset CMS state between tests */
export function resetCmsState(): void {
  pages = [
    createCmsPage({
      uid: 'homepage',
      name: 'Homepage',
      typeCode: 'ContentPage',
      label: '/homepage',
    }),
    createCmsPage({
      uid: 'faqPage',
      name: 'FAQ',
      typeCode: 'ContentPage',
      label: '/faq',
      template: 'AccountPageTemplate',
      title: 'Frequently Asked Questions',
    }),
    createCmsPage({
      uid: 'productPage',
      name: 'Product Detail',
      typeCode: 'ProductPage',
      label: undefined,
      template: 'ProductDetailsPageTemplate',
    }),
    createCmsPage({
      uid: 'categoryPage',
      name: 'Category Page',
      typeCode: 'CategoryPage',
      label: undefined,
      template: 'CategoryPageTemplate',
    }),
  ]

  components = [
    createBannerComponent({ uid: 'SiteLogoComponent', name: 'Site Logo' }),
    createParagraphComponent({ uid: 'HelpParagraph', name: 'Help Text', content: '<p>Need help?</p>' }),
    createLinkComponent({ uid: 'HomepageLink', name: 'Homepage Link', url: '/' }),
    createCmsComponent({ uid: 'SearchBoxComponent', typeCode: 'SearchBoxComponent', name: 'Search Box' }),
  ]
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const cmsHandlers = [
  // ── CMS Page by ID (GET /cms/pages/:pageId) ──────────────────────────
  // Must be before the parameterless /cms/pages handler
  http.get(
    `${BASE_URL}/cms/pages/:pageId`,
    ({ params }) => {
      const { pageId } = params
      const page = pages.find((p) => p.uid === pageId)

      if (!page) {
        return HttpResponse.json(
          { errors: [{ type: 'CMSItemNotFoundError', message: `Page ${String(pageId)} not found` }] },
          { status: 404 },
        )
      }

      return HttpResponse.json(page)
    },
  ),

  // ── CMS Pages by query params (GET /cms/pages) ───────────────────────
  http.get(
    `${BASE_URL}/cms/pages`,
    ({ request }) => {
      const url = new URL(request.url)
      const pageType = url.searchParams.get('pageType')
      const pageLabelOrId = url.searchParams.get('pageLabelOrId')
      const code = url.searchParams.get('code')

      let page: CmsPage | undefined

      if (pageType === 'ContentPage' && pageLabelOrId) {
        page = pages.find((p) => p.typeCode === 'ContentPage' && p.label === pageLabelOrId)
      } else if (pageType && code) {
        // ProductPage, CategoryPage, CatalogPage — match by typeCode
        page = pages.find((p) => p.typeCode === pageType)
      } else if (pageType) {
        // Fallback: find default page for this type
        page = pages.find((p) => p.typeCode === pageType)
      }

      if (!page) {
        return HttpResponse.json(
          { errors: [{ type: 'CMSItemNotFoundError', message: 'No page found for the given parameters' }] },
          { status: 404 },
        )
      }

      return HttpResponse.json(page)
    },
  ),

  // ── Single CMS Component (GET /cms/components/:componentId) ───────────
  http.get(
    `${BASE_URL}/cms/components/:componentId`,
    ({ params }) => {
      const { componentId } = params
      const component = components.find((c) => c.uid === componentId)

      if (!component) {
        return HttpResponse.json(
          { errors: [{ type: 'CMSItemNotFoundError', message: `Component ${String(componentId)} not found` }] },
          { status: 404 },
        )
      }

      return HttpResponse.json(component)
    },
  ),

  // ── Batch CMS Components (GET /cms/components) ────────────────────────
  http.get(
    `${BASE_URL}/cms/components`,
    ({ request }) => {
      const url = new URL(request.url)
      const componentIdsParam = url.searchParams.get('componentIds')

      if (!componentIdsParam) {
        return HttpResponse.json(
          { errors: [{ type: 'ValidationError', message: 'componentIds parameter is required' }] },
          { status: 400 },
        )
      }

      const requestedIds = componentIdsParam.split(',')
      const found = components.filter((c) => requestedIds.includes(c.uid ?? ''))

      return HttpResponse.json(
        createCmsComponentListResponse({
          component: found,
        }),
      )
    },
  ),
]
