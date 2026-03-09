/**
 * Cart domain types — mirrors SAP Commerce Cloud OCC v2 cart API shapes.
 *
 * These interfaces represent the JSON payloads returned by the OCC REST API.
 * Normalizers (cart.normalizers.ts) transform these into cleaner models if needed.
 */

import type { Price, Product, Promotion, PromotionResult } from '../product/product.types'

// ---------------------------------------------------------------------------
// Delivery / Address types (lightweight — full versions in checkout)
// ---------------------------------------------------------------------------

/** Delivery address on the cart */
export interface Address {
  id?: string
  titleCode?: string
  title?: string
  firstName?: string
  lastName?: string
  line1?: string
  line2?: string
  town?: string
  region?: {
    isocode: string
    name?: string
  }
  country?: {
    isocode: string
    name?: string
  }
  postalCode?: string
  phone?: string
  email?: string
  defaultAddress?: boolean
  formattedAddress?: string
}

/** Delivery mode set on the cart */
export interface DeliveryMode {
  code: string
  name?: string
  description?: string
  deliveryCost?: Price
}

// ---------------------------------------------------------------------------
// Payment types (lightweight — full versions in checkout)
// ---------------------------------------------------------------------------

/** Payment details on the cart */
export interface PaymentDetails {
  id?: string
  accountHolderName?: string
  cardNumber?: string
  cardType?: {
    code: string
    name?: string
  }
  expiryMonth?: string
  expiryYear?: string
  defaultPayment?: boolean
  billingAddress?: Address
}

// ---------------------------------------------------------------------------
// Cart entry types
// ---------------------------------------------------------------------------

/** Single line item in the cart */
export interface CartEntry {
  entryNumber: number
  product: Product
  quantity: number
  basePrice?: Price
  totalPrice?: Price
  updateable?: boolean
  deliveryMode?: DeliveryMode
  deliveryPointOfService?: {
    name: string
    displayName?: string
  }
}

/** Also known as OrderEntry in some OCC contexts — same shape */
export type OrderEntry = CartEntry

// ---------------------------------------------------------------------------
// Voucher types
// ---------------------------------------------------------------------------

/** Applied voucher on the cart */
export interface Voucher {
  code: string
  name?: string
  description?: string
  value?: number
  valueFormatted?: string
  valueString?: string
  freeShipping?: boolean
  currency?: {
    isocode: string
    name?: string
  }
  voucherCode?: string
  appliedValue?: Price
}

// ---------------------------------------------------------------------------
// Promotion types (cart-specific)
// ---------------------------------------------------------------------------

/** Entry consumed by a promotion */
export interface PromotionOrderEntryConsumed {
  adjustedUnitPrice: number
  code: string
  orderEntryNumber: number
  quantity: number
}

/** Applied promotion result on the cart */
export interface CartPromotionResult {
  description?: string
  promotion: Promotion
  consumedEntries?: PromotionOrderEntryConsumed[]
}

// ---------------------------------------------------------------------------
// Cart entity
// ---------------------------------------------------------------------------

/** Full cart representation from OCC `/users/{userId}/carts/{cartId}` */
export interface Cart {
  /** Cart code (used for authenticated carts) */
  code: string
  /** Cart GUID (used for anonymous carts) */
  guid?: string
  /** Cart entries (line items) */
  entries?: CartEntry[]
  /** Total number of items */
  totalItems?: number
  /** Total number of units (sum of quantities) */
  totalUnitCount?: number

  // Pricing
  totalPrice?: Price
  totalPriceWithTax?: Price
  totalTax?: Price
  subTotal?: Price
  deliveryCost?: Price
  totalDiscounts?: Price
  orderDiscounts?: Price
  productDiscounts?: Price

  // Delivery
  deliveryAddress?: Address
  deliveryMode?: DeliveryMode
  deliveryOrderGroups?: unknown[]

  // Payment
  paymentInfo?: PaymentDetails

  // Vouchers & Promotions
  appliedVouchers?: Voucher[]
  appliedOrderPromotions?: CartPromotionResult[]
  appliedProductPromotions?: CartPromotionResult[]
  potentialOrderPromotions?: PromotionResult[]
  potentialProductPromotions?: PromotionResult[]

  // Guest checkout
  /** Guest checkout user (contains email) */
  user?: {
    uid: string
    name?: string
  }

  // Saved cart fields
  name?: string
  description?: string
  savedTime?: string
  saveTime?: string

  // Status
  calculated?: boolean
  net?: boolean
}

// ---------------------------------------------------------------------------
// Cart modification response
// ---------------------------------------------------------------------------

/** Response from adding or updating a cart entry */
export interface CartModification {
  /** Status of the modification */
  statusCode: 'success' | 'lowStock' | 'noStock' | 'maxOrderQuantityExceeded' | (string & {})
  /** Message describing the status */
  statusMessage?: string
  /** Number of items actually added */
  quantityAdded: number
  /** Requested quantity */
  quantity: number
  /** The modified or created entry */
  entry: CartEntry
}

// ---------------------------------------------------------------------------
// Saved cart response
// ---------------------------------------------------------------------------

/** Response from save/restore/clone cart operations */
export interface SaveCartResult {
  savedCartData: Cart
}

// ---------------------------------------------------------------------------
// Cart merge strategy
// ---------------------------------------------------------------------------

/**
 * Strategy for merging anonymous cart into user cart on login.
 * - `merge` (default) — merge anonymous entries into user cart
 * - `keepAnonymous` — discard user cart, keep anonymous
 * - `keepUser` — discard anonymous cart, keep user cart
 */
export type CartMergeStrategy = 'merge' | 'keepAnonymous' | 'keepUser'

// ---------------------------------------------------------------------------
// Cart storage interface
// ---------------------------------------------------------------------------

/**
 * Interface for pluggable cart GUID storage adapters.
 * Used to persist the anonymous cart GUID across page reloads.
 */
export interface CartStorage {
  /** Retrieve stored cart GUID, or null if none exists */
  getCartGuid(): string | null
  /** Store cart GUID */
  setCartGuid(guid: string): void
  /** Remove stored cart GUID */
  removeCartGuid(): void
}

// ---------------------------------------------------------------------------
// Cart context state
// ---------------------------------------------------------------------------

/** Internal cart state tracked by CartProvider */
export interface CartState {
  /** Active cart data */
  cart: Cart | null
  /** Whether a cart operation is in progress */
  isLoading: boolean
  /** Whether the cart has been loaded/initialized */
  isInitialized: boolean
}

// ---------------------------------------------------------------------------
// Hook option types
// ---------------------------------------------------------------------------

/** Options for `useCart()` */
export interface UseCartOptions {
  /** OCC fields level (default: 'FULL') */
  fields?: string
  /** Whether the query is enabled */
  enabled?: boolean
}

/** Options for add entry mutation */
export interface AddEntryParams {
  /** Product code to add */
  productCode: string
  /** Quantity to add (default: 1) */
  quantity?: number
}

/** Options for update entry mutation */
export interface UpdateEntryParams {
  /** Entry number to update */
  entryNumber: number
  /** New quantity */
  quantity: number
}

/** Options for `useSavedCarts()` */
export interface UseSavedCartsOptions {
  /** OCC fields level */
  fields?: string
  /** Whether the query is enabled (default: true when authenticated) */
  enabled?: boolean
}

/** Options for saving a cart */
export interface SaveCartParams {
  /** Name for the saved cart */
  saveCartName: string
  /** Description for the saved cart */
  saveCartDescription?: string
}
