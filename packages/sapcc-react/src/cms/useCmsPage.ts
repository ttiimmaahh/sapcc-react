import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { cmsQueries } from './cms.queries'
import type { UseCmsPageOptions } from './cms.types'

/**
 * Fetches a CMS page by type + label/code, or by direct page ID.
 *
 * No authentication is required — CMS endpoints serve public content.
 *
 * @param options - Page lookup parameters
 * @returns TanStack Query result with `CmsPage` data
 *
 * @example
 * ```tsx
 * // Fetch a content page by label
 * const { data: page } = useCmsPage({
 *   pageType: 'ContentPage',
 *   pageLabelOrId: '/homepage',
 * })
 *
 * // Fetch a product page
 * const { data: page } = useCmsPage({
 *   pageType: 'ProductPage',
 *   code: productCode,
 * })
 *
 * // Fetch by direct page ID
 * const { data: page } = useCmsPage({ pageId: 'homepage' })
 * ```
 */
export function useCmsPage(options: UseCmsPageOptions = {}) {
  const client = useSapccClient()
  return useQuery(cmsQueries.page(client, options))
}
