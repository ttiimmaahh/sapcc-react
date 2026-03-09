/**
 * Order domain types — mirrors SAP Commerce Cloud OCC v2 order management API shapes.
 *
 * Core order types (Order, Consignment, ConsignmentEntry) are re-exported
 * from checkout.types.ts where they were originally defined.
 *
 * This file adds types specific to order management:
 * - Order history (paginated list)
 * - Order cancellation
 * - Return requests
 * - Consignment tracking
 */

import type { OccFields } from '../http/types'
import type { Pagination } from '../product/product.types'

// Re-export core order types from checkout for convenience
export type { Order, Consignment, ConsignmentEntry } from '../checkout/checkout.types'

// ---------------------------------------------------------------------------
// Order history types
// ---------------------------------------------------------------------------

/** Sort option for order history */
export interface OrderSort {
  code: string
  asc?: boolean
  selected?: boolean
}

/** Paginated order history response from `GET /users/{userId}/orders` */
export interface OrderHistoryPage {
  /** List of orders */
  orders?: import('../checkout/checkout.types').Order[]
  /** Available sort options */
  sorts?: OrderSort[]
  /** Pagination info */
  pagination?: Pagination
}

// ---------------------------------------------------------------------------
// Order cancellation types
// ---------------------------------------------------------------------------

/** A single entry in a cancellation request */
export interface CancellationRequestEntryInput {
  /** The order entry number to cancel */
  orderEntryNumber: number
  /** The quantity to cancel */
  quantity: number
}

/** Parameters for requesting an order cancellation */
export interface CancelOrderParams {
  /** Order code to cancel */
  orderCode: string
  /** Entries to cancel (entry number + quantity) */
  cancellationRequestEntryInputs: CancellationRequestEntryInput[]
}

// ---------------------------------------------------------------------------
// Return request types
// ---------------------------------------------------------------------------

/** Status of a return request */
export type ReturnRequestStatus =
  | 'PENDING'
  | 'APPROVING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLING'
  | 'CANCELED'
  | 'WAIT'
  | 'RECEIVED'
  | 'PAYMENT_REVERSED'
  | 'COMPLETED'
  | (string & {})

/** A single entry within a return request */
export interface ReturnRequestEntry {
  /** The original order entry */
  orderEntry: import('../cart/cart.types').CartEntry
  /** Quantity expected to be returned */
  expectedQuantity: number
  /** Refund amount for this entry */
  refundAmount?: import('../product/product.types').Price
}

/** A return request (RMA) for an order */
export interface ReturnRequest {
  /** Return merchandise authorization (RMA) code */
  rma: string
  /** The order code this return is for */
  order?: {
    code: string
  }
  /** Return request status */
  status?: ReturnRequestStatus
  /** Date the return was created */
  creationTime?: string
  /** Entries in this return request */
  returnEntries?: ReturnRequestEntry[]
  /** Whether the return is deliverable */
  deliverable?: boolean
  /** Refund information */
  refundDeliveryCost?: boolean
  /** Total refund amount */
  totalPrice?: import('../product/product.types').Price
  /** Sub-total refund amount */
  subTotal?: import('../product/product.types').Price
  /** Whether the return can be cancelled */
  cancellable?: boolean
}

/** Paginated list of return requests */
export interface ReturnRequestListPage {
  /** List of return requests */
  returnRequests?: ReturnRequest[]
  /** Available sort options */
  sorts?: OrderSort[]
  /** Pagination info */
  pagination?: Pagination
}

/** A single entry input for creating a return request */
export interface ReturnRequestEntryInput {
  /** The order entry number to return */
  orderEntryNumber: number
  /** The quantity to return */
  quantity: number
}

/** Parameters for creating a return request */
export interface CreateReturnRequestParams {
  /** Order code to create a return for */
  orderCode: string
  /** Entries to return (entry number + quantity) */
  returnRequestEntryInputs: ReturnRequestEntryInput[]
}

// ---------------------------------------------------------------------------
// Consignment tracking types
// ---------------------------------------------------------------------------

/** A tracking event in the shipment timeline */
export interface TrackingEvent {
  /** Event description */
  detail?: string
  /** ISO date of the event */
  eventDate?: string
  /** Location of the event */
  location?: string
}

/** Consignment tracking information */
export interface ConsignmentTracking {
  /** Carrier code (e.g., 'UPS', 'FedEx') */
  carrierCode?: string
  /** Tracking ID / number */
  trackingID?: string
  /** URL to the carrier's tracking page */
  trackingUrl?: string
  /** Tracking events in order */
  trackingEvents?: TrackingEvent[]
}

// ---------------------------------------------------------------------------
// Hook option types
// ---------------------------------------------------------------------------

/** Options for `useOrders()` — paginated order history */
export interface UseOrdersOptions {
  /** Page size (default: 5) */
  pageSize?: number
  /** Current page index, 0-based (default: 0) */
  currentPage?: number
  /** Sort field (e.g., 'byDate', 'byOrderNumber') */
  sort?: string
  /** Filter by order status (comma-separated status codes) */
  statuses?: string
  /** OCC fields parameter */
  fields?: OccFields
  /** Whether the query is enabled (default: true) */
  enabled?: boolean
}

/** Options for `useOrder()` — single order detail */
export interface UseOrderOptions {
  /** OCC fields parameter */
  fields?: OccFields
  /** Whether the query is enabled (default: true) */
  enabled?: boolean
}

/** Options for `useOrderReturns()` — paginated return request list */
export interface UseOrderReturnsOptions {
  /** Page size (default: 5) */
  pageSize?: number
  /** Current page index, 0-based (default: 0) */
  currentPage?: number
  /** Sort field */
  sort?: string
  /** OCC fields parameter */
  fields?: OccFields
  /** Whether the query is enabled (default: true) */
  enabled?: boolean
}

/** Options for `useConsignmentTracking()` */
export interface UseConsignmentTrackingOptions {
  /** OCC fields parameter */
  fields?: OccFields
  /** Whether the query is enabled (default: true) */
  enabled?: boolean
}
