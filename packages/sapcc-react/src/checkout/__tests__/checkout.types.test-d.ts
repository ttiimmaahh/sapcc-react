import { describe, it, expectTypeOf } from 'vitest'
import type {
  Order,
  Consignment,
  ConsignmentEntry,
  DeliveryModeList,
  SetDeliveryAddressParams,
  SetPaymentDetailsParams,
  PlaceOrderParams,
  GuestCheckoutParams,
  UseDeliveryModesOptions,
  Address,
  DeliveryMode,
  PaymentDetails,
} from '../checkout.types'
import {
  normalizeOrder,
  type NormalizedOrder,
} from '../checkout.normalizers'
import { checkoutQueries } from '../checkout.queries'
import type { CartEntry } from '../../cart/cart.types'
import type { Price } from '../../product/product.types'

// ─── Order Type ─────────────────────────────────────────────────────────────

describe('Order type', () => {
  it('code is required string', () => {
    expectTypeOf<Order['code']>().toBeString()
  })

  it('guid is optional string', () => {
    expectTypeOf<Order['guid']>().toEqualTypeOf<string | undefined>()
  })

  it('status is optional string', () => {
    expectTypeOf<Order['status']>().toEqualTypeOf<string | undefined>()
  })

  it('statusDisplay is optional string', () => {
    expectTypeOf<Order['statusDisplay']>().toEqualTypeOf<string | undefined>()
  })

  it('entries is optional CartEntry array', () => {
    expectTypeOf<Order['entries']>().toEqualTypeOf<CartEntry[] | undefined>()
  })

  it('totalPrice is optional Price', () => {
    expectTypeOf<Order['totalPrice']>().toEqualTypeOf<Price | undefined>()
  })

  it('deliveryAddress is optional Address', () => {
    expectTypeOf<Order['deliveryAddress']>().toEqualTypeOf<Address | undefined>()
  })

  it('deliveryMode is optional DeliveryMode', () => {
    expectTypeOf<Order['deliveryMode']>().toEqualTypeOf<DeliveryMode | undefined>()
  })

  it('paymentInfo is optional PaymentDetails', () => {
    expectTypeOf<Order['paymentInfo']>().toEqualTypeOf<PaymentDetails | undefined>()
  })

  it('consignments is optional Consignment array', () => {
    expectTypeOf<Order['consignments']>().toEqualTypeOf<Consignment[] | undefined>()
  })

  it('guestCustomer is optional boolean', () => {
    expectTypeOf<Order['guestCustomer']>().toEqualTypeOf<boolean | undefined>()
  })

  it('calculated is optional boolean', () => {
    expectTypeOf<Order['calculated']>().toEqualTypeOf<boolean | undefined>()
  })
})

// ─── Consignment Type ───────────────────────────────────────────────────────

describe('Consignment type', () => {
  it('code is required string', () => {
    expectTypeOf<Consignment['code']>().toBeString()
  })

  it('status is required string', () => {
    expectTypeOf<Consignment['status']>().toBeString()
  })

  it('trackingID is optional string', () => {
    expectTypeOf<Consignment['trackingID']>().toEqualTypeOf<string | undefined>()
  })

  it('entries is optional ConsignmentEntry array', () => {
    expectTypeOf<Consignment['entries']>().toEqualTypeOf<ConsignmentEntry[] | undefined>()
  })
})

// ─── ConsignmentEntry Type ──────────────────────────────────────────────────

describe('ConsignmentEntry type', () => {
  it('orderEntry is CartEntry', () => {
    expectTypeOf<ConsignmentEntry['orderEntry']>().toEqualTypeOf<CartEntry>()
  })

  it('quantity is number', () => {
    expectTypeOf<ConsignmentEntry['quantity']>().toBeNumber()
  })

  it('shippedQuantity is optional number', () => {
    expectTypeOf<ConsignmentEntry['shippedQuantity']>().toEqualTypeOf<number | undefined>()
  })
})

// ─── DeliveryModeList Type ──────────────────────────────────────────────────

describe('DeliveryModeList type', () => {
  it('deliveryModes is optional DeliveryMode array', () => {
    expectTypeOf<DeliveryModeList['deliveryModes']>().toEqualTypeOf<DeliveryMode[] | undefined>()
  })
})

// ─── SetDeliveryAddressParams Type ──────────────────────────────────────────

describe('SetDeliveryAddressParams type', () => {
  it('firstName is required string', () => {
    expectTypeOf<SetDeliveryAddressParams['firstName']>().toBeString()
  })

  it('lastName is required string', () => {
    expectTypeOf<SetDeliveryAddressParams['lastName']>().toBeString()
  })

  it('line1 is required string', () => {
    expectTypeOf<SetDeliveryAddressParams['line1']>().toBeString()
  })

  it('town is required string', () => {
    expectTypeOf<SetDeliveryAddressParams['town']>().toBeString()
  })

  it('postalCode is required string', () => {
    expectTypeOf<SetDeliveryAddressParams['postalCode']>().toBeString()
  })

  it('country is required with isocode', () => {
    expectTypeOf<SetDeliveryAddressParams['country']>().toEqualTypeOf<{ isocode: string }>()
  })

  it('region is optional with isocode', () => {
    expectTypeOf<SetDeliveryAddressParams['region']>().toEqualTypeOf<{ isocode: string } | undefined>()
  })

  it('addressId is optional string', () => {
    expectTypeOf<SetDeliveryAddressParams['addressId']>().toEqualTypeOf<string | undefined>()
  })
})

// ─── SetPaymentDetailsParams Type ───────────────────────────────────────────

describe('SetPaymentDetailsParams type', () => {
  it('accountHolderName is required string', () => {
    expectTypeOf<SetPaymentDetailsParams['accountHolderName']>().toBeString()
  })

  it('cardNumber is required string', () => {
    expectTypeOf<SetPaymentDetailsParams['cardNumber']>().toBeString()
  })

  it('cardType has code', () => {
    expectTypeOf<SetPaymentDetailsParams['cardType']>().toEqualTypeOf<{ code: string }>()
  })

  it('expiryMonth is required string', () => {
    expectTypeOf<SetPaymentDetailsParams['expiryMonth']>().toBeString()
  })

  it('expiryYear is required string', () => {
    expectTypeOf<SetPaymentDetailsParams['expiryYear']>().toBeString()
  })

  it('billingAddress is required SetDeliveryAddressParams', () => {
    expectTypeOf<SetPaymentDetailsParams['billingAddress']>().toEqualTypeOf<SetDeliveryAddressParams>()
  })

  it('defaultPayment is optional boolean', () => {
    expectTypeOf<SetPaymentDetailsParams['defaultPayment']>().toEqualTypeOf<boolean | undefined>()
  })
})

// ─── PlaceOrderParams Type ──────────────────────────────────────────────────

describe('PlaceOrderParams type', () => {
  it('termsChecked is required boolean', () => {
    expectTypeOf<PlaceOrderParams['termsChecked']>().toBeBoolean()
  })

  it('securityCode is optional string', () => {
    expectTypeOf<PlaceOrderParams['securityCode']>().toEqualTypeOf<string | undefined>()
  })
})

// ─── GuestCheckoutParams Type ───────────────────────────────────────────────

describe('GuestCheckoutParams type', () => {
  it('email is required string', () => {
    expectTypeOf<GuestCheckoutParams['email']>().toBeString()
  })
})

// ─── UseDeliveryModesOptions Type ───────────────────────────────────────────

describe('UseDeliveryModesOptions type', () => {
  it('enabled is optional boolean', () => {
    expectTypeOf<UseDeliveryModesOptions['enabled']>().toEqualTypeOf<boolean | undefined>()
  })
})

// ─── Re-exported Types ──────────────────────────────────────────────────────

describe('Re-exported types from cart', () => {
  it('Address is re-exported', () => {
    expectTypeOf<Address>().toHaveProperty('firstName')
    expectTypeOf<Address>().toHaveProperty('lastName')
  })

  it('DeliveryMode is re-exported', () => {
    expectTypeOf<DeliveryMode>().toHaveProperty('code')
    expectTypeOf<DeliveryMode>().toHaveProperty('deliveryCost')
  })

  it('PaymentDetails is re-exported', () => {
    expectTypeOf<PaymentDetails>().toHaveProperty('id')
    expectTypeOf<PaymentDetails>().toHaveProperty('cardNumber')
  })
})

// ─── NormalizedOrder Type ───────────────────────────────────────────────────

describe('NormalizedOrder type', () => {
  it('has all computed fields', () => {
    expectTypeOf<NormalizedOrder>().toHaveProperty('code')
    expectTypeOf<NormalizedOrder>().toHaveProperty('statusDisplay')
    expectTypeOf<NormalizedOrder>().toHaveProperty('status')
    expectTypeOf<NormalizedOrder>().toHaveProperty('placedDate')
    expectTypeOf<NormalizedOrder>().toHaveProperty('totalItems')
    expectTypeOf<NormalizedOrder>().toHaveProperty('totalUnitCount')
    expectTypeOf<NormalizedOrder>().toHaveProperty('totalFormatted')
    expectTypeOf<NormalizedOrder>().toHaveProperty('totalValue')
    expectTypeOf<NormalizedOrder>().toHaveProperty('currencyIso')
    expectTypeOf<NormalizedOrder>().toHaveProperty('hasTracking')
    expectTypeOf<NormalizedOrder>().toHaveProperty('isGuestOrder')
    expectTypeOf<NormalizedOrder>().toHaveProperty('deliveryAddressFormatted')
    expectTypeOf<NormalizedOrder>().toHaveProperty('raw')
  })

  it('raw is Order', () => {
    expectTypeOf<NormalizedOrder['raw']>().toEqualTypeOf<Order>()
  })

  it('code is string', () => {
    expectTypeOf<NormalizedOrder['code']>().toBeString()
  })

  it('hasTracking is boolean', () => {
    expectTypeOf<NormalizedOrder['hasTracking']>().toBeBoolean()
  })

  it('totalValue is number', () => {
    expectTypeOf<NormalizedOrder['totalValue']>().toBeNumber()
  })
})

// ─── normalizeOrder Function Signature ──────────────────────────────────────

describe('normalizeOrder function', () => {
  it('accepts Order and returns NormalizedOrder', () => {
    expectTypeOf(normalizeOrder).parameters.toEqualTypeOf<[Order]>()
    expectTypeOf(normalizeOrder).returns.toEqualTypeOf<NormalizedOrder>()
  })
})

// ─── checkoutQueries Factory ────────────────────────────────────────────────

describe('checkoutQueries', () => {
  it('has deliveryModes method', () => {
    expectTypeOf(checkoutQueries).toHaveProperty('deliveryModes')
  })
})
