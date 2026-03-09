import { faker } from '@faker-js/faker'
import { createPrice, createPagination } from './common'
import { createCartEntry } from './cart'
import { createOrder, createConsignment, createConsignmentEntry } from './checkout'
import type {
  OrderHistoryPage,
  OrderSort,
  ReturnRequest,
  ReturnRequestEntry,
  ReturnRequestListPage,
  ConsignmentTracking,
  TrackingEvent,
} from '../../../src/order/order.types'

// Re-export from checkout fixtures for convenience — test files can import from one place
export { createOrder, createConsignment, createConsignmentEntry }

// ---------------------------------------------------------------------------
// Order Sort
// ---------------------------------------------------------------------------

export function createOrderSort(
  overrides: Partial<OrderSort> = {},
): OrderSort {
  return {
    code: 'byDate',
    asc: false,
    selected: true,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// OrderHistoryPage
// ---------------------------------------------------------------------------

export function createOrderHistoryPage(
  overrides: Partial<OrderHistoryPage> = {},
): OrderHistoryPage {
  const orders = overrides.orders ?? [
    createOrder({ code: 'ORDER-001', status: 'COMPLETED', statusDisplay: 'Completed' }),
    createOrder({ code: 'ORDER-002', status: 'CREATED', statusDisplay: 'Created' }),
    createOrder({ code: 'ORDER-003', status: 'SHIPPED', statusDisplay: 'Shipped' }),
  ]

  return {
    orders,
    sorts: [
      createOrderSort({ code: 'byDate', asc: false, selected: true }),
      createOrderSort({ code: 'byOrderNumber', asc: false, selected: false }),
    ],
    pagination: createPagination({
      currentPage: 0,
      pageSize: 5,
      totalResults: orders.length,
      totalPages: 1,
    }),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// ReturnRequestEntry
// ---------------------------------------------------------------------------

export function createReturnRequestEntry(
  overrides: Partial<ReturnRequestEntry> = {},
): ReturnRequestEntry {
  return {
    orderEntry: createCartEntry({ entryNumber: 0 }),
    expectedQuantity: faker.number.int({ min: 1, max: 3 }),
    refundAmount: createPrice(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// ReturnRequest
// ---------------------------------------------------------------------------

export function createReturnRequest(
  overrides: Partial<ReturnRequest> = {},
): ReturnRequest {
  const returnEntries = overrides.returnEntries ?? [createReturnRequestEntry()]

  return {
    rma: faker.string.alphanumeric(8).toUpperCase(),
    order: { code: faker.string.alphanumeric(8).toUpperCase() },
    status: 'PENDING',
    creationTime: faker.date.recent().toISOString(),
    returnEntries,
    deliverable: true,
    refundDeliveryCost: false,
    totalPrice: createPrice(),
    subTotal: createPrice(),
    cancellable: true,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// ReturnRequestListPage
// ---------------------------------------------------------------------------

export function createReturnRequestListPage(
  overrides: Partial<ReturnRequestListPage> = {},
): ReturnRequestListPage {
  const returnRequests = overrides.returnRequests ?? [
    createReturnRequest({ rma: 'RMA-001', status: 'PENDING' }),
    createReturnRequest({ rma: 'RMA-002', status: 'APPROVED' }),
  ]

  return {
    returnRequests,
    sorts: [
      createOrderSort({ code: 'byDate', asc: false, selected: true }),
    ],
    pagination: createPagination({
      currentPage: 0,
      pageSize: 5,
      totalResults: returnRequests.length,
      totalPages: 1,
    }),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// TrackingEvent
// ---------------------------------------------------------------------------

export function createTrackingEvent(
  overrides: Partial<TrackingEvent> = {},
): TrackingEvent {
  return {
    detail: faker.lorem.sentence(),
    eventDate: faker.date.recent().toISOString(),
    location: `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// ConsignmentTracking
// ---------------------------------------------------------------------------

export function createConsignmentTracking(
  overrides: Partial<ConsignmentTracking> = {},
): ConsignmentTracking {
  return {
    carrierCode: 'UPS',
    trackingID: faker.string.alphanumeric(18).toUpperCase(),
    trackingUrl: `https://www.ups.com/track?tracknum=${faker.string.alphanumeric(18)}`,
    trackingEvents: [
      createTrackingEvent({ detail: 'Package delivered' }),
      createTrackingEvent({ detail: 'Out for delivery' }),
      createTrackingEvent({ detail: 'In transit' }),
      createTrackingEvent({ detail: 'Package picked up' }),
    ],
    ...overrides,
  }
}
