import { useMemo, type ComponentType } from 'react'
import { useSapccConfig } from '../provider/SapccProvider'
import type { CmsComponentProps } from './cms.types'

/**
 * Return type for the `useCmsComponentMapping` hook.
 */
export interface CmsComponentMappingResult {
  /** Look up the React component registered for a CMS type code */
  getComponent: (typeCode: string) => ComponentType<CmsComponentProps> | undefined
  /** The fallback component rendered for unmapped CMS type codes */
  fallbackComponent: ComponentType<CmsComponentProps> | undefined
}

/**
 * Hook that reads the CMS component mapping from `SapccConfig`.
 *
 * Returns a `getComponent` function to look up the registered React component
 * for a given CMS `typeCode`, and the `fallbackComponent` (if configured).
 *
 * @example
 * ```tsx
 * const { getComponent, fallbackComponent } = useCmsComponentMapping()
 * const Component = getComponent('BannerComponent') ?? fallbackComponent
 * ```
 */
export function useCmsComponentMapping(): CmsComponentMappingResult {
  const config = useSapccConfig()
  const { componentMapping, fallbackComponent } = config.cms

  const getComponent = useMemo(
    () => (typeCode: string): ComponentType<CmsComponentProps> | undefined =>
      componentMapping[typeCode],
    [componentMapping],
  )

  return { getComponent, fallbackComponent }
}
