// Product domain — barrel export

// Hooks
export { useProducts } from './useProducts'
export { useProduct } from './useProduct'
export { useProductReviews } from './useProductReviews'
export { useSubmitReview } from './useSubmitReview'
export { useProductSuggestions } from './useProductSuggestions'
export { useProductStock } from './useProductStock'
export { useProductReferences } from './useProductReferences'

// Query factories
export { productQueries } from './product.queries'

// Normalizers
export {
  normalizeProduct,
  normalizeReview,
  normalizeSearchResults,
  extractPrimaryImage,
} from './product.normalizers'
export type { NormalizedProduct, NormalizedReview } from './product.normalizers'

// Types
export type {
  Product,
  Price,
  Image,
  Stock,
  Category,
  Feature,
  FeatureValue,
  Classification,
  Promotion,
  PromotionResult,
  VolumePricing,
  VariantOption,
  VariantOptionQualifier,
  BaseOption,
  Breadcrumb,
  SearchState,
  FacetValue,
  Facet,
  Sort,
  Pagination,
  SpellingSuggestion,
  ProductSearchPage,
  Suggestion,
  SuggestionList,
  Principal,
  Review,
  ReviewList,
  ReviewSubmission,
  ProductReferenceType,
  ProductReference,
  ProductReferenceList,
  StoreStock,
  ProductStockResponse,
  UseProductsOptions,
  UseProductOptions,
  UseProductReviewsOptions,
  UseProductSuggestionsOptions,
  UseProductReferencesOptions,
} from './product.types'
