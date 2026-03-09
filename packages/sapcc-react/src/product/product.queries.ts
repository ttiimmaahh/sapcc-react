import { queryOptions } from '@tanstack/react-query'
import type { OccClient } from '../http/occ-client'
import type {
  Product,
  ProductSearchPage,
  SuggestionList,
  ReviewList,
  ProductReferenceList,
  ProductStockResponse,
  UseProductsOptions,
  UseProductOptions,
  UseProductReviewsOptions,
  UseProductSuggestionsOptions,
  UseProductReferencesOptions,
} from './product.types'

/** 60 seconds — product data is moderately volatile */
const PRODUCT_STALE_TIME = 60 * 1000

/** 30 seconds — search results change frequently */
const SEARCH_STALE_TIME = 30 * 1000

/** 5 minutes — suggestions and references are relatively stable */
const REFERENCE_STALE_TIME = 5 * 60 * 1000

/**
 * TanStack Query option factories for SAP Commerce Cloud product endpoints.
 *
 * Each factory returns a `queryOptions()` object suitable for `useQuery()`.
 * Keys are namespaced under `['sapcc', 'products', ...]`.
 *
 * @example
 * ```ts
 * const client = useSapccClient()
 *
 * // Product detail
 * const { data } = useQuery(productQueries.detail(client, 'CAM001'))
 *
 * // Product search
 * const { data } = useQuery(productQueries.search(client, { query: 'camera' }))
 *
 * // Server-side prefetch (Next.js)
 * await queryClient.prefetchQuery(productQueries.detail(client, 'CAM001'))
 * ```
 */
export const productQueries = {
  /** Search products with free text, facets, sorting, and pagination */
  search: (client: OccClient, options: UseProductsOptions = {}) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'products',
        'search',
        options.query ?? '',
        options.currentPage ?? 0,
        options.pageSize ?? 20,
        options.sort ?? '',
        options.fields ?? 'DEFAULT',
      ] as const,
      queryFn: async () => {
        const response = await client.get<ProductSearchPage>(
          '/products/search',
          {
            query: options.query,
            currentPage: options.currentPage,
            pageSize: options.pageSize,
            sort: options.sort,
            fields: options.fields,
          },
        )
        return response.data
      },
      staleTime: SEARCH_STALE_TIME,
      enabled: options.enabled ?? (options.query != null && options.query !== ''),
    }),

  /** Get a single product by product code */
  detail: (client: OccClient, productCode: string, options: UseProductOptions = {}) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'products',
        'detail',
        productCode,
        options.fields ?? 'DEFAULT',
      ] as const,
      queryFn: async () => {
        const response = await client.get<Product>(
          `/products/${encodeURIComponent(productCode)}`,
          {
            fields: options.fields,
          },
        )
        return response.data
      },
      staleTime: PRODUCT_STALE_TIME,
      enabled: Boolean(productCode),
    }),

  /** Get reviews for a product */
  reviews: (
    client: OccClient,
    productCode: string,
    options: UseProductReviewsOptions = {},
  ) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'products',
        'reviews',
        productCode,
        options.maxCount,
      ] as const,
      queryFn: async () => {
        const response = await client.get<ReviewList>(
          `/products/${encodeURIComponent(productCode)}/reviews`,
          {
            maxCount: options.maxCount,
          },
        )
        return response.data.reviews
      },
      staleTime: PRODUCT_STALE_TIME,
      enabled: Boolean(productCode),
    }),

  /** Get typeahead suggestions for a search term */
  suggestions: (
    client: OccClient,
    term: string,
    options: UseProductSuggestionsOptions = {},
  ) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'products',
        'suggestions',
        term,
        options.max ?? 10,
      ] as const,
      queryFn: async () => {
        const response = await client.get<SuggestionList>(
          '/products/suggestions',
          {
            term,
            max: options.max ?? 10,
            fields: options.fields,
          },
        )
        return response.data.suggestions
      },
      staleTime: REFERENCE_STALE_TIME,
      enabled: term.length >= 2,
    }),

  /** Get stock information for a product */
  stock: (client: OccClient, productCode: string) =>
    queryOptions({
      queryKey: ['sapcc', 'products', 'stock', productCode] as const,
      queryFn: async () => {
        const response = await client.get<ProductStockResponse>(
          `/products/${encodeURIComponent(productCode)}/stock`,
        )
        return response.data
      },
      staleTime: PRODUCT_STALE_TIME,
      enabled: Boolean(productCode),
    }),

  /** Get product references (cross-sell, upsell, similar, etc.) */
  references: (
    client: OccClient,
    productCode: string,
    options: UseProductReferencesOptions = {},
  ) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'products',
        'references',
        productCode,
        options.referenceType ?? '',
      ] as const,
      queryFn: async () => {
        const response = await client.get<ProductReferenceList>(
          `/products/${encodeURIComponent(productCode)}/references`,
          {
            referenceType: options.referenceType,
            fields: options.fields,
          },
        )
        return response.data.references
      },
      staleTime: REFERENCE_STALE_TIME,
      enabled: Boolean(productCode),
    }),
} as const
