// Cart domain — barrel export

// Hooks
export { useCart } from './useCart'
export { useCartEntries } from './useCartEntries'
export { useCartVouchers } from './useCartVouchers'
export { useCartPromotions } from './useCartPromotions'
export { useSavedCarts } from './useSavedCarts'

// Provider (internal — wired into SapccProvider automatically)
export { CartProvider } from './CartProvider'

// Query factories
export { cartQueries } from './cart.queries'

// Storage
export {
  createCartStorage,
  LocalStorageCartStorage,
  InMemoryCartStorage,
} from './cart-storage'

// Normalizers
export { normalizeCart, normalizeCartEntry } from './cart.normalizers'
export type { NormalizedCart, NormalizedCartEntry } from './cart.normalizers'

// Context (for advanced usage)
export { CartContext } from './CartContext'
export type { CartContextValue } from './CartContext'

// Types
export type {
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
} from './cart.types'
