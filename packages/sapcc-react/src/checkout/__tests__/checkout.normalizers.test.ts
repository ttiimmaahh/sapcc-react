import { describe, it, expect } from 'vitest'
import { normalizeOrder, type NormalizedOrder } from '../checkout.normalizers'
import { createOrder, createConsignment } from '../../../test/mocks/fixtures/checkout'
import { createPrice } from '../../../test/mocks/fixtures/common'
import { createAddress, createCartEntry } from '../../../test/mocks/fixtures/cart'
import type { Order } from '../checkout.types'

describe('normalizeOrder', () => {
  it('returns all computed fields from a full order', () => {
    const order = createOrder({
      code: 'ORD-001',
      status: 'COMPLETED',
      statusDisplay: 'Completed',
      placed: '2026-03-01T12:00:00Z',
      totalItems: 3,
      totalUnitCount: 7,
      totalPrice: createPrice({
        value: 149.99,
        formattedValue: '$149.99',
        currencyIso: 'USD',
      }),
      guestCustomer: false,
      deliveryAddress: createAddress({
        line1: '123 Main St',
        town: 'Springfield',
        region: { isocode: 'US-IL', name: 'Illinois' },
        postalCode: '62701',
        country: { isocode: 'US', name: 'United States' },
      }),
      consignments: [
        createConsignment({ trackingID: 'TRACK123' }),
      ],
    })

    const result = normalizeOrder(order)

    expect(result.code).toBe('ORD-001')
    expect(result.status).toBe('COMPLETED')
    expect(result.statusDisplay).toBe('Completed')
    expect(result.placedDate).toBe('2026-03-01T12:00:00Z')
    expect(result.totalItems).toBe(3)
    expect(result.totalUnitCount).toBe(7)
    expect(result.totalFormatted).toBe('$149.99')
    expect(result.totalValue).toBe(149.99)
    expect(result.currencyIso).toBe('USD')
    expect(result.hasTracking).toBe(true)
    expect(result.isGuestOrder).toBe(false)
    expect(result.deliveryAddressFormatted).toContain('123 Main St')
    expect(result.deliveryAddressFormatted).toContain('Springfield')
    expect(result.raw).toBe(order)
  })

  it('uses fallback values for missing optional fields', () => {
    const minimalOrder: Order = {
      code: 'ORD-MIN',
    }

    const result = normalizeOrder(minimalOrder)

    expect(result.code).toBe('ORD-MIN')
    expect(result.status).toBe('UNKNOWN')
    expect(result.statusDisplay).toBe('Unknown')
    expect(result.placedDate).toBe('')
    expect(result.totalItems).toBe(0)
    expect(result.totalUnitCount).toBe(0)
    expect(result.totalFormatted).toBe('$0.00')
    expect(result.totalValue).toBe(0)
    expect(result.currencyIso).toBe('USD')
    expect(result.hasTracking).toBe(false)
    expect(result.isGuestOrder).toBe(false)
    expect(result.deliveryAddressFormatted).toBe('')
  })

  it('prefers statusDisplay over status for display', () => {
    const order = createOrder({
      status: 'PROCESSING',
      statusDisplay: 'Processing Your Order',
    })

    const result = normalizeOrder(order)

    expect(result.statusDisplay).toBe('Processing Your Order')
    expect(result.status).toBe('PROCESSING')
  })

  it('falls back to status when statusDisplay is missing', () => {
    const order = createOrder({
      status: 'CANCELLED',
      statusDisplay: undefined,
    })

    const result = normalizeOrder(order)

    expect(result.statusDisplay).toBe('CANCELLED')
  })

  it('prefers placed date over created date', () => {
    const order = createOrder({
      placed: '2026-03-01T12:00:00Z',
      created: '2026-02-28T10:00:00Z',
    })

    const result = normalizeOrder(order)

    expect(result.placedDate).toBe('2026-03-01T12:00:00Z')
  })

  it('falls back to created date when placed is missing', () => {
    const order = createOrder({
      placed: undefined,
      created: '2026-02-28T10:00:00Z',
    })

    const result = normalizeOrder(order)

    expect(result.placedDate).toBe('2026-02-28T10:00:00Z')
  })

  it('computes totalItems from entries when not provided', () => {
    const entries = [
      createCartEntry({ entryNumber: 0, quantity: 2 }),
      createCartEntry({ entryNumber: 1, quantity: 3 }),
    ]

    const order = createOrder({
      entries,
      totalItems: undefined,
      totalUnitCount: undefined,
    })

    const result = normalizeOrder(order)

    expect(result.totalItems).toBe(2) // 2 entries
    expect(result.totalUnitCount).toBe(5) // 2 + 3
  })

  it('detects tracking when at least one consignment has trackingID', () => {
    const order = createOrder({
      consignments: [
        createConsignment({ trackingID: undefined }),
        createConsignment({ trackingID: 'TRACK-ABC' }),
      ],
    })

    const result = normalizeOrder(order)

    expect(result.hasTracking).toBe(true)
  })

  it('no tracking when no consignment has trackingID', () => {
    const order = createOrder({
      consignments: [
        createConsignment({ trackingID: undefined }),
        createConsignment({ trackingID: undefined }),
      ],
    })

    const result = normalizeOrder(order)

    expect(result.hasTracking).toBe(false)
  })

  it('detects guest order from guestCustomer flag', () => {
    const order = createOrder({
      guestCustomer: true,
      user: { uid: 'guest@test.com' },
    })

    const result = normalizeOrder(order)

    expect(result.isGuestOrder).toBe(true)
  })

  it('formats delivery address as comma-separated string', () => {
    const order = createOrder({
      deliveryAddress: createAddress({
        line1: '456 Oak Ave',
        line2: 'Suite 200',
        town: 'Portland',
        region: { isocode: 'US-OR', name: 'Oregon' },
        postalCode: '97201',
        country: { isocode: 'US', name: 'United States' },
      }),
    })

    const result = normalizeOrder(order)

    expect(result.deliveryAddressFormatted).toBe(
      '456 Oak Ave, Suite 200, Portland, Oregon, 97201, United States',
    )
  })

  it('preserves raw order reference', () => {
    const order = createOrder()
    const result = normalizeOrder(order)

    expect(result.raw).toBe(order)
  })

  it('returns NormalizedOrder shape', () => {
    const order = createOrder()
    const result = normalizeOrder(order)

    // Verify all fields exist
    const keys: (keyof NormalizedOrder)[] = [
      'code',
      'statusDisplay',
      'status',
      'placedDate',
      'totalItems',
      'totalUnitCount',
      'totalFormatted',
      'totalValue',
      'currencyIso',
      'hasTracking',
      'isGuestOrder',
      'deliveryAddressFormatted',
      'raw',
    ]

    for (const key of keys) {
      expect(result).toHaveProperty(key)
    }
  })
})
