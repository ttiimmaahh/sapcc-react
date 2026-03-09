/**
 * Checkout domain types — mirrors SAP Commerce Cloud OCC v2 checkout API shapes.
 *
 * Types shared with the cart module (Address, DeliveryMode, PaymentDetails)
 * are re-exported from cart.types.ts for convenience.
 */

import type { Price } from '../product/product.types'
import type {
  Address,
  CartEntry,
  DeliveryMode,
  PaymentDetails,
  Voucher,
  CartPromotionResult,
} from '../cart/cart.types'

// Re-export shared types so checkout consumers don't need to import from cart
export type { Address, DeliveryMode, PaymentDetails }

// ---------------------------------------------------------------------------
// Delivery mode list (API response wrapper)
// ---------------------------------------------------------------------------

/** Response from `GET /users/{userId}/carts/{cartId}/deliverymodes` */
export interface DeliveryModeList {
  deliveryModes?: DeliveryMode[]
}

// ---------------------------------------------------------------------------
// Order types (result of placing an order)
// ---------------------------------------------------------------------------

/** Consignment entry — individual item within a consignment */
export interface ConsignmentEntry {
  orderEntry: CartEntry
  quantity: number
  shippedQuantity?: number
}

/** Consignment — a shipment group within an order */
export interface Consignment {
  code: string
  status: string
  statusDate?: string
  trackingID?: string
  entries?: ConsignmentEntry[]
  deliveryPointOfService?: {
    name: string
    displayName?: string
  }
}

/**
 * Order — the result of a placed order.
 *
 * Mirrors the SAP Commerce Cloud OCC order response. Contains all the
 * cart data (entries, prices, delivery, payment) plus order-specific
 * fields (status, creation date, consignments).
 */
export interface Order {
  /** Order code / identifier */
  code: string
  /** Order GUID */
  guid?: string

  // Status
  /** Raw status code (e.g., 'CREATED', 'COMPLETED', 'CANCELLED') */
  status?: string
  /** Human-readable status display */
  statusDisplay?: string

  // Timestamps
  created?: string
  placed?: string

  // Entries
  entries?: CartEntry[]
  totalItems?: number
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

  // Fulfillment
  consignments?: Consignment[]
  unconsignedEntries?: CartEntry[]

  // Guest checkout
  user?: {
    uid: string
    name?: string
  }

  // Net / calculated
  calculated?: boolean
  net?: boolean

  /** Whether the order is a guest order */
  guestCustomer?: boolean
}

// ---------------------------------------------------------------------------
// Hook parameter types
// ---------------------------------------------------------------------------

/** Parameters for setting a delivery address on the cart */
export interface SetDeliveryAddressParams {
  /** Address ID (for existing addresses) */
  addressId?: string
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
  /** Region / state (ISO code) */
  region?: {
    isocode: string
  }
  /** Country (ISO code) */
  country: {
    isocode: string
  }
  /** Postal / ZIP code */
  postalCode: string
  /** Phone number */
  phone?: string
}

/** Parameters for creating/setting payment details on the cart */
export interface SetPaymentDetailsParams {
  /** Account holder name */
  accountHolderName: string
  /** Card number */
  cardNumber: string
  /** Card type code (e.g., 'visa', 'master') */
  cardType: {
    code: string
  }
  /** Expiry month (e.g., '01', '12') */
  expiryMonth: string
  /** Expiry year (e.g., '2027') */
  expiryYear: string
  /** Whether this should be the default payment method */
  defaultPayment?: boolean
  /** Whether the card details should be saved */
  saved?: boolean
  /** Billing address (required by OCC) */
  billingAddress: SetDeliveryAddressParams
}

/** Parameters for placing an order */
export interface PlaceOrderParams {
  /** Whether the user has accepted terms and conditions (required) */
  termsChecked: boolean
  /** Security code (CCV) — if required by backend configuration */
  securityCode?: string
}

/** Parameters for setting guest checkout email */
export interface GuestCheckoutParams {
  /** Guest email address */
  email: string
}

// ---------------------------------------------------------------------------
// Hook option types
// ---------------------------------------------------------------------------

/** Options for `useDeliveryModes()` */
export interface UseDeliveryModesOptions {
  /** Whether the query is enabled (default: auto-enabled when cart has delivery address) */
  enabled?: boolean
}
