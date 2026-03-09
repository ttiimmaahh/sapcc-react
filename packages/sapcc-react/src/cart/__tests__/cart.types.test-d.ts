import { describe, it, expectTypeOf } from 'vitest'
import type {
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
} from '../cart.types'
import type { CartContextValue } from '../CartContext'
import {
  normalizeCart,
  normalizeCartEntry,
  type NormalizedCart,
  type NormalizedCartEntry,
} from '../cart.normalizers'
import {
  createCartStorage,
  LocalStorageCartStorage,
  InMemoryCartStorage,
} from '../cart-storage'
import { cartQueries } from '../cart.queries'
import type { Price } from '../../product/product.types'

// ─── Cart Type ──────────────────────────────────────────────────────────────

describe('Cart type', () => {
  it('code is required string', () => {
    expectTypeOf<Cart['code']>().toBeString()
  })

  it('guid is optional string', () => {
    expectTypeOf<Cart['guid']>().toEqualTypeOf<string | undefined>()
  })

  it('entries is optional CartEntry array', () => {
    expectTypeOf<Cart['entries']>().toEqualTypeOf<CartEntry[] | undefined>()
  })

  it('totalPrice is optional Price', () => {
    expectTypeOf<Cart['totalPrice']>().toEqualTypeOf<Price | undefined>()
  })

  it('appliedVouchers is optional Voucher array', () => {
    expectTypeOf<Cart['appliedVouchers']>().toEqualTypeOf<Voucher[] | undefined>()
  })

  it('deliveryAddress is optional Address', () => {
    expectTypeOf<Cart['deliveryAddress']>().toEqualTypeOf<Address | undefined>()
  })

  it('deliveryMode is optional DeliveryMode', () => {
    expectTypeOf<Cart['deliveryMode']>().toEqualTypeOf<DeliveryMode | undefined>()
  })

  it('paymentInfo is optional PaymentDetails', () => {
    expectTypeOf<Cart['paymentInfo']>().toEqualTypeOf<PaymentDetails | undefined>()
  })
})

// ─── CartEntry Type ─────────────────────────────────────────────────────────

describe('CartEntry type', () => {
  it('has required entryNumber, product, quantity', () => {
    expectTypeOf<CartEntry>().toHaveProperty('entryNumber')
    expectTypeOf<CartEntry>().toHaveProperty('product')
    expectTypeOf<CartEntry>().toHaveProperty('quantity')
  })

  it('entryNumber is number', () => {
    expectTypeOf<CartEntry['entryNumber']>().toBeNumber()
  })

  it('quantity is number', () => {
    expectTypeOf<CartEntry['quantity']>().toBeNumber()
  })
})

// ─── OrderEntry is alias for CartEntry ──────────────────────────────────────

describe('OrderEntry type', () => {
  it('is same as CartEntry', () => {
    expectTypeOf<OrderEntry>().toEqualTypeOf<CartEntry>()
  })
})

// ─── CartModification Type ──────────────────────────────────────────────────

describe('CartModification type', () => {
  it('has required fields', () => {
    expectTypeOf<CartModification>().toHaveProperty('statusCode')
    expectTypeOf<CartModification>().toHaveProperty('quantityAdded')
    expectTypeOf<CartModification>().toHaveProperty('quantity')
    expectTypeOf<CartModification>().toHaveProperty('entry')
  })

  it('entry is CartEntry', () => {
    expectTypeOf<CartModification['entry']>().toEqualTypeOf<CartEntry>()
  })

  it('statusCode is a union with string extensibility', () => {
    // statusCode should accept literal strings and any string
    expectTypeOf<'success'>().toExtend<CartModification['statusCode']>()
    expectTypeOf<'lowStock'>().toExtend<CartModification['statusCode']>()
    expectTypeOf<'noStock'>().toExtend<CartModification['statusCode']>()
  })
})

// ─── Voucher Type ───────────────────────────────────────────────────────────

describe('Voucher type', () => {
  it('code is required string', () => {
    expectTypeOf<Voucher['code']>().toBeString()
  })

  it('value is optional number', () => {
    expectTypeOf<Voucher['value']>().toEqualTypeOf<number | undefined>()
  })

  it('freeShipping is optional boolean', () => {
    expectTypeOf<Voucher['freeShipping']>().toEqualTypeOf<boolean | undefined>()
  })
})

// ─── Address Type ───────────────────────────────────────────────────────────

describe('Address type', () => {
  it('has optional address fields', () => {
    expectTypeOf<Address['firstName']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<Address['lastName']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<Address['line1']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<Address['postalCode']>().toEqualTypeOf<string | undefined>()
  })
})

// ─── DeliveryMode Type ──────────────────────────────────────────────────────

describe('DeliveryMode type', () => {
  it('code is required string', () => {
    expectTypeOf<DeliveryMode['code']>().toBeString()
  })

  it('deliveryCost is optional Price', () => {
    expectTypeOf<DeliveryMode['deliveryCost']>().toEqualTypeOf<Price | undefined>()
  })
})

// ─── PaymentDetails Type ────────────────────────────────────────────────────

describe('PaymentDetails type', () => {
  it('id is optional string', () => {
    expectTypeOf<PaymentDetails['id']>().toEqualTypeOf<string | undefined>()
  })

  it('billingAddress is optional Address', () => {
    expectTypeOf<PaymentDetails['billingAddress']>().toEqualTypeOf<Address | undefined>()
  })
})

// ─── SaveCartResult Type ────────────────────────────────────────────────────

describe('SaveCartResult type', () => {
  it('savedCartData is Cart', () => {
    expectTypeOf<SaveCartResult['savedCartData']>().toEqualTypeOf<Cart>()
  })
})

// ─── CartMergeStrategy Type ─────────────────────────────────────────────────

describe('CartMergeStrategy type', () => {
  it('is a union of string literals', () => {
    expectTypeOf<CartMergeStrategy>().toEqualTypeOf<'merge' | 'keepAnonymous' | 'keepUser'>()
  })
})

// ─── CartStorage Interface ──────────────────────────────────────────────────

describe('CartStorage interface', () => {
  it('getCartGuid returns string | null', () => {
    expectTypeOf<CartStorage['getCartGuid']>().returns.toEqualTypeOf<string | null>()
  })

  it('setCartGuid accepts string', () => {
    expectTypeOf<CartStorage['setCartGuid']>().parameters.toEqualTypeOf<[string]>()
  })

  it('removeCartGuid returns void', () => {
    expectTypeOf<CartStorage['removeCartGuid']>().returns.toBeVoid()
  })
})

// ─── CartState Type ─────────────────────────────────────────────────────────

describe('CartState type', () => {
  it('cart is Cart | null', () => {
    expectTypeOf<CartState['cart']>().toEqualTypeOf<Cart | null>()
  })

  it('isLoading is boolean', () => {
    expectTypeOf<CartState['isLoading']>().toBeBoolean()
  })

  it('isInitialized is boolean', () => {
    expectTypeOf<CartState['isInitialized']>().toBeBoolean()
  })
})

// ─── CartContextValue Type ──────────────────────────────────────────────────

describe('CartContextValue type', () => {
  it('has cart state and actions', () => {
    expectTypeOf<CartContextValue>().toHaveProperty('cart')
    expectTypeOf<CartContextValue>().toHaveProperty('isLoading')
    expectTypeOf<CartContextValue>().toHaveProperty('isInitialized')
    expectTypeOf<CartContextValue>().toHaveProperty('cartId')
    expectTypeOf<CartContextValue>().toHaveProperty('userId')
    expectTypeOf<CartContextValue>().toHaveProperty('isAnonymous')
    expectTypeOf<CartContextValue>().toHaveProperty('createCart')
    expectTypeOf<CartContextValue>().toHaveProperty('ensureCart')
    expectTypeOf<CartContextValue>().toHaveProperty('refreshCart')
    expectTypeOf<CartContextValue>().toHaveProperty('setActiveCart')
  })

  it('createCart returns Promise<Cart>', () => {
    expectTypeOf<CartContextValue['createCart']>().returns.resolves.toEqualTypeOf<Cart>()
  })

  it('ensureCart returns Promise<Cart>', () => {
    expectTypeOf<CartContextValue['ensureCart']>().returns.resolves.toEqualTypeOf<Cart>()
  })

  it('refreshCart returns Promise<void>', () => {
    expectTypeOf<CartContextValue['refreshCart']>().returns.resolves.toBeVoid()
  })

  it('setActiveCart accepts Cart', () => {
    expectTypeOf<CartContextValue['setActiveCart']>().parameters.toEqualTypeOf<[Cart]>()
  })
})

// ─── Hook Option Types ──────────────────────────────────────────────────────

describe('UseCartOptions type', () => {
  it('fields is optional string', () => {
    expectTypeOf<UseCartOptions['fields']>().toEqualTypeOf<string | undefined>()
  })

  it('enabled is optional boolean', () => {
    expectTypeOf<UseCartOptions['enabled']>().toEqualTypeOf<boolean | undefined>()
  })
})

describe('AddEntryParams type', () => {
  it('productCode is required string', () => {
    expectTypeOf<AddEntryParams['productCode']>().toBeString()
  })

  it('quantity is optional number', () => {
    expectTypeOf<AddEntryParams['quantity']>().toEqualTypeOf<number | undefined>()
  })
})

describe('UpdateEntryParams type', () => {
  it('entryNumber is required number', () => {
    expectTypeOf<UpdateEntryParams['entryNumber']>().toBeNumber()
  })

  it('quantity is required number', () => {
    expectTypeOf<UpdateEntryParams['quantity']>().toBeNumber()
  })
})

describe('UseSavedCartsOptions type', () => {
  it('fields is optional string', () => {
    expectTypeOf<UseSavedCartsOptions['fields']>().toEqualTypeOf<string | undefined>()
  })

  it('enabled is optional boolean', () => {
    expectTypeOf<UseSavedCartsOptions['enabled']>().toEqualTypeOf<boolean | undefined>()
  })
})

describe('SaveCartParams type', () => {
  it('saveCartName is required string', () => {
    expectTypeOf<SaveCartParams['saveCartName']>().toBeString()
  })

  it('saveCartDescription is optional string', () => {
    expectTypeOf<SaveCartParams['saveCartDescription']>().toEqualTypeOf<string | undefined>()
  })
})

// ─── Normalizer Types ───────────────────────────────────────────────────────

describe('NormalizedCart type', () => {
  it('has computed convenience fields', () => {
    expectTypeOf<NormalizedCart>().toHaveProperty('isEmpty')
    expectTypeOf<NormalizedCart>().toHaveProperty('totalFormatted')
    expectTypeOf<NormalizedCart>().toHaveProperty('totalValue')
    expectTypeOf<NormalizedCart>().toHaveProperty('currencyIso')
    expectTypeOf<NormalizedCart>().toHaveProperty('hasVouchers')
    expectTypeOf<NormalizedCart>().toHaveProperty('hasPromotions')
    expectTypeOf<NormalizedCart>().toHaveProperty('voucherCount')
    expectTypeOf<NormalizedCart>().toHaveProperty('raw')
  })

  it('raw is Cart', () => {
    expectTypeOf<NormalizedCart['raw']>().toEqualTypeOf<Cart>()
  })

  it('entries is NormalizedCartEntry array', () => {
    expectTypeOf<NormalizedCart['entries']>().toEqualTypeOf<NormalizedCartEntry[]>()
  })
})

describe('NormalizedCartEntry type', () => {
  it('has computed fields', () => {
    expectTypeOf<NormalizedCartEntry>().toHaveProperty('productCode')
    expectTypeOf<NormalizedCartEntry>().toHaveProperty('productName')
    expectTypeOf<NormalizedCartEntry>().toHaveProperty('imageUrl')
    expectTypeOf<NormalizedCartEntry>().toHaveProperty('basePriceFormatted')
    expectTypeOf<NormalizedCartEntry>().toHaveProperty('totalPriceFormatted')
    expectTypeOf<NormalizedCartEntry>().toHaveProperty('updateable')
    expectTypeOf<NormalizedCartEntry>().toHaveProperty('raw')
  })

  it('raw is CartEntry', () => {
    expectTypeOf<NormalizedCartEntry['raw']>().toEqualTypeOf<CartEntry>()
  })
})

// ─── Normalizer Function Signatures ─────────────────────────────────────────

describe('normalizeCart function', () => {
  it('accepts Cart and returns NormalizedCart', () => {
    expectTypeOf(normalizeCart).parameters.toEqualTypeOf<[Cart]>()
    expectTypeOf(normalizeCart).returns.toEqualTypeOf<NormalizedCart>()
  })
})

describe('normalizeCartEntry function', () => {
  it('accepts CartEntry and returns NormalizedCartEntry', () => {
    expectTypeOf(normalizeCartEntry).parameters.toEqualTypeOf<[CartEntry]>()
    expectTypeOf(normalizeCartEntry).returns.toEqualTypeOf<NormalizedCartEntry>()
  })
})

// ─── Storage Classes ────────────────────────────────────────────────────────

describe('Storage implementations', () => {
  it('LocalStorageCartStorage implements CartStorage', () => {
    expectTypeOf<LocalStorageCartStorage>().toExtend<CartStorage>()
  })

  it('InMemoryCartStorage implements CartStorage', () => {
    expectTypeOf<InMemoryCartStorage>().toExtend<CartStorage>()
  })
})

describe('createCartStorage function', () => {
  it('returns CartStorage', () => {
    expectTypeOf(createCartStorage).returns.toEqualTypeOf<CartStorage>()
  })
})

// ─── PromotionOrderEntryConsumed Type ───────────────────────────────────────

describe('PromotionOrderEntryConsumed type', () => {
  it('has required fields', () => {
    expectTypeOf<PromotionOrderEntryConsumed>().toHaveProperty('adjustedUnitPrice')
    expectTypeOf<PromotionOrderEntryConsumed>().toHaveProperty('code')
    expectTypeOf<PromotionOrderEntryConsumed>().toHaveProperty('orderEntryNumber')
    expectTypeOf<PromotionOrderEntryConsumed>().toHaveProperty('quantity')
  })
})

// ─── CartPromotionResult Type ───────────────────────────────────────────────

describe('CartPromotionResult type', () => {
  it('promotion is required', () => {
    expectTypeOf<CartPromotionResult>().toHaveProperty('promotion')
  })

  it('description is optional string', () => {
    expectTypeOf<CartPromotionResult['description']>().toEqualTypeOf<string | undefined>()
  })
})

// ─── cartQueries factory ────────────────────────────────────────────────────

describe('cartQueries', () => {
  it('has active and savedCarts methods', () => {
    expectTypeOf(cartQueries).toHaveProperty('active')
    expectTypeOf(cartQueries).toHaveProperty('savedCarts')
  })
})
