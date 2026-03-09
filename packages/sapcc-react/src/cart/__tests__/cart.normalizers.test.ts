import { describe, it, expect } from 'vitest'
import { normalizeCart, normalizeCartEntry } from '../cart.normalizers'
import type { Cart, CartEntry } from '../cart.types'
import { createCart, createEmptyCart, createCartEntry, createVoucher, createCartPromotion } from '../../../test/mocks/fixtures/cart'

// ---------------------------------------------------------------------------
// normalizeCartEntry
// ---------------------------------------------------------------------------

describe('normalizeCartEntry', () => {
  it('maps all fields from a full entry', () => {
    const entry = createCartEntry({
      entryNumber: 3,
      quantity: 2,
    })

    const result = normalizeCartEntry(entry)

    expect(result.entryNumber).toBe(3)
    expect(result.quantity).toBe(2)
    expect(result.productCode).toBe(entry.product.code)
    expect(result.productName).toBe(entry.product.name)
    expect(result.basePriceValue).toBe(entry.basePrice?.value)
    expect(result.totalPriceValue).toBe(entry.totalPrice?.value)
    expect(result.basePriceFormatted).toBe(entry.basePrice?.formattedValue)
    expect(result.totalPriceFormatted).toBe(entry.totalPrice?.formattedValue)
    expect(result.updateable).toBe(true)
    expect(result.raw).toBe(entry)
  })

  it('extracts thumbnail PRIMARY image URL', () => {
    const entry = createCartEntry({
      product: {
        code: 'IMG-TEST',
        name: 'Image Test',
        images: [
          { url: '/gallery.jpg', imageType: 'GALLERY', format: 'product' },
          { url: '/primary-thumb.jpg', imageType: 'PRIMARY', format: 'thumbnail' },
          { url: '/primary-product.jpg', imageType: 'PRIMARY', format: 'product' },
        ],
      },
    })

    const result = normalizeCartEntry(entry)
    expect(result.imageUrl).toBe('/primary-thumb.jpg')
  })

  it('falls back to first image when no PRIMARY thumbnail', () => {
    const entry = createCartEntry({
      product: {
        code: 'FALLBACK',
        name: 'Fallback',
        images: [
          { url: '/only.jpg', imageType: 'GALLERY', format: 'product' },
        ],
      },
    })

    const result = normalizeCartEntry(entry)
    expect(result.imageUrl).toBe('/only.jpg')
  })

  it('sets imageUrl to undefined when product has no images', () => {
    const entry = createCartEntry({
      product: {
        code: 'NO-IMG',
        name: 'No Image',
        images: [],
      },
    })

    const result = normalizeCartEntry(entry)
    expect(result.imageUrl).toBeUndefined()
  })

  it('handles missing optional price fields with defaults', () => {
    const entry: CartEntry = {
      entryNumber: 0,
      product: { code: 'MIN', name: 'Minimal', images: [] },
      quantity: 1,
    }

    const result = normalizeCartEntry(entry)

    expect(result.basePriceFormatted).toBe('')
    expect(result.totalPriceFormatted).toBe('')
    expect(result.basePriceValue).toBe(0)
    expect(result.totalPriceValue).toBe(0)
  })

  it('defaults updateable to true when not specified', () => {
    const entry: CartEntry = {
      entryNumber: 0,
      product: { code: 'UPD', name: 'Updateable', images: [] },
      quantity: 1,
    }

    const result = normalizeCartEntry(entry)
    expect(result.updateable).toBe(true)
  })

  it('respects explicit updateable: false', () => {
    const entry = createCartEntry({ updateable: false })

    const result = normalizeCartEntry(entry)
    expect(result.updateable).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// normalizeCart
// ---------------------------------------------------------------------------

describe('normalizeCart', () => {
  it('maps all fields from a full cart', () => {
    const cart = createCart({
      code: 'CART-001',
      guid: 'guid-abc',
    })

    const result = normalizeCart(cart)

    expect(result.code).toBe('CART-001')
    expect(result.guid).toBe('guid-abc')
    expect(result.entries).toHaveLength(cart.entries!.length)
    expect(result.totalItems).toBe(cart.totalItems)
    expect(result.totalUnitCount).toBe(cart.totalUnitCount)
    expect(result.isEmpty).toBe(false)
    expect(result.totalFormatted).toBe(cart.totalPrice?.formattedValue)
    expect(result.totalValue).toBe(cart.totalPrice?.value)
    expect(result.raw).toBe(cart)
  })

  it('normalizes cart entries', () => {
    const cart = createCart()
    const result = normalizeCart(cart)

    // Each entry should be a NormalizedCartEntry
    for (const entry of result.entries) {
      expect(entry).toHaveProperty('productCode')
      expect(entry).toHaveProperty('productName')
      expect(entry).toHaveProperty('basePriceFormatted')
      expect(entry).toHaveProperty('totalPriceFormatted')
      expect(entry).toHaveProperty('raw')
    }
  })

  it('identifies empty cart', () => {
    const cart = createEmptyCart()
    const result = normalizeCart(cart)

    expect(result.isEmpty).toBe(true)
    expect(result.entries).toHaveLength(0)
    expect(result.totalItems).toBe(0)
    expect(result.totalUnitCount).toBe(0)
    expect(result.totalValue).toBe(0)
    expect(result.totalFormatted).toBe('$0.00')
  })

  it('detects applied vouchers', () => {
    const cart = createCart({
      appliedVouchers: [createVoucher({ code: 'SAVE10' })],
    })

    const result = normalizeCart(cart)

    expect(result.hasVouchers).toBe(true)
    expect(result.voucherCount).toBe(1)
  })

  it('reports no vouchers when none applied', () => {
    const cart = createCart({ appliedVouchers: [] })
    const result = normalizeCart(cart)

    expect(result.hasVouchers).toBe(false)
    expect(result.voucherCount).toBe(0)
  })

  it('reports no vouchers when field is undefined', () => {
    const cart = createCart()
    // createCart doesn't add appliedVouchers by default
    delete (cart as unknown as Record<string, unknown>).appliedVouchers
    const result = normalizeCart(cart)

    expect(result.hasVouchers).toBe(false)
    expect(result.voucherCount).toBe(0)
  })

  it('detects applied order promotions', () => {
    const cart = createCart({
      appliedOrderPromotions: [createCartPromotion()],
    })

    const result = normalizeCart(cart)
    expect(result.hasPromotions).toBe(true)
  })

  it('detects applied product promotions', () => {
    const cart = createCart({
      appliedProductPromotions: [createCartPromotion()],
    })

    const result = normalizeCart(cart)
    expect(result.hasPromotions).toBe(true)
  })

  it('reports no promotions when none applied', () => {
    const cart = createCart()
    const result = normalizeCart(cart)
    expect(result.hasPromotions).toBe(false)
  })

  it('defaults currencyIso to USD when totalPrice is missing', () => {
    const cart: Cart = {
      code: 'NO-PRICE',
      entries: [],
    }

    const result = normalizeCart(cart)
    expect(result.currencyIso).toBe('USD')
  })

  it('extracts currencyIso from totalPrice', () => {
    const cart = createCart({
      totalPrice: { currencyIso: 'EUR', value: 50, formattedValue: '50,00 EUR' },
    })

    const result = normalizeCart(cart)
    expect(result.currencyIso).toBe('EUR')
  })

  it('computes totalItems from entries when totalItems is missing', () => {
    const cart: Cart = {
      code: 'NO-TOTAL-ITEMS',
      entries: [
        createCartEntry({ entryNumber: 0 }),
        createCartEntry({ entryNumber: 1 }),
        createCartEntry({ entryNumber: 2 }),
      ],
    }

    const result = normalizeCart(cart)
    expect(result.totalItems).toBe(3)
  })

  it('computes totalUnitCount from entries when totalUnitCount is missing', () => {
    const cart: Cart = {
      code: 'NO-UNIT-COUNT',
      entries: [
        createCartEntry({ entryNumber: 0, quantity: 3 }),
        createCartEntry({ entryNumber: 1, quantity: 2 }),
      ],
    }

    const result = normalizeCart(cart)
    expect(result.totalUnitCount).toBe(5)
  })

  it('handles cart with undefined entries', () => {
    const cart: Cart = { code: 'NO-ENTRIES' }

    const result = normalizeCart(cart)

    expect(result.entries).toEqual([])
    expect(result.isEmpty).toBe(true)
    expect(result.totalItems).toBe(0)
  })
})
