// Order domain — barrel export

// Hooks
export { useOrders } from './useOrders'
export { useOrder } from './useOrder'
export { useOrderCancellation } from './useOrderCancellation'
export { useOrderReturns } from './useOrderReturns'
export { useCreateReturn } from './useCreateReturn'
export { useConsignmentTracking } from './useConsignmentTracking'

// Query factories
export { orderQueries } from './order.queries'

// Normalizers (re-exported from checkout for convenience)
export { normalizeOrder } from '../checkout/checkout.normalizers'
export type { NormalizedOrder } from '../checkout/checkout.normalizers'

// Types
export type {
  // Core order types (re-exported from checkout)
  Order,
  Consignment,
  ConsignmentEntry,
  // Order history
  OrderSort,
  OrderHistoryPage,
  // Cancellation
  CancellationRequestEntryInput,
  CancelOrderParams,
  // Return requests
  ReturnRequestStatus,
  ReturnRequestEntry,
  ReturnRequest,
  ReturnRequestListPage,
  ReturnRequestEntryInput,
  CreateReturnRequestParams,
  // Consignment tracking
  TrackingEvent,
  ConsignmentTracking,
  // Hook options
  UseOrdersOptions,
  UseOrderOptions,
  UseOrderReturnsOptions,
  UseConsignmentTrackingOptions,
} from './order.types'
