import { describe, it, expect } from 'vitest'
import { getSlotByPosition, getSlotComponents } from '../cms.helpers'
import {
  createCmsPage,
  createContentSlot,
  createBannerComponent,
  createParagraphComponent,
} from '../../../test/mocks/fixtures/cms'

describe('getSlotByPosition', () => {
  it('finds a content slot by position name', () => {
    const page = createCmsPage({
      contentSlots: {
        contentSlot: [
          createContentSlot({ position: 'TopHeaderSlot' }),
          createContentSlot({ position: 'Section1' }),
          createContentSlot({ position: 'BottomHeaderSlot' }),
        ],
      },
    })

    const slot = getSlotByPosition(page, 'Section1')

    expect(slot).toBeDefined()
    expect(slot!.position).toBe('Section1')
  })

  it('returns undefined for a non-existent position', () => {
    const page = createCmsPage({
      contentSlots: {
        contentSlot: [
          createContentSlot({ position: 'TopHeaderSlot' }),
        ],
      },
    })

    const slot = getSlotByPosition(page, 'NonExistent')

    expect(slot).toBeUndefined()
  })

  it('returns undefined when page has no contentSlots', () => {
    const page = createCmsPage({ contentSlots: undefined })

    const slot = getSlotByPosition(page, 'Section1')

    expect(slot).toBeUndefined()
  })
})

describe('getSlotComponents', () => {
  it('extracts components from a content slot', () => {
    const banner = createBannerComponent({ uid: 'banner-1' })
    const paragraph = createParagraphComponent({ uid: 'para-1' })
    const slot = createContentSlot({
      components: { component: [banner, paragraph] },
    })

    const components = getSlotComponents(slot)

    expect(components).toHaveLength(2)
    expect(components[0]!.uid).toBe('banner-1')
    expect(components[1]!.uid).toBe('para-1')
  })

  it('returns an empty array when slot has no components', () => {
    const slot = createContentSlot({ components: undefined })

    const components = getSlotComponents(slot)

    expect(components).toEqual([])
  })
})
