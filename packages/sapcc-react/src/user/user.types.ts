/**
 * User account domain types — mirrors SAP Commerce Cloud OCC v2 user API shapes.
 *
 * Types shared with the cart module (Address, PaymentDetails) are imported
 * from cart.types.ts and re-exported for convenience.
 */

import type { OccFields } from '../http/types'
import type { Address, PaymentDetails } from '../cart/cart.types'
import type { Product, Pagination } from '../product/product.types'

// Re-export shared types so user module consumers don't need to import from cart
export type { Address, PaymentDetails }

// ---------------------------------------------------------------------------
// Profile types
// ---------------------------------------------------------------------------

/** Parameters for updating the user's profile via PATCH /users/current */
export interface UpdateUserProfileParams {
  /** Title code (e.g., 'mr', 'ms') */
  titleCode?: string
  /** First name */
  firstName: string
  /** Last name */
  lastName: string
  /** Language preference */
  language?: { isocode: string }
  /** Currency preference */
  currency?: { isocode: string }
}

/** Parameters for changing the user's password via POST /users/current/password */
export interface ChangePasswordParams {
  /** Current password */
  oldPassword: string
  /** New password */
  newPassword: string
}

// ---------------------------------------------------------------------------
// Address types
// ---------------------------------------------------------------------------

/** Response from GET /users/{userId}/addresses */
export interface AddressListResponse {
  addresses?: Address[]
}

/** Parameters for creating a new address via POST /users/{userId}/addresses */
export interface CreateAddressParams {
  /** Title code (e.g., 'mr', 'ms') */
  titleCode?: string
  /** First name */
  firstName: string
  /** Last name */
  lastName: string
  /** Address line 1 */
  line1: string
  /** Address line 2 */
  line2?: string
  /** City / town */
  town: string
  /** Country (ISO code) */
  country: { isocode: string }
  /** Region / state (ISO code) */
  region?: { isocode: string }
  /** Postal / ZIP code */
  postalCode: string
  /** Phone number */
  phone?: string
  /** Whether this is the default address */
  defaultAddress?: boolean
}

/** Parameters for updating an address (same shape as create) */
export type UpdateAddressParams = CreateAddressParams

/** Result from address verification */
export interface AddressVerificationResult {
  /** Verification decision */
  decision: 'ACCEPT' | 'REJECT' | 'REVIEW' | 'UNKNOWN' | (string & {})
  /** Suggested corrected addresses */
  suggestedAddresses?: Address[]
  /** Verification errors */
  errors?: AddressVerificationError[]
}

/** Individual error from address verification */
export interface AddressVerificationError {
  subject?: string
  reason?: string
  message?: string
  type?: string
}

// ---------------------------------------------------------------------------
// Payment method types
// ---------------------------------------------------------------------------

/** Response from GET /users/{userId}/paymentdetails */
export interface PaymentDetailsListResponse {
  payments?: PaymentDetails[]
}

/** Parameters for updating a saved payment method */
export interface UpdatePaymentDetailsParams {
  /** Account holder name */
  accountHolderName?: string
  /** Card type */
  cardType?: { code: string }
  /** Expiry month (e.g., '01', '12') */
  expiryMonth?: string
  /** Expiry year (e.g., '2027') */
  expiryYear?: string
  /** Whether this is the default payment method */
  defaultPayment?: boolean
  /** Billing address */
  billingAddress?: CreateAddressParams
}

// ---------------------------------------------------------------------------
// Consent types
// ---------------------------------------------------------------------------

/** A consent record (given or withdrawn) */
export interface Consent {
  /** Consent code */
  code: string
  /** ISO date when consent was given */
  consentGivenDate?: string
  /** ISO date when consent was withdrawn (null if still active) */
  consentWithdrawnDate?: string
}

/** A consent template with the user's current consent status */
export interface ConsentTemplate {
  /** Template identifier */
  id: string
  /** Display name */
  name?: string
  /** Description text */
  description?: string
  /** Template version */
  version: number
  /** User's current consent for this template */
  currentConsent?: Consent
}

/** Response from GET /users/{userId}/consenttemplates */
export interface ConsentTemplateListResponse {
  consentTemplates?: ConsentTemplate[]
}

/** Parameters for giving consent */
export interface GiveConsentParams {
  /** Consent template ID */
  consentTemplateId: string
  /** Consent template version */
  consentTemplateVersion: number
}

// ---------------------------------------------------------------------------
// Notification preference types
// ---------------------------------------------------------------------------

/** Notification channel type */
export type NotificationChannel = 'EMAIL' | 'SMS' | 'SITE_MESSAGE' | (string & {})

/** A single notification preference */
export interface NotificationPreference {
  /** Notification channel */
  channel: NotificationChannel
  /** Channel value (e.g., email address, phone number) */
  value: string
  /** Whether this channel is enabled */
  enabled: boolean
}

/** Response from GET /users/{userId}/notificationpreferences */
export interface NotificationPreferenceListResponse {
  preferences?: NotificationPreference[]
}

// ---------------------------------------------------------------------------
// Product interest types
// ---------------------------------------------------------------------------

/** Notification type for product interests */
export type NotificationType = 'BACK_IN_STOCK' | 'PRICE_REDUCTION' | (string & {})

/** A single interest entry for a product */
export interface ProductInterestEntry {
  /** Type of interest notification */
  interestType: NotificationType
  /** ISO date when interest was registered */
  dateAdded?: string
  /** ISO date when interest expires */
  expirationDate?: string
}

/** A product with its interest subscriptions */
export interface ProductInterestRelation {
  /** The product being watched */
  product: Product
  /** Interest entries for this product */
  productInterestEntry?: ProductInterestEntry[]
}

/** Paginated search result for product interests */
export interface ProductInterestSearchResult {
  /** Interest relations */
  results?: ProductInterestRelation[]
  /** Available sort options */
  sorts?: { code: string; asc?: boolean; selected?: boolean }[]
  /** Pagination info */
  pagination?: Pagination
}

/** Parameters for adding a product interest */
export interface AddProductInterestParams {
  /** Product code */
  productCode: string
  /** Notification type */
  notificationType: NotificationType
}

/** Parameters for removing a product interest */
export interface RemoveProductInterestParams {
  /** Product code */
  productCode: string
  /** Notification type */
  notificationType: NotificationType
}

// ---------------------------------------------------------------------------
// Customer coupon types
// ---------------------------------------------------------------------------

/** Customer coupon status */
export type CustomerCouponStatus = 'EFFECTIVE' | 'PRESESSION' | 'EXPIRED' | (string & {})

/** A customer coupon */
export interface CustomerCoupon {
  /** Coupon identifier */
  couponId: string
  /** Display name */
  name?: string
  /** Description */
  description?: string
  /** ISO date when coupon becomes active */
  startDate?: string
  /** ISO date when coupon expires */
  endDate?: string
  /** Coupon status */
  status: CustomerCouponStatus
  /** Whether the coupon applies to all products */
  allProductsApplicable?: boolean
  /** Whether notifications are enabled for this coupon */
  notificationOn?: boolean
}

/** Paginated search result for customer coupons */
export interface CustomerCouponSearchResult {
  /** Coupons */
  coupons?: CustomerCoupon[]
  /** Available sort options */
  sorts?: { code: string; asc?: boolean; selected?: boolean }[]
  /** Pagination info */
  pagination?: Pagination
}

// ---------------------------------------------------------------------------
// Hook option types
// ---------------------------------------------------------------------------

/** Options for `useUserProfile()` */
export interface UseUserProfileOptions {
  /** OCC field level for the user profile response */
  fields?: OccFields
  /** Whether the query is enabled (default: true when authenticated) */
  enabled?: boolean
}

/** Options for `useAddresses()` */
export interface UseAddressesOptions {
  /** OCC field level */
  fields?: OccFields
  /** Whether the query is enabled (default: true when authenticated) */
  enabled?: boolean
}

/** Options for `usePaymentMethods()` */
export interface UsePaymentMethodsOptions {
  /** Return only saved payment methods (default: true) */
  saved?: boolean
  /** OCC field level */
  fields?: OccFields
  /** Whether the query is enabled (default: true when authenticated) */
  enabled?: boolean
}

/** Options for `useConsents()` */
export interface UseConsentsOptions {
  /** OCC field level */
  fields?: OccFields
  /** Whether the query is enabled (default: true when authenticated) */
  enabled?: boolean
}

/** Options for `useNotificationPreferences()` */
export interface UseNotificationPreferencesOptions {
  /** Whether the query is enabled (default: true when authenticated) */
  enabled?: boolean
}

/** Options for `useProductInterests()` */
export interface UseProductInterestsOptions {
  /** Items per page */
  pageSize?: number
  /** Page number (0-indexed) */
  currentPage?: number
  /** Sort field */
  sort?: string
  /** Filter by product code */
  productCode?: string
  /** Filter by notification type */
  notificationType?: NotificationType
  /** OCC field level */
  fields?: OccFields
  /** Whether the query is enabled (default: true when authenticated) */
  enabled?: boolean
}

/** Options for `useCustomerCoupons()` */
export interface UseCustomerCouponsOptions {
  /** Items per page */
  pageSize?: number
  /** Page number (0-indexed) */
  currentPage?: number
  /** Sort field */
  sort?: string
  /** OCC field level */
  fields?: OccFields
  /** Whether the query is enabled (default: true when authenticated) */
  enabled?: boolean
}
