/**
 * Product domain types — mirrors SAP Commerce Cloud OCC v2 product API shapes.
 *
 * These interfaces represent the JSON payloads returned by the OCC REST API.
 * They are intentionally kept close to the OCC response format.
 * Normalizers (product.normalizers.ts) transform these into cleaner models if needed.
 */

// ---------------------------------------------------------------------------
// Shared / embedded types
// ---------------------------------------------------------------------------

/** Price representation used across OCC responses */
export interface Price {
  currencyIso: string
  value: number
  formattedValue: string
  priceType?: 'BUY' | 'FROM' | (string & {})
  maxQuantity?: number
  minQuantity?: number
}

/** Image attached to a product, category, or other entity */
export interface Image {
  url: string
  altText?: string
  format?: 'thumbnail' | 'product' | 'zoom' | 'cartIcon' | (string & {})
  imageType?: 'PRIMARY' | 'GALLERY' | (string & {})
  galleryIndex?: number
}

/** Stock availability information */
export interface Stock {
  stockLevelStatus: 'inStock' | 'lowStock' | 'outOfStock' | (string & {})
  stockLevel?: number
}

/** Category reference (lightweight) */
export interface Category {
  code: string
  name?: string
  url?: string
  image?: Image
}

/** Product classification feature (e.g., specs like "Weight: 500g") */
export interface Feature {
  code: string
  name: string
  featureUnit?: {
    name: string
    symbol: string
    unitType: string
  }
  featureValues: FeatureValue[]
  comparable: boolean
  range: boolean
}

/** Single feature value */
export interface FeatureValue {
  value: string
}

/** Classification group containing features */
export interface Classification {
  code: string
  name: string
  features: Feature[]
}

/** Promotion applied to a product */
export interface Promotion {
  code: string
  title?: string
  description?: string
  promotionType?: string
  startDate?: string
  endDate?: string
  productBanner?: Image
}

/** Promotion result for a product */
export interface PromotionResult {
  description?: string
  promotion: Promotion
}

/** Volume pricing entry */
export interface VolumePricing {
  currencyIso: string
  maxQuantity?: number
  minQuantity: number
  value: number
  formattedValue: string
  priceType?: string
}

/** Variant option for configurable products */
export interface VariantOption {
  code: string
  priceData?: Price
  stock?: Stock
  url?: string
  variantOptionQualifiers: VariantOptionQualifier[]
}

/** Qualifier for a variant option (e.g., color, size) */
export interface VariantOptionQualifier {
  name?: string
  qualifier: string
  value?: string
  image?: Image
}

/** Base option group for variant products */
export interface BaseOption {
  options: VariantOption[]
  selected: VariantOption
  variantType: string
}

/** Breadcrumb entry for a product in a category hierarchy */
export interface Breadcrumb {
  facetCode: string
  facetName: string
  facetValueCode: string
  facetValueName: string
  removeQuery: SearchState
  truncateQuery?: SearchState
}

// ---------------------------------------------------------------------------
// Product entity
// ---------------------------------------------------------------------------

/** Full product representation from OCC `/products/:productCode` */
export interface Product {
  code: string
  name: string
  summary?: string
  description?: string
  url?: string

  // Pricing
  price?: Price
  volumePrices?: VolumePricing[]
  priceRange?: { maxPrice: Price; minPrice: Price }

  // Media
  images?: Image[]

  // Stock
  stock?: Stock
  availableForPickup?: boolean
  purchasable?: boolean

  // Categorization
  categories?: Category[]
  classifications?: Classification[]
  baseProduct?: string

  // Reviews
  averageRating?: number
  numberOfReviews?: number

  // Variants
  baseOptions?: BaseOption[]
  variantOptions?: VariantOption[]
  variantType?: string

  // Promotions
  potentialPromotions?: PromotionResult[]

  // Misc
  configurable?: boolean
  multidimensional?: boolean
  tags?: string[]
}

// ---------------------------------------------------------------------------
// Product search
// ---------------------------------------------------------------------------

/** Search state representing query + filters applied */
export interface SearchState {
  query: string
  url?: string
}

/** Facet value (e.g., "Red" under "Color") */
export interface FacetValue {
  code: string
  count: number
  name: string
  query: SearchState
  selected: boolean
}

/** Facet group (e.g., "Color", "Brand", "Price Range") */
export interface Facet {
  category: boolean
  multiSelect: boolean
  name: string
  priority: number
  values: FacetValue[]
  visible: boolean
}

/** Sort option in search results */
export interface Sort {
  code: string
  name: string
  selected: boolean
}

/** Pagination metadata */
export interface Pagination {
  currentPage: number
  pageSize: number
  sort: string
  totalPages: number
  totalResults: number
}

/** Spell check suggestion from search */
export interface SpellingSuggestion {
  query: string
  suggestion: string
}

/** Product search page response from `/products/search` */
export interface ProductSearchPage {
  breadcrumbs?: Breadcrumb[]
  currentQuery: SearchState
  facets?: Facet[]
  freeTextSearch: string
  keywordRedirectUrl?: string
  pagination: Pagination
  products: Product[]
  sorts: Sort[]
  spellingSuggestion?: SpellingSuggestion
}

// ---------------------------------------------------------------------------
// Product suggestions (typeahead)
// ---------------------------------------------------------------------------

/** Single suggestion entry from typeahead */
export interface Suggestion {
  value: string
}

/** Response from `/products/suggestions` */
export interface SuggestionList {
  suggestions: Suggestion[]
}

// ---------------------------------------------------------------------------
// Product reviews
// ---------------------------------------------------------------------------

/** User principal (lightweight user reference) */
export interface Principal {
  name: string
  uid?: string
}

/** Product review */
export interface Review {
  id?: string
  alias?: string
  comment: string
  date?: string
  headline: string
  principal?: Principal
  rating: number
}

/** Response from `/products/:productCode/reviews` */
export interface ReviewList {
  reviews: Review[]
}

/** Payload for submitting a new review */
export interface ReviewSubmission {
  alias?: string
  comment: string
  headline: string
  rating: number
}

// ---------------------------------------------------------------------------
// Product references (cross-sell, upsell, similar)
// ---------------------------------------------------------------------------

/** Reference type constants */
export type ProductReferenceType =
  | 'SIMILAR'
  | 'ACCESSORIES'
  | 'CROSSELLING'
  | 'UPSELLING'
  | 'OTHERS'
  | (string & {})

/** Product reference entry */
export interface ProductReference {
  description?: string
  preselected: boolean
  quantity?: number
  referenceType: ProductReferenceType
  target: Product
}

/** Response from `/products/:productCode/references` */
export interface ProductReferenceList {
  references: ProductReference[]
}

// ---------------------------------------------------------------------------
// Stock (store-level availability)
// ---------------------------------------------------------------------------

/** Store-level stock info from `/products/:productCode/stock` */
export interface StoreStock {
  stockLevelStatus: string
  stockLevel?: number
}

/** Response wrapper for product stock at store level */
export interface ProductStockResponse {
  stockLevelStatus: string
  stockLevel?: number
}

// ---------------------------------------------------------------------------
// Hook option types
// ---------------------------------------------------------------------------

/** Options for `useProducts()` (product search) */
export interface UseProductsOptions {
  /** Free text search query */
  query?: string
  /** Current page number (0-indexed) */
  currentPage?: number
  /** Number of results per page */
  pageSize?: number
  /** Sort code (e.g., 'relevance', 'topRated', 'name-asc', 'price-asc') */
  sort?: string
  /** OCC fields level */
  fields?: string
  /** Whether the query is enabled (defaults to true if query is non-empty) */
  enabled?: boolean
}

/** Options for `useProduct()` */
export interface UseProductOptions {
  /** OCC fields level */
  fields?: string
}

/** Options for `useProductReviews()` */
export interface UseProductReviewsOptions {
  /** Maximum number of reviews to return */
  maxCount?: number
}

/** Options for `useProductSuggestions()` */
export interface UseProductSuggestionsOptions {
  /** Maximum number of suggestions */
  max?: number
  /** OCC fields level */
  fields?: string
}

/** Options for `useProductReferences()` */
export interface UseProductReferencesOptions {
  /** Type of references to fetch */
  referenceType?: ProductReferenceType
  /** OCC fields level */
  fields?: string
}
