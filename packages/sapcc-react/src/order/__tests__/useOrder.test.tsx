import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { useAuth } from '../../auth/useAuth'
import { useOrder } from '../useOrder'
import { renderHookWithProviders } from '../../../test/test-utils'
import { resetOrderState } from '../../../test/mocks/handlers/orders'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

/** Helper: render both auth and order hooks, then login */
async function setupAuthenticatedOrder(
  orderCode: string,
  options?: Parameters<typeof useOrder>[1],
) {
  const { result, queryClient } = renderHookWithProviders(
    () => ({
      auth: useAuth(),
      order: useOrder(orderCode, options),
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

  // Wait for order query to settle
  await waitFor(() => {
    expect(result.current.order.data).toBeDefined()
  })

  return { result, queryClient }
}

describe('useOrder', () => {
  beforeEach(() => {
    localStorage.clear()
    resetOrderState()
  })

  it('returns no data when user is not authenticated', () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        order: useOrder('ORDER-001'),
      }),
      { configOverrides: authConfig },
    )

    expect(result.current.order.data).toBeUndefined()
    expect(result.current.order.isFetching).toBe(false)
  })

  it('fetches order detail after login', async () => {
    const { result } = await setupAuthenticatedOrder('ORDER-001')

    const order = result.current.order.data
    expect(order).toBeDefined()
    expect(order?.code).toBe('ORDER-001')
    expect(order?.status).toBe('COMPLETED')
  })

  it('returns full order details', async () => {
    const { result } = await setupAuthenticatedOrder('ORDER-002')

    const order = result.current.order.data
    expect(order?.code).toBe('ORDER-002')
    expect(order?.entries).toBeDefined()
    expect(order?.totalPrice).toBeDefined()
    expect(order?.deliveryAddress).toBeDefined()
  })

  it('is disabled when orderCode is empty', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        order: useOrder(''),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'test@example.com',
        password: 'secret123',
      })
    })

    expect(result.current.order.data).toBeUndefined()
    expect(result.current.order.isFetching).toBe(false)
  })

  it('respects the enabled option', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        order: useOrder('ORDER-001', { enabled: false }),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'test@example.com',
        password: 'secret123',
      })
    })

    expect(result.current.order.data).toBeUndefined()
    expect(result.current.order.isFetching).toBe(false)
  })

  it('returns error for non-existent order', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        order: useOrder('NON_EXISTENT'),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'test@example.com',
        password: 'secret123',
      })
    })

    await waitFor(() => {
      expect(result.current.order.isError).toBe(true)
    })
  })
})
