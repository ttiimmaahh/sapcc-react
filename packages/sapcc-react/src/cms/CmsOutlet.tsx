import type { ReactElement } from 'react'
import type { CmsOutletProps } from './cms.types'

/**
 * Marker component for injecting custom content into a `<CmsSlot>`.
 *
 * `<CmsOutlet>` is used as a child of `<CmsSlot>` to inject custom React
 * content before, after, or in place of the CMS components rendered by the slot.
 *
 * The rendering logic is handled by `<CmsSlot>`, which inspects its children
 * for `<CmsOutlet>` elements and injects them at the correct position.
 *
 * @example
 * ```tsx
 * <CmsSlot name="Header" page={page}>
 *   <CmsOutlet position="before"><AnnouncementBanner /></CmsOutlet>
 *   <CmsOutlet position="after"><PromoStrip /></CmsOutlet>
 * </CmsSlot>
 * ```
 *
 * @example Replace all CMS components:
 * ```tsx
 * <CmsSlot name="Header" page={page}>
 *   <CmsOutlet position="replace"><CustomHeader /></CmsOutlet>
 * </CmsSlot>
 * ```
 */
export function CmsOutlet({ children }: CmsOutletProps): ReactElement {
  return <>{children}</>
}
