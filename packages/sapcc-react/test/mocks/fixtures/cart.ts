import { faker } from '@faker-js/faker'
import { createPrice, createImage } from './common'
import type {
  Cart,
  CartEntry,
  CartModification,
  Voucher,
  CartPromotionResult,
  Address,
  DeliveryMode,
  PaymentDetails,
  SaveCartResult,
} from '../../../src/cart/cart.types'
import type { Product } from '../../../src/product/product.types'

// ---------------------------------------------------------------------------
// Product (minimal, for cart entries)
// ---------------------------------------------------------------------------

function createCartProduct(overrides: Partial<Product> = {}): Product {
  return {
    code: faker.string.alphanumeric(8),
    name: faker.commerce.productName(),
    images: [
      createImage({ imageType: 'PRIMARY', format: 'thumbnail' }),
      createImage({ imageType: 'PRIMARY', format: 'product' }),
    ],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Cart Entry
// ---------------------------------------------------------------------------

export function createCartEntry(overrides: Partial<CartEntry> = {}): CartEntry {
  const quantity = overrides.quantity ?? faker.number.int({ min: 1, max: 5 })
  const basePrice = createPrice()
  const totalPrice = createPrice({
    value: basePrice.value * quantity,
    formattedValue: `$${(basePrice.value * quantity).toFixed(2)}`,
  })

  return {
    entryNumber: faker.number.int({ min: 0, max: 20 }),
    product: createCartProduct(),
    quantity,
    basePrice,
    totalPrice,
    updateable: true,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Voucher
// ---------------------------------------------------------------------------

export function createVoucher(overrides: Partial<Voucher> = {}): Voucher {
  return {
    code: faker.string.alphanumeric(8).toUpperCase(),
    name: `${faker.number.int({ min: 5, max: 30 })}% off`,
    freeShipping: false,
    value: faker.number.float({ min: 5, max: 50, fractionDigits: 2 }),
    valueFormatted: '',
    voucherCode: faker.string.alphanumeric(8).toUpperCase(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Promotion
// ---------------------------------------------------------------------------

export function createCartPromotion(
  overrides: Partial<CartPromotionResult> = {},
): CartPromotionResult {
  return {
    description: faker.commerce.productAdjective() + ' promotion',
    promotion: {
      code: faker.string.alphanumeric(8),
      title: faker.commerce.productAdjective() + ' deal',
      description: faker.lorem.sentence(),
      promotionType: 'Rule Based Promotion',
    },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Address
// ---------------------------------------------------------------------------

export function createAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    line1: faker.location.streetAddress(),
    town: faker.location.city(),
    region: {
      isocode: 'US-CA',
      name: 'California',
    },
    country: {
      isocode: 'US',
      name: 'United States',
    },
    postalCode: faker.location.zipCode(),
    phone: faker.phone.number(),
    defaultAddress: false,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Delivery Mode
// ---------------------------------------------------------------------------

export function createDeliveryMode(overrides: Partial<DeliveryMode> = {}): DeliveryMode {
  return {
    code: 'standard-gross',
    name: 'Standard Delivery',
    description: 'Standard delivery in 3-5 business days',
    deliveryCost: createPrice({ value: 9.99, formattedValue: '$9.99' }),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Payment Details
// ---------------------------------------------------------------------------

export function createPaymentDetails(overrides: Partial<PaymentDetails> = {}): PaymentDetails {
  return {
    id: faker.string.uuid(),
    accountHolderName: faker.person.fullName(),
    cardNumber: `************${faker.string.numeric(4)}`,
    cardType: {
      code: 'visa',
      name: 'Visa',
    },
    expiryMonth: String(faker.number.int({ min: 1, max: 12 })).padStart(2, '0'),
    expiryYear: String(faker.number.int({ min: 2025, max: 2030 })),
    defaultPayment: true,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export function createCart(overrides: Partial<Cart> = {}): Cart {
  const entries = overrides.entries ?? [
    createCartEntry({ entryNumber: 0 }),
    createCartEntry({ entryNumber: 1 }),
  ]

  const totalValue = entries.reduce((sum, e) => sum + (e.totalPrice?.value ?? 0), 0)

  return {
    code: faker.string.alphanumeric(8),
    guid: faker.string.uuid(),
    entries,
    totalItems: entries.length,
    totalUnitCount: entries.reduce((sum, e) => sum + e.quantity, 0),
    totalPrice: createPrice({
      value: totalValue,
      formattedValue: `$${totalValue.toFixed(2)}`,
    }),
    totalPriceWithTax: createPrice({
      value: totalValue * 1.1,
      formattedValue: `$${(totalValue * 1.1).toFixed(2)}`,
    }),
    subTotal: createPrice({
      value: totalValue,
      formattedValue: `$${totalValue.toFixed(2)}`,
    }),
    totalTax: createPrice({
      value: totalValue * 0.1,
      formattedValue: `$${(totalValue * 0.1).toFixed(2)}`,
    }),
    calculated: true,
    net: false,
    ...overrides,
  }
}

export function createEmptyCart(overrides: Partial<Cart> = {}): Cart {
  return createCart({
    entries: [],
    totalItems: 0,
    totalUnitCount: 0,
    totalPrice: createPrice({ value: 0, formattedValue: '$0.00' }),
    totalPriceWithTax: createPrice({ value: 0, formattedValue: '$0.00' }),
    subTotal: createPrice({ value: 0, formattedValue: '$0.00' }),
    totalTax: createPrice({ value: 0, formattedValue: '$0.00' }),
    ...overrides,
  })
}

// ---------------------------------------------------------------------------
// Cart Modification
// ---------------------------------------------------------------------------

export function createCartModification(
  overrides: Partial<CartModification> = {},
): CartModification {
  return {
    statusCode: 'success',
    statusMessage: 'Entry added successfully',
    quantityAdded: 1,
    quantity: 1,
    entry: createCartEntry({ entryNumber: 0 }),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// SaveCartResult
// ---------------------------------------------------------------------------

export function createSaveCartResult(
  overrides: Partial<Cart> = {},
): SaveCartResult {
  return {
    savedCartData: createCart({
      name: 'Saved Cart',
      description: 'My saved cart',
      savedTime: new Date().toISOString(),
      ...overrides,
    }),
  }
}
