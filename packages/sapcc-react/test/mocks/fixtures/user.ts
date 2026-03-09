import { faker } from '@faker-js/faker'
import { createPagination, createImage } from './common'
import { createAddress, createPaymentDetails } from './cart'
import type {
  ConsentTemplate,
  Consent,
  NotificationPreference,
  ProductInterestRelation,
  ProductInterestEntry,
  ProductInterestSearchResult,
  CustomerCoupon,
  CustomerCouponSearchResult,
  AddressVerificationResult,
} from '../../../src/user/user.types'
import type { Product } from '../../../src/product/product.types'

// Re-export from cart fixtures for convenience — consumers don't need to import from cart
export { createAddress, createPaymentDetails }

// ---------------------------------------------------------------------------
// Consent
// ---------------------------------------------------------------------------

export function createConsent(overrides: Partial<Consent> = {}): Consent {
  return {
    code: faker.string.alphanumeric(16),
    consentGivenDate: faker.date.recent().toISOString(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Consent Template
// ---------------------------------------------------------------------------

export function createConsentTemplate(
  overrides: Partial<ConsentTemplate> = {},
): ConsentTemplate {
  return {
    id: `MARKETING_${faker.string.alphanumeric(6).toUpperCase()}`,
    name: `${faker.commerce.department()} Newsletter`,
    description: `Receive updates about ${faker.commerce.department().toLowerCase()} products and promotions.`,
    version: 0,
    ...overrides,
  }
}

/**
 * Creates a consent template with an active (given, not withdrawn) consent.
 */
export function createConsentTemplateWithConsent(
  overrides: Partial<ConsentTemplate> = {},
): ConsentTemplate {
  return createConsentTemplate({
    currentConsent: createConsent(),
    ...overrides,
  })
}

/**
 * Creates a consent template with a withdrawn consent.
 */
export function createConsentTemplateWithdrawn(
  overrides: Partial<ConsentTemplate> = {},
): ConsentTemplate {
  return createConsentTemplate({
    currentConsent: createConsent({
      consentWithdrawnDate: faker.date.recent().toISOString(),
    }),
    ...overrides,
  })
}

// ---------------------------------------------------------------------------
// Notification Preference
// ---------------------------------------------------------------------------

export function createNotificationPreference(
  overrides: Partial<NotificationPreference> = {},
): NotificationPreference {
  return {
    channel: 'EMAIL',
    value: faker.internet.email(),
    enabled: false,
    ...overrides,
  }
}

/**
 * Creates a standard set of notification preferences (EMAIL, SMS, SITE_MESSAGE).
 */
export function createNotificationPreferenceSet(): NotificationPreference[] {
  return [
    createNotificationPreference({
      channel: 'EMAIL',
      value: 'test@example.com',
      enabled: true,
    }),
    createNotificationPreference({
      channel: 'SMS',
      value: '+15551234567',
      enabled: false,
    }),
    createNotificationPreference({
      channel: 'SITE_MESSAGE',
      value: '',
      enabled: false,
    }),
  ]
}

// ---------------------------------------------------------------------------
// Product Interest
// ---------------------------------------------------------------------------

function createInterestProduct(overrides: Partial<Product> = {}): Product {
  return {
    code: faker.string.alphanumeric(8),
    name: faker.commerce.productName(),
    images: [
      createImage({ imageType: 'PRIMARY', format: 'thumbnail' }),
    ],
    ...overrides,
  }
}

export function createProductInterestEntry(
  overrides: Partial<ProductInterestEntry> = {},
): ProductInterestEntry {
  return {
    interestType: 'BACK_IN_STOCK',
    dateAdded: faker.date.recent().toISOString(),
    expirationDate: faker.date.future().toISOString(),
    ...overrides,
  }
}

export function createProductInterestRelation(
  overrides: Partial<ProductInterestRelation> = {},
): ProductInterestRelation {
  return {
    product: createInterestProduct(),
    productInterestEntry: [createProductInterestEntry()],
    ...overrides,
  }
}

export function createProductInterestSearchResult(
  overrides: Partial<ProductInterestSearchResult> = {},
): ProductInterestSearchResult {
  const results = overrides.results ?? [
    createProductInterestRelation(),
    createProductInterestRelation({
      productInterestEntry: [
        createProductInterestEntry({ interestType: 'PRICE_REDUCTION' }),
      ],
    }),
  ]

  return {
    results,
    sorts: [
      { code: 'name', asc: true, selected: false },
      { code: 'dateAdded', asc: false, selected: true },
    ],
    pagination: createPagination({ totalResults: results.length }),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Customer Coupon
// ---------------------------------------------------------------------------

export function createCustomerCoupon(
  overrides: Partial<CustomerCoupon> = {},
): CustomerCoupon {
  return {
    couponId: faker.string.alphanumeric(10).toUpperCase(),
    name: `${faker.number.int({ min: 5, max: 50 })}% Off ${faker.commerce.department()}`,
    description: `Save on ${faker.commerce.department().toLowerCase()} items.`,
    startDate: faker.date.recent().toISOString(),
    endDate: faker.date.future().toISOString(),
    status: 'EFFECTIVE',
    allProductsApplicable: false,
    notificationOn: false,
    ...overrides,
  }
}

export function createCustomerCouponSearchResult(
  overrides: Partial<CustomerCouponSearchResult> = {},
): CustomerCouponSearchResult {
  const coupons = overrides.coupons ?? [
    createCustomerCoupon(),
    createCustomerCoupon({ status: 'PRESESSION', notificationOn: true }),
  ]

  return {
    coupons,
    sorts: [
      { code: 'startDate', asc: false, selected: true },
      { code: 'endDate', asc: true, selected: false },
    ],
    pagination: createPagination({ totalResults: coupons.length }),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Address Verification
// ---------------------------------------------------------------------------

export function createAddressVerificationResult(
  overrides: Partial<AddressVerificationResult> = {},
): AddressVerificationResult {
  return {
    decision: 'ACCEPT',
    ...overrides,
  }
}
