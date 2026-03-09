/**
 * CMS domain types — mirrors SAP Commerce Cloud OCC v2 CMS API shapes.
 *
 * The OCC CMS API (provided by the `cmsoccaddon`) exposes page and component
 * data for storefront consumption. These types represent the raw JSON payloads
 * returned by the API.
 *
 * Key OCC quirk: arrays are wrapped in singular-named container objects:
 * - `contentSlots.contentSlot[]` (not `contentSlots[]`)
 * - `components.component[]` (not `components[]`)
 */

import type { ReactNode } from 'react'
import type { OccFields } from '../http/types'
import type { Pagination, Sort } from '../product/product.types'

// ---------------------------------------------------------------------------
// Enums / union types
// ---------------------------------------------------------------------------

/** CMS page type — determines which identifier to use when fetching */
export type PageType =
  | 'ContentPage'
  | 'ProductPage'
  | 'CategoryPage'
  | 'CatalogPage'
  | (string & {})

/** Robot tag controlling search engine indexing behavior */
export type PageRobots =
  | 'INDEX_FOLLOW'
  | 'NOINDEX_FOLLOW'
  | 'INDEX_NOFOLLOW'
  | 'NOINDEX_NOFOLLOW'
  | (string & {})

// ---------------------------------------------------------------------------
// CMS Component types
// ---------------------------------------------------------------------------

/**
 * Base CMS component — all components share these fields.
 *
 * The OCC API returns component-type-specific properties as flat fields
 * alongside these base properties. The `typeCode` field is the discriminator
 * (e.g., 'BannerComponent', 'CMSParagraphComponent').
 *
 * Use the index signature to access type-specific fields, or cast to a
 * typed subtype (e.g., `CmsBannerComponent`).
 */
export interface CmsComponent {
  /** Unique component identifier */
  uid?: string
  /** Component type code — discriminator for polymorphic data */
  typeCode?: string
  /** Display name */
  name?: string
  /** Last modified timestamp (ISO string) */
  modifiedTime?: string
  /** Additional properties (SmartEdit metadata, etc.) */
  otherProperties?: Record<string, unknown>
  /** Component-type-specific fields are spread as flat properties */
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Common CMS component subtypes (typed helpers)
// ---------------------------------------------------------------------------

/** Banner component with headline, content, media, and link */
export interface CmsBannerComponent extends CmsComponent {
  typeCode?: 'BannerComponent' | 'SimpleResponsiveBannerComponent' | (string & {})
  headline?: string
  content?: string
  media?: Record<string, unknown>
  urlLink?: string
  external?: boolean
}

/** Paragraph component with rich text content */
export interface CmsParagraphComponent extends CmsComponent {
  typeCode?: 'CMSParagraphComponent' | (string & {})
  content?: string
  title?: string
  container?: boolean
}

/** Link component for navigation */
export interface CmsLinkComponent extends CmsComponent {
  typeCode?: 'CMSLinkComponent' | (string & {})
  url?: string
  linkName?: string
  target?: string
  external?: boolean
  contentPage?: string
}

/** Navigation component */
export interface CmsNavigationComponent extends CmsComponent {
  typeCode?: 'NavigationComponent' | (string & {})
  navigationNode?: Record<string, unknown>
  styleClass?: string
  wrapAfter?: number
}

/** Product carousel component */
export interface CmsProductCarouselComponent extends CmsComponent {
  typeCode?: 'ProductCarouselComponent' | (string & {})
  productCodes?: string
  title?: string
}

// ---------------------------------------------------------------------------
// Content slot types
// ---------------------------------------------------------------------------

/**
 * Wrapper for an array of components within a slot.
 * OCC uses singular naming: `component` (not `components`).
 */
export interface ComponentList {
  component?: CmsComponent[]
}

/** A content slot within a CMS page */
export interface ContentSlot {
  /** Unique slot identifier */
  slotId?: string
  /** Position name (e.g., 'Section1', 'TopHeaderSlot') — used for slot lookup */
  position?: string
  /** Display name */
  name?: string
  /** Whether this slot is shared across pages */
  slotShared?: boolean
  /** Slot status indicator */
  slotStatus?: string
  /** SmartEdit properties */
  properties?: Record<string, unknown>
  /** Components within this slot */
  components?: ComponentList
}

/**
 * Wrapper for an array of content slots within a page.
 * OCC uses singular naming: `contentSlot` (not `contentSlots`).
 */
export interface ContentSlotList {
  contentSlot?: ContentSlot[]
}

// ---------------------------------------------------------------------------
// CMS Page types
// ---------------------------------------------------------------------------

/** A CMS page returned by the OCC API */
export interface CmsPageData {
  /** Page UID */
  uid?: string
  /** Page display name */
  name?: string
  /** Page title (for HTML <title>) */
  title?: string
  /** Page meta description */
  description?: string
  /** Page template name (e.g., 'LandingPage2Template') */
  template?: string
  /** Page type code (e.g., 'ContentPage', 'ProductPage') */
  typeCode?: string
  /** Page label — used for ContentPage lookup (e.g., '/homepage', '/faq') */
  label?: string
  /** Whether this is the default page for its type */
  defaultPage?: boolean
  /** Robot tag controlling search engine indexing */
  robotTag?: PageRobots
  /** Content slots within this page */
  contentSlots?: ContentSlotList
  /** SmartEdit properties */
  properties?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Batch component response
// ---------------------------------------------------------------------------

/** Response from `GET /cms/components` (batch fetch) */
export interface CmsComponentListResponse {
  /** Array of components */
  component?: CmsComponent[]
  /** Pagination information */
  pagination?: Pagination
  /** Available sort options */
  sorts?: Sort[]
}

// ---------------------------------------------------------------------------
// Hook option types
// ---------------------------------------------------------------------------

/** Options for `useCmsPage()` */
export interface UseCmsPageOptions {
  /**
   * Page type — determines which identifier param is used.
   * Required unless `pageId` is provided.
   */
  pageType?: PageType
  /**
   * Page label or ID — used when `pageType` is 'ContentPage'.
   * Examples: '/homepage', '/faq', '/terms-and-conditions'
   */
  pageLabelOrId?: string
  /**
   * Code — used when `pageType` is 'ProductPage', 'CategoryPage', or 'CatalogPage'.
   * This is the product code, category code, or catalog code.
   */
  code?: string
  /**
   * Direct page ID — alternative to pageType+label/code.
   * When provided, fetches `GET /cms/pages/{pageId}` directly.
   */
  pageId?: string
  /** OCC fields parameter (default: 'DEFAULT') */
  fields?: OccFields
  /** Whether the query is enabled (default: true) */
  enabled?: boolean
}

/** Options for `useCmsComponent()` — single component fetch */
export interface UseCmsComponentOptions {
  /** OCC fields parameter (default: 'DEFAULT') */
  fields?: OccFields
  /** Product code — context param when on a ProductPage */
  productCode?: string
  /** Category code — context param when on a CategoryPage */
  categoryCode?: string
  /** Catalog code — context param when on a CatalogPage */
  catalogCode?: string
  /** Whether the query is enabled (default: true) */
  enabled?: boolean
}

/** Options for `useCmsComponents()` — batch component fetch */
export interface UseCmsComponentsOptions {
  /** OCC fields parameter (default: 'DEFAULT') */
  fields?: OccFields
  /** Product code — context param when on a ProductPage */
  productCode?: string
  /** Category code — context param when on a CategoryPage */
  categoryCode?: string
  /** Catalog code — context param when on a CatalogPage */
  catalogCode?: string
  /** Whether the query is enabled (default: true) */
  enabled?: boolean
}

// ---------------------------------------------------------------------------
// Rendering component prop types (Phase 5B)
// ---------------------------------------------------------------------------

/**
 * Props passed to every CMS component registered in the component mapping.
 *
 * @typeParam T - The CMS component data type (defaults to `CmsComponent`)
 *
 * @example
 * ```tsx
 * function Banner({ data, slot }: CmsComponentProps<CmsBannerComponent>) {
 *   return <h2>{data.headline}</h2>
 * }
 * ```
 */
export interface CmsComponentProps<T extends CmsComponent = CmsComponent> {
  /** The full CMS component data object from the OCC API */
  data: T
  /** Position name of the slot this component is rendered within */
  slot?: string
}

/**
 * Props for the `<CmsPage>` rendering component.
 *
 * Renders all content slots from a CMS page by iterating over
 * `page.contentSlots.contentSlot[]` and rendering a `<CmsSlot>` for each.
 */
export interface CmsPageProps {
  /** CMS page data — typically from `useCmsPage()` */
  page?: CmsPageData
  /** Whether the page data is currently loading */
  loading?: boolean
  /** Fallback content shown while the page is loading */
  loadingFallback?: ReactNode
  /** Optional CSS class on the wrapper element */
  className?: string
}

/**
 * Props for the `<CmsSlot>` rendering component.
 *
 * Resolves CMS components from the slot and renders them using the
 * component mapping from `SapccConfig`. Each component is wrapped
 * in an individual `<Suspense>` boundary.
 */
export interface CmsSlotProps {
  /** Slot position name (e.g., 'Section1', 'TopHeaderSlot') */
  name: string
  /** CMS page data — the slot is extracted by matching `name` to `position` */
  page?: CmsPageData
  /** Alternative: pass components directly instead of extracting from a page */
  components?: CmsComponent[]
  /** Suspense fallback rendered per component (default: `null`) */
  suspenseFallback?: ReactNode
  /** Optional CSS class on the wrapper element */
  className?: string
  /** CmsOutlet children for before/after/replace injection */
  children?: ReactNode
}

/**
 * Props for the `<CmsOutlet>` marker component.
 *
 * Used as a child of `<CmsSlot>` to inject custom content
 * before, after, or in place of the CMS components.
 *
 * @example
 * ```tsx
 * <CmsSlot name="Header" page={page}>
 *   <CmsOutlet position="before"><AnnouncementBanner /></CmsOutlet>
 *   <CmsOutlet position="after"><PromoStrip /></CmsOutlet>
 * </CmsSlot>
 * ```
 */
export interface CmsOutletProps {
  /** Where to inject the content relative to the CMS components */
  position: 'before' | 'after' | 'replace'
  /** The custom content to inject */
  children: ReactNode
}
