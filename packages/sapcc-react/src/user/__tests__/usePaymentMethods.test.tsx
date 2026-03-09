import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { useAuth } from '../../auth/useAuth'
import { usePaymentMethods } from '../usePaymentMethods'
import { renderHookWithProviders } from '../../../test/test-utils'
import { resetUserState } from '../../../test/mocks/handlers/user'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

/** Helper: render both auth and payment methods hooks, then login */
async function setupAuthenticatedPayments(
  options?: Parameters<typeof usePaymentMethods>[0],
) {
  const { result, queryClient } = renderHookWithProviders(
    () => ({
      auth: useAuth(),
      payments: usePaymentMethods(options),
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

  // Wait for payment methods query to settle
  await waitFor(() => {
    expect(result.current.payments.paymentMethods.data).toBeDefined()
  })

  return { result, queryClient }
}

describe('usePaymentMethods', () => {
  beforeEach(() => {
    localStorage.clear()
    resetUserState()
  })

  // ── Query tests ─────────────────────────────────────────────────────

  it('returns no data when user is not authenticated', () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        payments: usePaymentMethods(),
      }),
      { configOverrides: authConfig },
    )

    expect(result.current.payments.paymentMethods.data).toBeUndefined()
    expect(result.current.payments.paymentMethods.isFetching).toBe(false)
  })

  it('fetches payment methods after login', async () => {
    const { result } = await setupAuthenticatedPayments()

    const data = result.current.payments.paymentMethods.data
    expect(data).toHaveLength(2)
    expect(data?.[0]?.id).toBe('pay-1')
    expect(data?.[0]?.defaultPayment).toBe(true)
    expect(data?.[1]?.id).toBe('pay-2')
    expect(data?.[1]?.defaultPayment).toBe(false)
  })

  it('respects the enabled option', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        payments: usePaymentMethods({ enabled: false }),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'test@example.com',
        password: 'secret123',
      })
    })

    expect(result.current.payments.paymentMethods.data).toBeUndefined()
    expect(result.current.payments.paymentMethods.isFetching).toBe(false)
  })

  // ── Update payment method mutation tests ────────────────────────────

  it('updates a payment method', async () => {
    const { result } = await setupAuthenticatedPayments()

    await act(async () => {
      await result.current.payments.updatePaymentMethod.mutateAsync({
        paymentDetailsId: 'pay-2',
        defaultPayment: true,
      })
    })

    // After mutation settles, the refetched list should reflect the update
    await waitFor(() => {
      const pm = result.current.payments.paymentMethods.data?.find(
        (p) => p.id === 'pay-2',
      )
      expect(pm?.defaultPayment).toBe(true)
    })

    // The previously default payment should no longer be default
    const oldDefault = result.current.payments.paymentMethods.data?.find(
      (p) => p.id === 'pay-1',
    )
    expect(oldDefault?.defaultPayment).toBe(false)
  })

  it('returns 404 for updating a non-existent payment method', async () => {
    const { result } = await setupAuthenticatedPayments()

    let errorCaught = false

    await act(async () => {
      try {
        await result.current.payments.updatePaymentMethod.mutateAsync({
          paymentDetailsId: 'non-existent',
          defaultPayment: true,
        })
      } catch {
        errorCaught = true
      }
    })

    expect(errorCaught).toBe(true)
  })

  // ── Delete payment method mutation tests ────────────────────────────

  it('deletes a payment method', async () => {
    const { result } = await setupAuthenticatedPayments()

    expect(result.current.payments.paymentMethods.data).toHaveLength(2)

    await act(async () => {
      await result.current.payments.deletePaymentMethod.mutateAsync('pay-1')
    })

    await waitFor(() => {
      expect(result.current.payments.paymentMethods.data).toHaveLength(1)
    })

    expect(
      result.current.payments.paymentMethods.data?.find((p) => p.id === 'pay-1'),
    ).toBeUndefined()
  })
})
