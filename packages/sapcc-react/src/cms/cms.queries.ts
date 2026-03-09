import { queryOptions } from '@tanstack/react-query'
import type { OccClient } from '../http/occ-client'
import type {
  CmsPage,
  CmsComponent,
  CmsComponentListResponse,
  UseCmsPageOptions,
  UseCmsComponentOptions,
  UseCmsComponentsOptions,
} from './cms.types'

/** 5 minutes — CMS content changes infrequently during a session */
const CMS_STALE_TIME = 5 * 60 * 1000

/**
 * Derives the page identifier used in query keys from the options.
 *
 * Priority: `pageId` > `pageLabelOrId` > `code`.
 */
function pageIdentifier(options: UseCmsPageOptions): string {
  if (options.pageId) return options.pageId
  if (options.pageLabelOrId) return options.pageLabelOrId
  if (options.code) return options.code
  return ''
}

/**
 * Whether the page query has enough information to execute.
 *
 * Requires either a `pageId`, or a `pageType` plus a label/code.
 */
function isPageQueryEnabled(options: UseCmsPageOptions): boolean {
  if (options.pageId) return true
  if (options.pageType && (options.pageLabelOrId ?? options.code)) return true
  return false
}

/**
 * TanStack Query option factories for SAP Commerce Cloud CMS endpoints.
 *
 * Each factory returns a `queryOptions()` object suitable for `useQuery()`.
 * Keys are namespaced under `['sapcc', 'cms', ...]`.
 *
 * CMS endpoints are public — no authentication is required.
 *
 * @example
 * ```ts
 * const client = useSapccClient()
 *
 * // Fetch a content page by label
 * const { data } = useQuery(cmsQueries.page(client, {
 *   pageType: 'ContentPage',
 *   pageLabelOrId: '/homepage',
 * }))
 *
 * // Fetch a single component
 * const { data } = useQuery(cmsQueries.component(client, 'SiteLogoComponent'))
 *
 * // Batch-fetch multiple components
 * const { data } = useQuery(cmsQueries.components(client, ['comp1', 'comp2']))
 * ```
 */
export const cmsQueries = {
  /**
   * Fetch a CMS page by type + label/code, or by direct page ID.
   *
   * When `pageId` is provided, fetches `GET /cms/pages/{pageId}`.
   * Otherwise fetches `GET /cms/pages` with `pageType` and either
   * `pageLabelOrId` (ContentPage) or `code` (Product/Category/CatalogPage).
   */
  page: (client: OccClient, options: UseCmsPageOptions = {}) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'cms',
        'page',
        options.pageType ?? '',
        pageIdentifier(options),
        options.fields ?? 'DEFAULT',
      ] as const,
      queryFn: async () => {
        if (options.pageId) {
          // Direct page ID lookup
          const response = await client.get<CmsPage>(
            `/cms/pages/${encodeURIComponent(options.pageId)}`,
            {
              fields: options.fields,
            },
          )
          return response.data
        }

        // Query-param based lookup
        const response = await client.get<CmsPage>('/cms/pages', {
          pageType: options.pageType,
          pageLabelOrId: options.pageLabelOrId,
          code: options.code,
          fields: options.fields,
        })
        return response.data
      },
      staleTime: CMS_STALE_TIME,
      enabled: (options.enabled ?? true) && isPageQueryEnabled(options),
    }),

  /**
   * Fetch a single CMS component by ID.
   *
   * Supports optional page-context parameters (`productCode`, `categoryCode`,
   * `catalogCode`) which the CMS backend may use to resolve dynamic content.
   */
  component: (
    client: OccClient,
    componentId: string,
    options: UseCmsComponentOptions = {},
  ) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'cms',
        'component',
        componentId,
        options.fields ?? 'DEFAULT',
      ] as const,
      queryFn: async () => {
        const response = await client.get<CmsComponent>(
          `/cms/components/${encodeURIComponent(componentId)}`,
          {
            fields: options.fields,
            productCode: options.productCode,
            categoryCode: options.categoryCode,
            catalogCode: options.catalogCode,
          },
        )
        return response.data
      },
      staleTime: CMS_STALE_TIME,
      enabled: (options.enabled ?? true) && Boolean(componentId),
    }),

  /**
   * Batch-fetch multiple CMS components by their IDs.
   *
   * Component IDs are sent as a comma-separated `componentIds` query param.
   * The query key includes sorted IDs so that order doesn't affect caching.
   */
  components: (
    client: OccClient,
    componentIds: string[],
    options: UseCmsComponentsOptions = {},
  ) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'cms',
        'components',
        [...componentIds].sort().join(','),
        options.fields ?? 'DEFAULT',
      ] as const,
      queryFn: async () => {
        const response = await client.get<CmsComponentListResponse>(
          '/cms/components',
          {
            componentIds: componentIds.join(','),
            fields: options.fields,
            productCode: options.productCode,
            categoryCode: options.categoryCode,
            catalogCode: options.catalogCode,
          },
        )
        return response.data
      },
      staleTime: CMS_STALE_TIME,
      enabled: (options.enabled ?? true) && componentIds.length > 0,
    }),
} as const
