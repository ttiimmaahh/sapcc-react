import { http, HttpResponse } from 'msw'
import {
  createProduct,
  createSearchResults,
  createReviewList,
  createSuggestionList,
  createProductReferenceList,
  createProductStock,
} from '../fixtures/products'

const BASE_URL = 'https://test.example.com/occ/v2/test-site'

export const productHandlers = [
  // Product search — must come before `:productCode` catch-all
  http.get(`${BASE_URL}/products/search`, ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query') ?? ''
    const currentPage = Number(url.searchParams.get('currentPage') ?? '0')
    const pageSize = Number(url.searchParams.get('pageSize') ?? '20')

    return HttpResponse.json(
      createSearchResults({
        query,
        page: currentPage,
        pageSize,
        totalResults: 42,
      }),
    )
  }),

  // Product suggestions — must come before `:productCode` catch-all
  http.get(`${BASE_URL}/products/suggestions`, ({ request }) => {
    const url = new URL(request.url)
    const term = url.searchParams.get('term') ?? ''
    const max = Number(url.searchParams.get('max') ?? '10')

    if (term.length < 2) {
      return HttpResponse.json({ suggestions: [] })
    }

    const list = createSuggestionList(Math.min(max, 5))
    // Override suggestion values to include the search term
    list.suggestions = list.suggestions.map((s, i) => ({
      ...s,
      value: `${term} suggestion ${String(i + 1)}`,
    }))

    return HttpResponse.json(list)
  }),

  // Product reviews (GET)
  http.get(`${BASE_URL}/products/:productCode/reviews`, () => {
    return HttpResponse.json(createReviewList(3))
  }),

  // Submit review (POST)
  http.post(`${BASE_URL}/products/:productCode/reviews`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      {
        id: 'new-review-id',
        headline: body.headline,
        comment: body.comment,
        rating: body.rating,
        alias: body.alias,
        date: new Date().toISOString(),
        principal: { name: 'Test User', uid: 'test@example.com' },
      },
      { status: 201 },
    )
  }),

  // Product stock
  http.get(`${BASE_URL}/products/:productCode/stock`, ({ params }) => {
    const { productCode } = params

    if (productCode === 'OUT_OF_STOCK') {
      return HttpResponse.json(
        createProductStock({
          stockLevelStatus: 'outOfStock',
          stockLevel: 0,
        }),
      )
    }

    return HttpResponse.json(createProductStock())
  }),

  // Product references
  http.get(`${BASE_URL}/products/:productCode/references`, ({ request }) => {
    const url = new URL(request.url)
    const referenceType = url.searchParams.get('referenceType')

    const list = createProductReferenceList(3)

    if (referenceType) {
      list.references = list.references.map((ref) => ({
        ...ref,
        referenceType,
      }))
    }

    return HttpResponse.json(list)
  }),

  // Product detail — catch-all, must come AFTER specific /products/* routes
  http.get(`${BASE_URL}/products/:productCode`, ({ params }) => {
    const { productCode } = params

    if (productCode === 'NOT_FOUND') {
      return HttpResponse.json(
        {
          errors: [
            {
              type: 'UnknownIdentifierError',
              message: `Product with code 'NOT_FOUND' not found!`,
            },
          ],
        },
        { status: 404 },
      )
    }

    return HttpResponse.json(
      createProduct({
        code: productCode as string,
        name: `Product ${productCode as string}`,
      }),
    )
  }),
]
