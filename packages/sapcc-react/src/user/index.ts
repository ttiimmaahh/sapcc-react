// User account domain — barrel export

// Hooks
export { useUserProfile } from './useUserProfile'
export { useAddresses } from './useAddresses'
export { usePaymentMethods } from './usePaymentMethods'
export { useConsents } from './useConsents'
export { useNotificationPreferences } from './useNotificationPreferences'
export { useProductInterests } from './useProductInterests'
export { useCustomerCoupons } from './useCustomerCoupons'

// Query factories
export { userQueries } from './user.queries'

// Types
export type {
  // Profile
  UpdateUserProfileParams,
  ChangePasswordParams,
  UseUserProfileOptions,
  // Addresses
  AddressListResponse,
  CreateAddressParams,
  UpdateAddressParams,
  AddressVerificationResult,
  AddressVerificationError,
  UseAddressesOptions,
  // Payment methods
  PaymentDetailsListResponse,
  UpdatePaymentDetailsParams,
  UsePaymentMethodsOptions,
  // Consents
  Consent,
  ConsentTemplate,
  ConsentTemplateListResponse,
  GiveConsentParams,
  UseConsentsOptions,
  // Notification preferences
  NotificationChannel,
  NotificationPreference,
  NotificationPreferenceListResponse,
  UseNotificationPreferencesOptions,
  // Product interests
  NotificationType,
  ProductInterestEntry,
  ProductInterestRelation,
  ProductInterestSearchResult,
  AddProductInterestParams,
  RemoveProductInterestParams,
  UseProductInterestsOptions,
  // Customer coupons
  CustomerCouponStatus,
  CustomerCoupon,
  CustomerCouponSearchResult,
  UseCustomerCouponsOptions,
} from './user.types'

// Re-exported shared types (also available from cart module)
export type { Address, PaymentDetails } from './user.types'
