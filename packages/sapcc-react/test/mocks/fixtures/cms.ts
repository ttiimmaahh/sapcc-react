import { faker } from '@faker-js/faker'
import type {
  CmsComponent,
  CmsBannerComponent,
  CmsParagraphComponent,
  CmsLinkComponent,
  ContentSlot,
  ComponentList,
  ContentSlotList,
  CmsPageData,
  CmsComponentListResponse,
} from '../../../src/cms/cms.types'
import { createPagination } from './common'

// ---------------------------------------------------------------------------
// Base CMS Component
// ---------------------------------------------------------------------------

export function createCmsComponent(
  overrides: Partial<CmsComponent> = {},
): CmsComponent {
  return {
    uid: faker.string.alphanumeric(12),
    typeCode: 'CMSParagraphComponent',
    name: faker.lorem.words(3),
    modifiedTime: faker.date.recent().toISOString(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Typed component subtypes
// ---------------------------------------------------------------------------

export function createBannerComponent(
  overrides: Partial<CmsBannerComponent> = {},
): CmsBannerComponent {
  return {
    uid: faker.string.alphanumeric(12),
    typeCode: 'BannerComponent',
    name: faker.lorem.words(3),
    modifiedTime: faker.date.recent().toISOString(),
    headline: faker.lorem.sentence(),
    content: `<p>${faker.lorem.paragraph()}</p>`,
    media: {
      url: faker.image.url(),
      altText: faker.lorem.words(3),
      mime: 'image/jpeg',
    },
    urlLink: `/${faker.lorem.slug()}`,
    external: false,
    ...overrides,
  }
}

export function createParagraphComponent(
  overrides: Partial<CmsParagraphComponent> = {},
): CmsParagraphComponent {
  return {
    uid: faker.string.alphanumeric(12),
    typeCode: 'CMSParagraphComponent',
    name: faker.lorem.words(3),
    modifiedTime: faker.date.recent().toISOString(),
    content: `<p>${faker.lorem.paragraph()}</p>`,
    title: faker.lorem.sentence(),
    ...overrides,
  }
}

export function createLinkComponent(
  overrides: Partial<CmsLinkComponent> = {},
): CmsLinkComponent {
  return {
    uid: faker.string.alphanumeric(12),
    typeCode: 'CMSLinkComponent',
    name: faker.lorem.words(2),
    modifiedTime: faker.date.recent().toISOString(),
    url: `/${faker.lorem.slug()}`,
    linkName: faker.lorem.words(2),
    target: '_self',
    external: false,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Content Slot
// ---------------------------------------------------------------------------

export function createContentSlot(
  overrides: Partial<ContentSlot> = {},
): ContentSlot {
  const components: ComponentList = overrides.components ?? {
    component: [
      createParagraphComponent(),
      createBannerComponent(),
    ],
  }

  return {
    slotId: faker.string.alphanumeric(12),
    position: 'Section1',
    name: faker.lorem.words(2),
    slotShared: false,
    slotStatus: 'ACTIVE',
    components,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// CMS Page
// ---------------------------------------------------------------------------

export function createCmsPage(
  overrides: Partial<CmsPageData> = {},
): CmsPageData {
  const contentSlots: ContentSlotList = overrides.contentSlots ?? {
    contentSlot: [
      createContentSlot({ position: 'TopHeaderSlot' }),
      createContentSlot({ position: 'Section1' }),
      createContentSlot({ position: 'BottomHeaderSlot' }),
    ],
  }

  return {
    uid: faker.string.alphanumeric(12),
    name: 'Homepage',
    title: 'Homepage | Electronics Store',
    description: faker.lorem.sentence(),
    template: 'LandingPage2Template',
    typeCode: 'ContentPage',
    label: '/homepage',
    defaultPage: true,
    robotTag: 'INDEX_FOLLOW',
    contentSlots,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Batch component list response
// ---------------------------------------------------------------------------

export function createCmsComponentListResponse(
  overrides: Partial<CmsComponentListResponse> = {},
): CmsComponentListResponse {
  const component = overrides.component ?? [
    createBannerComponent({ uid: 'comp-1' }),
    createParagraphComponent({ uid: 'comp-2' }),
    createLinkComponent({ uid: 'comp-3' }),
  ]

  return {
    component,
    pagination: createPagination({
      currentPage: 0,
      pageSize: 10,
      totalResults: component.length,
      totalPages: 1,
    }),
    ...overrides,
  }
}
