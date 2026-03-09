import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { useAuth } from '../../auth/useAuth'
import { useOrders } from '../useOrders'
import { renderHookWithProviders } from '../../../test/test-utils'
import { resetOrderState } from '../../../test/mocks/handlers/orders'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

/** Helper: render both auth and orders hooks, then login */
async function setupAuthenticatedOrders(
  options?: Parameters<typeof useOrders>[0],
) {
  const { result, queryClient } = renderHookWithProviders(
    () => ({
      auth: useAuth(),
      orders: useOrders(options),
    }),
    { configOverrides: authConfig },
  )

  // Login
  await act(async () => {
    await result.current.auth.login({
      username: 'test@example.com',
      password: 'secret123',
    })
  })

  // Wait for orders query to settle
  await waitFor(() => {
    expect(result.current.orders.data).toBeDefined()
  })

  return { result, queryClient }
}

describe('useOrders', () => {
  beforeEach(() => {
    localStorage.clear()
    resetOrderState()
  })

  it('returns no data when user is not authenticated', () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        orders: useOrders(),
      }),
      { configOverrides: authConfig },
    )

    expect(result.current.orders.data).toBeUndefined()
    expect(result.current.orders.isFetching).toBe(false)
  })

  it('fetches order history after login', async () => {
    const { result } = await setupAuthenticatedOrders()

    const data = result.current.orders.data
    expect(data?.orders).toBeDefined()
    expect(data?.orders).toHaveLength(3)
    expect(data?.pagination).toBeDefined()
    expect(data?.sorts).toBeDefined()
  })

  it('returns orders with expected fields', async () => {
    const { result } = await setupAuthenticatedOrders()

    const firstOrder = result.current.orders.data?.orders?.[0]
    expect(firstOrder?.code).toBe('ORDER-001')
    expect(firstOrder?.status).toBe('COMPLETED')
    expect(firstOrder?.statusDisplay).toBe('Completed')
  })

  it('respects the enabled option', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        orders: useOrders({ enabled: false }),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'test@example.com',
        password: 'secret123',
      })
    })

    expect(result.current.orders.data).toBeUndefined()
    expect(result.current.orders.isFetching).toBe(false)
  })

  it('passes pagination parameters to the API', async () => {
    const { result } = await setupAuthenticatedOrders({
      pageSize: 2,
      currentPage: 0,
    })

    const data = result.current.orders.data
    expect(data?.orders).toHaveLength(2)
    expect(data?.pagination?.pageSize).toBe(2)
    expect(data?.pagination?.currentPage).toBe(0)
  })

  it('filters by status when statuses option is provided', async () => {
    const { result } = await setupAuthenticatedOrders({
      statuses: 'COMPLETED',
    })

    const data = result.current.orders.data
    expect(data?.orders).toHaveLength(1)
    expect(data?.orders?.[0]?.status).toBe('COMPLETED')
  })
})
