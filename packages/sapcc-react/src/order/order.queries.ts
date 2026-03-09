import { queryOptions } from '@tanstack/react-query'
import type { OccClient } from '../http/occ-client'
import type { Order } from '../checkout/checkout.types'
import type {
  OrderHistoryPage,
  ReturnRequestListPage,
  ReturnRequest,
  ConsignmentTracking,
  UseOrdersOptions,
  UseOrderOptions,
  UseOrderReturnsOptions,
  UseConsignmentTrackingOptions,
} from './order.types'

/** 30 seconds — orders may change during a session (status updates, etc.) */
const ORDER_STALE_TIME = 30 * 1000

/** 60 seconds — return requests and tracking change less frequently */
const SLOW_STALE_TIME = 60 * 1000

/**
 * TanStack Query option factories for SAP Commerce Cloud order endpoints.
 *
 * Each factory returns a `queryOptions()` object suitable for `useQuery()`.
 * Keys are namespaced under `['sapcc', 'order', ...]`.
 *
 * @example
 * ```ts
 * const client = useSapccClient()
 *
 * // Order history (paginated)
 * const { data } = useQuery(orderQueries.orders(client, { pageSize: 10 }))
 *
 * // Single order detail
 * const { data } = useQuery(orderQueries.order(client, 'ORDER-001'))
 * ```
 */
export const orderQueries = {
  /** Fetch paginated order history */
  orders: (client: OccClient, options: UseOrdersOptions = {}) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'order',
        'history',
        options.currentPage ?? 0,
        options.pageSize ?? 5,
        options.sort,
        options.statuses,
        options.fields ?? 'DEFAULT',
      ] as const,
      queryFn: async () => {
        const response = await client.get<OrderHistoryPage>(
          '/users/current/orders',
          {
            currentPage: options.currentPage ?? 0,
            pageSize: options.pageSize ?? 5,
            sort: options.sort,
            statuses: options.statuses,
            fields: options.fields,
          },
        )
        return response.data
      },
      staleTime: ORDER_STALE_TIME,
      enabled: options.enabled ?? true,
    }),

  /** Fetch a single order by code */
  order: (
    client: OccClient,
    orderCode: string,
    options: UseOrderOptions = {},
  ) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'order',
        'detail',
        orderCode,
        options.fields ?? 'FULL',
      ] as const,
      queryFn: async () => {
        const response = await client.get<Order>(
          `/users/current/orders/${encodeURIComponent(orderCode)}`,
          {
            fields: options.fields ?? 'FULL',
          },
        )
        return response.data
      },
      staleTime: ORDER_STALE_TIME,
      enabled: (options.enabled ?? true) && Boolean(orderCode),
    }),

  /** Fetch paginated return request history */
  returnRequests: (client: OccClient, options: UseOrderReturnsOptions = {}) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'order',
        'returns',
        options.currentPage ?? 0,
        options.pageSize ?? 5,
        options.sort,
        options.fields ?? 'DEFAULT',
      ] as const,
      queryFn: async () => {
        const response = await client.get<ReturnRequestListPage>(
          '/users/current/orderReturns',
          {
            currentPage: options.currentPage ?? 0,
            pageSize: options.pageSize ?? 5,
            sort: options.sort,
            fields: options.fields,
          },
        )
        return response.data
      },
      staleTime: SLOW_STALE_TIME,
      enabled: options.enabled ?? true,
    }),

  /** Fetch a single return request by RMA code */
  returnRequest: (
    client: OccClient,
    returnRequestCode: string,
    options: UseOrderReturnsOptions = {},
  ) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'order',
        'return',
        returnRequestCode,
        options.fields ?? 'FULL',
      ] as const,
      queryFn: async () => {
        const response = await client.get<ReturnRequest>(
          `/users/current/orderReturns/${encodeURIComponent(returnRequestCode)}`,
          {
            fields: options.fields ?? 'FULL',
          },
        )
        return response.data
      },
      staleTime: SLOW_STALE_TIME,
      enabled: (options.enabled ?? true) && Boolean(returnRequestCode),
    }),

  /** Fetch consignment tracking information */
  consignmentTracking: (
    client: OccClient,
    orderCode: string,
    consignmentCode: string,
    options: UseConsignmentTrackingOptions = {},
  ) =>
    queryOptions({
      queryKey: [
        'sapcc',
        'order',
        'tracking',
        orderCode,
        consignmentCode,
        options.fields ?? 'DEFAULT',
      ] as const,
      queryFn: async () => {
        const response = await client.get<ConsignmentTracking>(
          `/orders/${encodeURIComponent(orderCode)}/consignments/${encodeURIComponent(consignmentCode)}/tracking`,
          {
            fields: options.fields,
          },
        )
        return response.data
      },
      staleTime: SLOW_STALE_TIME,
      enabled:
        (options.enabled ?? true) &&
        Boolean(orderCode) &&
        Boolean(consignmentCode),
    }),
} as const
