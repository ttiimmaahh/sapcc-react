import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { useAuth } from '../../auth/useAuth'
import { useCustomerCoupons } from '../useCustomerCoupons'
import { renderHookWithProviders } from '../../../test/test-utils'
import { resetUserState } from '../../../test/mocks/handlers/user'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

/** Helper: render both auth and customer coupons hooks, then login */
async function setupAuthenticatedCoupons(
  options?: Parameters<typeof useCustomerCoupons>[0],
) {
  const { result, queryClient } = renderHookWithProviders(
    () => ({
      auth: useAuth(),
      coupons: useCustomerCoupons(options),
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

  // Wait for customer coupons query to settle
  await waitFor(() => {
    expect(result.current.coupons.customerCoupons.data).toBeDefined()
  })

  return { result, queryClient }
}

describe('useCustomerCoupons', () => {
  beforeEach(() => {
    localStorage.clear()
    resetUserState()
  })

  // ── Query tests ─────────────────────────────────────────────────────

  it('returns no data when user is not authenticated', () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        coupons: useCustomerCoupons(),
      }),
      { configOverrides: authConfig },
    )

    expect(result.current.coupons.customerCoupons.data).toBeUndefined()
    expect(result.current.coupons.customerCoupons.isFetching).toBe(false)
  })

  it('fetches customer coupons after login', async () => {
    const { result } = await setupAuthenticatedCoupons()

    const data = result.current.coupons.customerCoupons.data
    expect(data?.coupons).toHaveLength(2)
    expect(data?.coupons?.[0]?.couponId).toBe('COUPON001')
    expect(data?.coupons?.[0]?.status).toBe('EFFECTIVE')
    expect(data?.coupons?.[1]?.couponId).toBe('COUPON002')
    expect(data?.coupons?.[1]?.notificationOn).toBe(true)
    expect(data?.pagination).toBeDefined()
  })

  it('respects the enabled option', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        coupons: useCustomerCoupons({ enabled: false }),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'test@example.com',
        password: 'secret123',
      })
    })

    expect(result.current.coupons.customerCoupons.data).toBeUndefined()
    expect(result.current.coupons.customerCoupons.isFetching).toBe(false)
  })

  // ── Claim coupon mutation tests ─────────────────────────────────────

  it('claims a coupon', async () => {
    const { result } = await setupAuthenticatedCoupons()

    expect(result.current.coupons.customerCoupons.data?.coupons).toHaveLength(2)

    await act(async () => {
      await result.current.coupons.claimCoupon.mutateAsync('NEW_COUPON')
    })

    // After claiming, refetch should show the new coupon
    await waitFor(() => {
      expect(
        result.current.coupons.customerCoupons.data?.coupons,
      ).toHaveLength(3)
    })
  })

  it('returns the claimed coupon', async () => {
    const { result } = await setupAuthenticatedCoupons()

    let claimed: Awaited<
      ReturnType<typeof result.current.coupons.claimCoupon.mutateAsync>
    > | null = null

    await act(async () => {
      claimed =
        await result.current.coupons.claimCoupon.mutateAsync('PROMO2024')
    })

    expect(claimed).toBeDefined()
    expect(claimed!.couponId).toBe('PROMO2024')
    expect(claimed!.status).toBe('EFFECTIVE')
  })

  // ── Disclaim coupon mutation tests ──────────────────────────────────

  it('disclaims a coupon', async () => {
    const { result } = await setupAuthenticatedCoupons()

    expect(result.current.coupons.customerCoupons.data?.coupons).toHaveLength(2)

    await act(async () => {
      await result.current.coupons.disclaimCoupon.mutateAsync('COUPON001')
    })

    // After disclaiming, refetch should show one fewer coupon
    await waitFor(() => {
      expect(
        result.current.coupons.customerCoupons.data?.coupons,
      ).toHaveLength(1)
    })

    expect(
      result.current.coupons.customerCoupons.data?.coupons?.find(
        (c) => c.couponId === 'COUPON001',
      ),
    ).toBeUndefined()
  })

  // ── Toggle notification mutation tests ──────────────────────────────

  it('toggles coupon notification', async () => {
    const { result } = await setupAuthenticatedCoupons()

    // COUPON002 initially has notificationOn: true
    expect(
      result.current.coupons.customerCoupons.data?.coupons?.find(
        (c) => c.couponId === 'COUPON002',
      )?.notificationOn,
    ).toBe(true)

    await act(async () => {
      await result.current.coupons.toggleCouponNotification.mutateAsync(
        'COUPON002',
      )
    })

    // After toggle, notification should be off
    await waitFor(() => {
      const coupon =
        result.current.coupons.customerCoupons.data?.coupons?.find(
          (c) => c.couponId === 'COUPON002',
        )
      expect(coupon?.notificationOn).toBe(false)
    })
  })
})
