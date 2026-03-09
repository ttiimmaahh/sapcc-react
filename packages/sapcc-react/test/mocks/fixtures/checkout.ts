import { faker } from '@faker-js/faker'
import { createPrice } from './common'
import {
  createAddress,
  createDeliveryMode,
  createPaymentDetails,
  createCartEntry,
} from './cart'
import type { Order, Consignment, ConsignmentEntry, DeliveryModeList } from '../../../src/checkout/checkout.types'

// ---------------------------------------------------------------------------
// ConsignmentEntry
// ---------------------------------------------------------------------------

export function createConsignmentEntry(
  overrides: Partial<ConsignmentEntry> = {},
): ConsignmentEntry {
  return {
    orderEntry: createCartEntry(),
    quantity: faker.number.int({ min: 1, max: 5 }),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Consignment
// ---------------------------------------------------------------------------

export function createConsignment(
  overrides: Partial<Consignment> = {},
): Consignment {
  return {
    code: faker.string.alphanumeric(10),
    status: 'SHIPPED',
    statusDate: faker.date.recent().toISOString(),
    entries: [createConsignmentEntry()],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------

export function createOrder(overrides: Partial<Order> = {}): Order {
  const entries = overrides.entries ?? [
    createCartEntry({ entryNumber: 0 }),
    createCartEntry({ entryNumber: 1 }),
  ]

  const totalValue = entries.reduce(
    (sum, e) => sum + (e.totalPrice?.value ?? 0),
    0,
  )

  return {
    code: faker.string.alphanumeric(8).toUpperCase(),
    guid: faker.string.uuid(),
    status: 'CREATED',
    statusDisplay: 'Created',
    created: faker.date.recent().toISOString(),
    placed: faker.date.recent().toISOString(),
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
    deliveryAddress: createAddress(),
    deliveryMode: createDeliveryMode(),
    paymentInfo: createPaymentDetails(),
    calculated: true,
    net: false,
    guestCustomer: false,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// DeliveryModeList
// ---------------------------------------------------------------------------

export function createDeliveryModeList(
  overrides: Partial<DeliveryModeList> = {},
): DeliveryModeList {
  return {
    deliveryModes: [
      createDeliveryMode({ code: 'standard-gross', name: 'Standard Delivery' }),
      createDeliveryMode({
        code: 'premium-gross',
        name: 'Premium Delivery',
        deliveryCost: createPrice({ value: 19.99, formattedValue: '$19.99' }),
      }),
    ],
    ...overrides,
  }
}
