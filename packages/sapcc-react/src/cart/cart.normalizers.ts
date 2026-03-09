import type { Cart, CartEntry } from './cart.types'

// ---------------------------------------------------------------------------
// Normalized types
// ---------------------------------------------------------------------------

/** Normalized cart with computed convenience fields */
export interface NormalizedCart {
  /** Cart code */
  code: string
  /** Cart GUID (for anonymous carts) */
  guid?: string
  /** Cart entries */
  entries: NormalizedCartEntry[]
  /** Total number of distinct items */
  totalItems: number
  /** Total number of units (sum of quantities) */
  totalUnitCount: number
  /** Whether the cart is empty */
  isEmpty: boolean
  /** Formatted total price string (e.g., '$99.99') */
  totalFormatted: string
  /** Raw total price value */
  totalValue: number
  /** Currency ISO code */
  currencyIso: string
  /** Whether the cart has any applied vouchers */
  hasVouchers: boolean
  /** Whether the cart has any applied promotions */
  hasPromotions: boolean
  /** Number of applied vouchers */
  voucherCount: number
  /** The raw cart data (for accessing fields not in the normalized version) */
  raw: Cart
}

/** Normalized cart entry with computed fields */
export interface NormalizedCartEntry {
  /** Entry number (position in cart) */
  entryNumber: number
  /** Product code */
  productCode: string
  /** Product name */
  productName: string
  /** Product primary image URL */
  imageUrl?: string
  /** Quantity */
  quantity: number
  /** Formatted base price per unit */
  basePriceFormatted: string
  /** Formatted total price for this entry */
  totalPriceFormatted: string
  /** Raw base price value */
  basePriceValue: number
  /** Raw total price value */
  totalPriceValue: number
  /** Whether the entry can be updated */
  updateable: boolean
  /** The raw entry data */
  raw: CartEntry
}

// ---------------------------------------------------------------------------
// Normalizer functions
// ---------------------------------------------------------------------------

/**
 * Normalizes a raw OCC CartEntry into a cleaner model with computed fields.
 */
export function normalizeCartEntry(entry: CartEntry): NormalizedCartEntry {
  const primaryImage = entry.product.images?.find(
    (img) => img.imageType === 'PRIMARY' && img.format === 'thumbnail',
  ) ?? entry.product.images?.[0]

  return {
    entryNumber: entry.entryNumber,
    productCode: entry.product.code,
    productName: entry.product.name,
    imageUrl: primaryImage?.url,
    quantity: entry.quantity,
    basePriceFormatted: entry.basePrice?.formattedValue ?? '',
    totalPriceFormatted: entry.totalPrice?.formattedValue ?? '',
    basePriceValue: entry.basePrice?.value ?? 0,
    totalPriceValue: entry.totalPrice?.value ?? 0,
    updateable: entry.updateable ?? true,
    raw: entry,
  }
}

/**
 * Normalizes a raw OCC Cart into a cleaner model with computed convenience fields.
 */
export function normalizeCart(cart: Cart): NormalizedCart {
  const entries = (cart.entries ?? []).map(normalizeCartEntry)

  return {
    code: cart.code,
    guid: cart.guid,
    entries,
    totalItems: cart.totalItems ?? entries.length,
    totalUnitCount: cart.totalUnitCount ?? entries.reduce((sum, e) => sum + e.quantity, 0),
    isEmpty: entries.length === 0,
    totalFormatted: cart.totalPrice?.formattedValue ?? '$0.00',
    totalValue: cart.totalPrice?.value ?? 0,
    currencyIso: cart.totalPrice?.currencyIso ?? 'USD',
    hasVouchers: (cart.appliedVouchers?.length ?? 0) > 0,
    hasPromotions:
      (cart.appliedOrderPromotions?.length ?? 0) +
        (cart.appliedProductPromotions?.length ?? 0) >
      0,
    voucherCount: cart.appliedVouchers?.length ?? 0,
    raw: cart,
  }
}
