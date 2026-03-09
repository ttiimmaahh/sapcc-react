import type { Order } from './checkout.types'

// ---------------------------------------------------------------------------
// Normalized types
// ---------------------------------------------------------------------------

/** Normalized order with computed convenience fields */
export interface NormalizedOrder {
  /** Order code */
  code: string
  /** Human-readable status display (e.g., 'Created', 'Shipped') */
  statusDisplay: string
  /** Raw status code */
  status: string
  /** Date the order was placed (ISO string) */
  placedDate: string
  /** Total number of distinct items */
  totalItems: number
  /** Total number of units (sum of quantities) */
  totalUnitCount: number
  /** Formatted total price string (e.g., '$99.99') */
  totalFormatted: string
  /** Raw total price value */
  totalValue: number
  /** Currency ISO code */
  currencyIso: string
  /** Whether the order has delivery tracking */
  hasTracking: boolean
  /** Whether the order is a guest order */
  isGuestOrder: boolean
  /** Delivery address formatted as a single string */
  deliveryAddressFormatted: string
  /** The raw order data (for accessing fields not in the normalized version) */
  raw: Order
}

// ---------------------------------------------------------------------------
// Normalizer functions
// ---------------------------------------------------------------------------

/**
 * Formats an address into a single-line display string.
 */
function formatAddress(address?: {
  line1?: string
  line2?: string
  town?: string
  region?: { name?: string }
  postalCode?: string
  country?: { name?: string }
}): string {
  if (!address) return ''

  const parts = [
    address.line1,
    address.line2,
    address.town,
    address.region?.name,
    address.postalCode,
    address.country?.name,
  ].filter(Boolean)

  return parts.join(', ')
}

/**
 * Normalizes a raw OCC Order into a cleaner model with computed fields.
 */
export function normalizeOrder(order: Order): NormalizedOrder {
  const entries = order.entries ?? []

  const hasTracking = (order.consignments ?? []).some(
    (c) => Boolean(c.trackingID),
  )

  return {
    code: order.code,
    statusDisplay: order.statusDisplay ?? order.status ?? 'Unknown',
    status: order.status ?? 'UNKNOWN',
    placedDate: order.placed ?? order.created ?? '',
    totalItems: order.totalItems ?? entries.length,
    totalUnitCount:
      order.totalUnitCount ??
      entries.reduce((sum, e) => sum + e.quantity, 0),
    totalFormatted: order.totalPrice?.formattedValue ?? '$0.00',
    totalValue: order.totalPrice?.value ?? 0,
    currencyIso: order.totalPrice?.currencyIso ?? 'USD',
    hasTracking,
    isGuestOrder: order.guestCustomer ?? false,
    deliveryAddressFormatted: formatAddress(order.deliveryAddress),
    raw: order,
  }
}
