// CMS domain — barrel export

// Hooks
export { useCmsPage } from './useCmsPage'
export { useCmsComponent } from './useCmsComponent'
export { useCmsComponents } from './useCmsComponents'

// Query factories
export { cmsQueries } from './cms.queries'

// Types
export type {
  // Enums / union types
  PageType,
  PageRobots,
  // Component types
  CmsComponent,
  CmsBannerComponent,
  CmsParagraphComponent,
  CmsLinkComponent,
  CmsNavigationComponent,
  CmsProductCarouselComponent,
  // Slot types
  ComponentList,
  ContentSlot,
  ContentSlotList,
  // Page types
  CmsPage,
  // Batch response
  CmsComponentListResponse,
  // Hook options
  UseCmsPageOptions,
  UseCmsComponentOptions,
  UseCmsComponentsOptions,
} from './cms.types'
