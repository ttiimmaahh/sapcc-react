// CMS domain — barrel export

// Hooks
export { useCmsPage } from './useCmsPage'
export { useCmsComponent } from './useCmsComponent'
export { useCmsComponents } from './useCmsComponents'
export { useCmsComponentMapping } from './useCmsComponentMapping'

// Rendering components
export { CmsPage } from './CmsPage'
export { CmsSlot } from './CmsSlot'
export { CmsOutlet } from './CmsOutlet'

// Helper functions
export { getSlotByPosition, getSlotComponents } from './cms.helpers'

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
  CmsPageData,
  // Batch response
  CmsComponentListResponse,
  // Hook options
  UseCmsPageOptions,
  UseCmsComponentOptions,
  UseCmsComponentsOptions,
  // Rendering prop types
  CmsComponentProps,
  CmsPageProps,
  CmsSlotProps,
  CmsOutletProps,
} from './cms.types'
export type { CmsComponentMappingResult } from './useCmsComponentMapping'
