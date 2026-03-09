// Checkout domain — barrel export

// Hooks
export { useDeliveryAddress } from './useDeliveryAddress'
export { useDeliveryModes } from './useDeliveryModes'
export { usePaymentDetails } from './usePaymentDetails'
export { usePlaceOrder } from './usePlaceOrder'
export { useGuestCheckout } from './useGuestCheckout'

// Query factories
export { checkoutQueries } from './checkout.queries'

// Normalizers
export { normalizeOrder } from './checkout.normalizers'
export type { NormalizedOrder } from './checkout.normalizers'

// Types
export type {
  Order,
  Consignment,
  ConsignmentEntry,
  DeliveryModeList,
  SetDeliveryAddressParams,
  SetPaymentDetailsParams,
  PlaceOrderParams,
  GuestCheckoutParams,
  UseDeliveryModesOptions,
} from './checkout.types'

// Re-exported from cart for convenience (also available from cart module)
export type { Address, DeliveryMode, PaymentDetails } from './checkout.types'
