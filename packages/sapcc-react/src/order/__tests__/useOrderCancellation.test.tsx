import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { useAuth } from '../../auth/useAuth'
import { useOrderCancellation } from '../useOrderCancellation'
import { useOrders } from '../useOrders'
import { renderHookWithProviders } from '../../../test/test-utils'
import { resetOrderState } from '../../../test/mocks/handlers/orders'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

describe('useOrderCancellation', () => {
  beforeEach(() => {
    localStorage.clear()
    resetOrderState()
  })

  it('cancels an order and invalidates queries', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        orders: useOrders(),
        cancelOrder: useOrderCancellation(),
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

    // Wait for orders to load
    await waitFor(() => {
      expect(result.current.orders.data).toBeDefined()
    })

    // Verify order is in CREATED status before cancellation
    const orderBefore = result.current.orders.data?.orders?.find(
      (o) => o.code === 'ORDER-002',
    )
    expect(orderBefore?.status).toBe('CREATED')

    // Cancel order
    await act(async () => {
      await result.current.cancelOrder.mutateAsync({
        orderCode: 'ORDER-002',
        cancellationRequestEntryInputs: [
          { orderEntryNumber: 0, quantity: 1 },
        ],
      })
    })

    // After cancellation + invalidation, order should be updated
    await waitFor(() => {
      const orderAfter = result.current.orders.data?.orders?.find(
        (o) => o.code === 'ORDER-002',
      )
      expect(orderAfter?.status).toBe('CANCELLING')
    })
  })

  it('cancels specific entries from an order', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        orders: useOrders(),
        cancelOrder: useOrderCancellation(),
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

    // Wait for orders to load
    await waitFor(() => {
      expect(result.current.orders.data).toBeDefined()
    })

    // Cancel a single entry from ORDER-003
    await act(async () => {
      await result.current.cancelOrder.mutateAsync({
        orderCode: 'ORDER-003',
        cancellationRequestEntryInputs: [
          { orderEntryNumber: 0, quantity: 2 },
        ],
      })
    })

    // Verify the order status changed
    await waitFor(() => {
      const order = result.current.orders.data?.orders?.find(
        (o) => o.code === 'ORDER-003',
      )
      expect(order?.status).toBe('CANCELLING')
    })
  })

  // This test uses rejects.toThrow which can cause cleanup issues in
  // @testing-library/react — keep it as the last test in the describe block.
  it('throws error for non-existent order', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        cancelOrder: useOrderCancellation(),
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

    await expect(
      act(async () => {
        await result.current.cancelOrder.mutateAsync({
          orderCode: 'NON_EXISTENT',
          cancellationRequestEntryInputs: [
            { orderEntryNumber: 0, quantity: 1 },
          ],
        })
      }),
    ).rejects.toThrow()
  })
})
