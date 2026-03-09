/**
 * Pure utility functions for navigating CMS data structures.
 *
 * These helpers handle the OCC singular-naming quirk where arrays
 * are wrapped in container objects:
 * - `contentSlots.contentSlot[]` (not `contentSlots[]`)
 * - `components.component[]` (not `components[]`)
 */

import type { CmsComponent, CmsPageData, ContentSlot } from './cms.types'

/**
 * Find a `ContentSlot` within a CMS page by its position name.
 *
 * @param page - The CMS page data
 * @param position - The slot position name (e.g., 'Section1', 'TopHeaderSlot')
 * @returns The matching `ContentSlot`, or `undefined` if not found
 *
 * @example
 * ```ts
 * const headerSlot = getSlotByPosition(page, 'TopHeaderSlot')
 * ```
 */
export function getSlotByPosition(page: CmsPageData, position: string): ContentSlot | undefined {
  const slots = page.contentSlots?.contentSlot
  if (!slots) return undefined
  return slots.find((slot) => slot.position === position)
}

/**
 * Extract the `CmsComponent[]` array from a `ContentSlot`.
 *
 * Handles the OCC singular-naming quirk where the array is at
 * `slot.components.component[]`.
 *
 * @param slot - The content slot
 * @returns Array of CMS components (empty array if none)
 *
 * @example
 * ```ts
 * const components = getSlotComponents(headerSlot)
 * ```
 */
export function getSlotComponents(slot: ContentSlot): CmsComponent[] {
  return slot.components?.component ?? []
}
