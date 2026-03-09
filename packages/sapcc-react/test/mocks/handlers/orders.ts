import { http, HttpResponse } from 'msw'
import {
  createOrder,
  createOrderHistoryPage,
  createReturnRequest,
  createReturnRequestListPage,
  createConsignmentTracking,
} from '../fixtures/orders'
import { createPagination } from '../fixtures/common'
import type { Order } from '../../../src/checkout/checkout.types'
import type { ReturnRequest } from '../../../src/order/order.types'

const BASE_URL = 'https://test.example.com/occ/v2/test-site'

// ---------------------------------------------------------------------------
// In-memory order state for realistic handler behavior
// ---------------------------------------------------------------------------

let orders: Order[] = [
  createOrder({ code: 'ORDER-001', status: 'COMPLETED', statusDisplay: 'Completed' }),
  createOrder({ code: 'ORDER-002', status: 'CREATED', statusDisplay: 'Created' }),
  createOrder({ code: 'ORDER-003', status: 'SHIPPED', statusDisplay: 'Shipped' }),
]

let returnRequests: ReturnRequest[] = [
  createReturnRequest({ rma: 'RMA-001', status: 'PENDING', order: { code: 'ORDER-001' } }),
  createReturnRequest({ rma: 'RMA-002', status: 'APPROVED', order: { code: 'ORDER-002' } }),
]

/** Reset order state between tests */
export function resetOrderState(): void {
  orders = [
    createOrder({ code: 'ORDER-001', status: 'COMPLETED', statusDisplay: 'Completed' }),
    createOrder({ code: 'ORDER-002', status: 'CREATED', statusDisplay: 'Created' }),
    createOrder({ code: 'ORDER-003', status: 'SHIPPED', statusDisplay: 'Shipped' }),
  ]

  returnRequests = [
    createReturnRequest({ rma: 'RMA-001', status: 'PENDING', order: { code: 'ORDER-001' } }),
    createReturnRequest({ rma: 'RMA-002', status: 'APPROVED', order: { code: 'ORDER-002' } }),
  ]
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const orderHandlers = [
  // ── Order History (GET /users/:userId/orders) ───────────────────────
  // NOTE: Must be registered BEFORE the checkout handler for POST /users/:userId/orders.
  // Since MSW matches by method + path, GET and POST on the same path don't conflict.
  http.get(
    `${BASE_URL}/users/:userId/orders`,
    ({ request }) => {
      const url = new URL(request.url)
      const pageSize = Number(url.searchParams.get('pageSize') ?? 5)
      const currentPage = Number(url.searchParams.get('currentPage') ?? 0)
      const statuses = url.searchParams.get('statuses')

      // Filter by status if provided
      let filteredOrders = orders
      if (statuses) {
        const statusList = statuses.split(',')
        filteredOrders = orders.filter((o) => statusList.includes(o.status ?? ''))
      }

      // Paginate
      const start = currentPage * pageSize
      const pageOrders = filteredOrders.slice(start, start + pageSize)
      const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))

      return HttpResponse.json(
        createOrderHistoryPage({
          orders: pageOrders,
          pagination: createPagination({
            currentPage,
            pageSize,
            totalResults: filteredOrders.length,
            totalPages,
          }),
        }),
      )
    },
  ),

  // ── Order Detail (GET /users/:userId/orders/:orderCode) ─────────────
  http.get(
    `${BASE_URL}/users/:userId/orders/:orderCode`,
    ({ params }) => {
      const { orderCode } = params
      const order = orders.find((o) => o.code === orderCode)

      if (!order) {
        return HttpResponse.json(
          { errors: [{ type: 'NotFoundError', message: `Order ${String(orderCode)} not found` }] },
          { status: 404 },
        )
      }

      return HttpResponse.json(order)
    },
  ),

  // ── Order Cancellation (POST /users/:userId/orders/:orderCode/cancellation) ──
  http.post(
    `${BASE_URL}/users/:userId/orders/:orderCode/cancellation`,
    async ({ params, request }) => {
      const { orderCode } = params
      const order = orders.find((o) => o.code === orderCode)

      if (!order) {
        return HttpResponse.json(
          { errors: [{ type: 'NotFoundError', message: `Order ${String(orderCode)} not found` }] },
          { status: 404 },
        )
      }

      const body = (await request.json()) as Record<string, unknown>
      if (!body.cancellationRequestEntryInputs) {
        return HttpResponse.json(
          { errors: [{ type: 'ValidationError', message: 'cancellationRequestEntryInputs is required' }] },
          { status: 400 },
        )
      }

      // Update in-memory state: mark order as cancelling
      order.status = 'CANCELLING'
      order.statusDisplay = 'Cancelling'

      // OCC returns 200 with empty body on successful cancellation request
      return new HttpResponse(null, { status: 200 })
    },
  ),

  // ── Return Request List (GET /users/:userId/orderReturns) ───────────
  http.get(
    `${BASE_URL}/users/:userId/orderReturns`,
    ({ request }) => {
      const url = new URL(request.url)
      const pageSize = Number(url.searchParams.get('pageSize') ?? 5)
      const currentPage = Number(url.searchParams.get('currentPage') ?? 0)

      const start = currentPage * pageSize
      const pageReturns = returnRequests.slice(start, start + pageSize)
      const totalPages = Math.max(1, Math.ceil(returnRequests.length / pageSize))

      return HttpResponse.json(
        createReturnRequestListPage({
          returnRequests: pageReturns,
          pagination: createPagination({
            currentPage,
            pageSize,
            totalResults: returnRequests.length,
            totalPages,
          }),
        }),
      )
    },
  ),

  // ── Create Return Request (POST /users/:userId/orderReturns) ────────
  http.post(
    `${BASE_URL}/users/:userId/orderReturns`,
    async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      const orderCode = body.orderCode as string | undefined

      if (!orderCode || !body.returnRequestEntryInputs) {
        return HttpResponse.json(
          { errors: [{ type: 'ValidationError', message: 'orderCode and returnRequestEntryInputs are required' }] },
          { status: 400 },
        )
      }

      const newReturn = createReturnRequest({
        order: { code: orderCode },
        status: 'PENDING',
      })

      returnRequests.push(newReturn)

      return HttpResponse.json(newReturn, { status: 201 })
    },
  ),

  // ── Return Request Detail (GET /users/:userId/orderReturns/:returnRequestCode) ──
  http.get(
    `${BASE_URL}/users/:userId/orderReturns/:returnRequestCode`,
    ({ params }) => {
      const { returnRequestCode } = params
      const returnReq = returnRequests.find((r) => r.rma === returnRequestCode)

      if (!returnReq) {
        return HttpResponse.json(
          { errors: [{ type: 'NotFoundError', message: `Return request ${String(returnRequestCode)} not found` }] },
          { status: 404 },
        )
      }

      return HttpResponse.json(returnReq)
    },
  ),

  // ── Consignment Tracking (GET /orders/:orderCode/consignments/:consignmentCode/tracking) ──
  // NOTE: This endpoint does NOT have /users/current/ prefix in SAP Commerce.
  http.get(
    `${BASE_URL}/orders/:orderCode/consignments/:consignmentCode/tracking`,
    () => {
      return HttpResponse.json(createConsignmentTracking())
    },
  ),
]
