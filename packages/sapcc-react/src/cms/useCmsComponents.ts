import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { cmsQueries } from './cms.queries'
import type { UseCmsComponentsOptions } from './cms.types'

/**
 * Batch-fetches multiple CMS components by their IDs.
 *
 * No authentication is required — CMS endpoints serve public content.
 *
 * @param componentIds - Array of component UIDs to fetch
 * @param options - Optional fields and page-context parameters
 * @returns TanStack Query result with `CmsComponentListResponse` data
 *
 * @example
 * ```tsx
 * const { data } = useCmsComponents(['SiteLogo', 'SearchBox', 'MiniCart'])
 *
 * // Access the fetched components
 * const components = data?.component ?? []
 * ```
 */
export function useCmsComponents(componentIds: string[], options: UseCmsComponentsOptions = {}) {
  const client = useSapccClient()
  return useQuery(cmsQueries.components(client, componentIds, options))
}
