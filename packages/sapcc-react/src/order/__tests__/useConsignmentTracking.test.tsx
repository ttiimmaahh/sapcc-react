import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { useAuth } from '../../auth/useAuth'
import { useConsignmentTracking } from '../useConsignmentTracking'
import { renderHookWithProviders } from '../../../test/test-utils'
import { resetOrderState } from '../../../test/mocks/handlers/orders'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

describe('useConsignmentTracking', () => {
  beforeEach(() => {
    localStorage.clear()
    resetOrderState()
  })

  it('returns no data when user is not authenticated', () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        tracking: useConsignmentTracking('ORDER-001', 'CONS-001'),
      }),
      { configOverrides: authConfig },
    )

    expect(result.current.tracking.data).toBeUndefined()
    expect(result.current.tracking.isFetching).toBe(false)
  })

  it('fetches tracking info after login', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        tracking: useConsignmentTracking('ORDER-001', 'CONS-001'),
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

    // Wait for tracking data
    await waitFor(() => {
      expect(result.current.tracking.data).toBeDefined()
    })

    const tracking = result.current.tracking.data
    expect(tracking?.carrierCode).toBe('UPS')
    expect(tracking?.trackingID).toBeDefined()
    expect(tracking?.trackingUrl).toBeDefined()
    expect(tracking?.trackingEvents).toHaveLength(4)
  })

  it('returns tracking events with expected fields', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        tracking: useConsignmentTracking('ORDER-001', 'CONS-001'),
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
      expect(result.current.tracking.data).toBeDefined()
    })

    const firstEvent = result.current.tracking.data?.trackingEvents?.[0]
    expect(firstEvent?.detail).toBe('Package delivered')
    expect(firstEvent?.eventDate).toBeDefined()
    expect(firstEvent?.location).toBeDefined()
  })

  it('is disabled when orderCode is empty', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        tracking: useConsignmentTracking('', 'CONS-001'),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'test@example.com',
        password: 'secret123',
      })
    })

    expect(result.current.tracking.data).toBeUndefined()
    expect(result.current.tracking.isFetching).toBe(false)
  })

  it('is disabled when consignmentCode is empty', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        tracking: useConsignmentTracking('ORDER-001', ''),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'test@example.com',
        password: 'secret123',
      })
    })

    expect(result.current.tracking.data).toBeUndefined()
    expect(result.current.tracking.isFetching).toBe(false)
  })

  it('respects the enabled option', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        tracking: useConsignmentTracking('ORDER-001', 'CONS-001', {
          enabled: false,
        }),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'test@example.com',
        password: 'secret123',
      })
    })

    expect(result.current.tracking.data).toBeUndefined()
    expect(result.current.tracking.isFetching).toBe(false)
  })
})
