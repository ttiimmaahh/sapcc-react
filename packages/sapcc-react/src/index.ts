// sapcc-react — Headless React hooks for SAP Commerce Cloud OCC APIs
// Main barrel export — populated as modules are implemented

// Provider
export { SapccProvider, useSapccConfig, useSapccClient } from './provider'
export type { SapccProviderProps, SapccConfig, ResolvedSapccConfig, DeepPartial } from './provider'
export { resolveConfig, defaultConfig } from './provider'

// HTTP layer
export { OccClient } from './http'
export { OccError } from './http'
export { buildUrl, buildRawUrl, getEndpointNames } from './http'
export type {
  OccFields,
  HttpMethod,
  OccRequestConfig,
  OccResponse,
  OccErrorResponse,
  OccErrorDetail,
  Interceptor,
  OccClientConfig,
  UnauthorizedHandler,
} from './http'

// Utilities
export { deepMerge, buildQueryString } from './utils'

// Site context
export {
  useSiteContext,
  siteContextQueries,
  useLanguages,
  useCurrencies,
  useCountries,
  useRegions,
  useTitles,
  useCardTypes,
} from './site-context'
export type {
  SiteContextState,
  UseCountriesOptions,
  Language,
  Currency,
  Country,
  Region,
  Title,
  CardType,
  BaseSite,
  LanguageList,
  CurrencyList,
  CountryList,
  RegionList,
  TitleList,
  CardTypeList,
  CountryType,
} from './site-context'

// Products
export {
  useProducts,
  useProduct,
  useProductReviews,
  useSubmitReview,
  useProductSuggestions,
  useProductStock,
  useProductReferences,
  productQueries,
  normalizeProduct,
  normalizeReview,
  normalizeSearchResults,
  extractPrimaryImage,
} from './product'
export type {
  NormalizedProduct,
  NormalizedReview,
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
} from './product'

// Auth
export {
  useAuth,
  useUser,
  AuthProvider,
  authQueries,
  OAuthService,
  OAuthError,
  normalizeTokenResponse,
  isTokenExpired,
  createTokenStorage,
  LocalStorageTokenStorage,
  InMemoryTokenStorage,
  TokenInterceptor,
  AuthContext,
} from './auth'
export type {
  AuthContextValue,
  OAuthTokenResponse,
  TokenData,
  OAuthGrantType,
  LoginCredentials,
  RegistrationData,
  User,
  AuthState,
  TokenStorage,
  ResolvedAuthConfig,
  UseUserOptions,
  AuthFailureCallback,
  TokenInterceptorConfig,
} from './auth'

// Cart
export {
  useCart,
  useCartEntries,
  useCartVouchers,
  useCartPromotions,
  useSavedCarts,
  CartProvider,
  cartQueries,
  createCartStorage,
  LocalStorageCartStorage,
  InMemoryCartStorage,
  normalizeCart,
  normalizeCartEntry,
  CartContext,
} from './cart'
export type {
  CartContextValue,
  NormalizedCart,
  NormalizedCartEntry,
  Cart,
  CartEntry,
  OrderEntry,
  CartModification,
  Voucher,
  CartPromotionResult,
  PromotionOrderEntryConsumed,
  Address,
  DeliveryMode,
  PaymentDetails,
  SaveCartResult,
  CartMergeStrategy,
  CartStorage,
  CartState,
  UseCartOptions,
  AddEntryParams,
  UpdateEntryParams,
  UseSavedCartsOptions,
  SaveCartParams,
} from './cart'

// Checkout
export {
  useDeliveryAddress,
  useDeliveryModes,
  usePaymentDetails,
  usePlaceOrder,
  useGuestCheckout,
  checkoutQueries,
  normalizeOrder,
} from './checkout'
export type {
  NormalizedOrder,
  Order,
  Consignment,
  ConsignmentEntry,
  DeliveryModeList,
  SetDeliveryAddressParams,
  SetPaymentDetailsParams,
  PlaceOrderParams,
  GuestCheckoutParams,
  UseDeliveryModesOptions,
} from './checkout'
