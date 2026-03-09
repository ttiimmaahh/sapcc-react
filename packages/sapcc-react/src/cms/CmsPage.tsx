import type { ReactElement } from 'react'
import type { CmsPageProps } from './cms.types'
import { CmsSlot } from './CmsSlot'

/**
 * Convenience rendering component that renders all content slots from a CMS page.
 *
 * Iterates over `page.contentSlots.contentSlot[]` and renders a `<CmsSlot>`
 * for each slot. Handles loading and empty states.
 *
 * For selective slot rendering or custom layouts, use `<CmsSlot>` directly
 * with specific position names instead.
 *
 * @example
 * ```tsx
 * function Homepage() {
 *   const { data: page, isLoading } = useCmsPage({
 *     pageType: 'ContentPage',
 *     pageLabelOrId: '/homepage',
 *   })
 *   return <CmsPage page={page} loading={isLoading} />
 * }
 * ```
 */
export function CmsPage({
  page,
  loading,
  loadingFallback,
  className,
}: CmsPageProps): ReactElement | null {
  if (loading) {
    return loadingFallback ? <>{loadingFallback}</> : null
  }

  if (!page) {
    return null
  }

  const slots = page.contentSlots?.contentSlot ?? []

  return (
    <div className={className} data-cms-page={page.uid}>
      {slots.map((slot) => {
        const position = slot.position ?? slot.slotId ?? ''
        return <CmsSlot key={position} name={position} page={page} />
      })}
    </div>
  )
}
