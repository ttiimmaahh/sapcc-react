import { useQuery } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { cmsQueries } from './cms.queries'
import type { UseCmsComponentOptions } from './cms.types'

/**
 * Fetches a single CMS component by its unique ID.
 *
 * No authentication is required — CMS endpoints serve public content.
 *
 * @param componentId - The unique component identifier (e.g., 'SiteLogoComponent')
 * @param options - Optional fields and page-context parameters
 * @returns TanStack Query result with `CmsComponent` data
 *
 * @example
 * ```tsx
 * const { data: component } = useCmsComponent('SiteLogoComponent')
 *
 * // With page context for dynamic components
 * const { data } = useCmsComponent('ProductFeatureComponent', {
 *   productCode: 'CAM001',
 * })
 * ```
 */
export function useCmsComponent(componentId: string, options: UseCmsComponentOptions = {}) {
  const client = useSapccClient()
  return useQuery(cmsQueries.component(client, componentId, options))
}
