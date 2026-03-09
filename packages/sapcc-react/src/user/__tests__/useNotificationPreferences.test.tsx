import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { useAuth } from '../../auth/useAuth'
import { useNotificationPreferences } from '../useNotificationPreferences'
import { renderHookWithProviders } from '../../../test/test-utils'
import { resetUserState } from '../../../test/mocks/handlers/user'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

/** Helper: render both auth and notification preferences hooks, then login */
async function setupAuthenticatedNotifications(
  options?: Parameters<typeof useNotificationPreferences>[0],
) {
  const { result, queryClient } = renderHookWithProviders(
    () => ({
      auth: useAuth(),
      notifications: useNotificationPreferences(options),
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

  // Wait for notification preferences query to settle
  await waitFor(() => {
    expect(
      result.current.notifications.notificationPreferences.data,
    ).toBeDefined()
  })

  return { result, queryClient }
}

describe('useNotificationPreferences', () => {
  beforeEach(() => {
    localStorage.clear()
    resetUserState()
  })

  // ── Query tests ─────────────────────────────────────────────────────

  it('returns no data when user is not authenticated', () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        notifications: useNotificationPreferences(),
      }),
      { configOverrides: authConfig },
    )

    expect(
      result.current.notifications.notificationPreferences.data,
    ).toBeUndefined()
    expect(
      result.current.notifications.notificationPreferences.isFetching,
    ).toBe(false)
  })

  it('fetches notification preferences after login', async () => {
    const { result } = await setupAuthenticatedNotifications()

    const data = result.current.notifications.notificationPreferences.data
    expect(data).toHaveLength(3)
    expect(data?.[0]?.channel).toBe('EMAIL')
    expect(data?.[0]?.enabled).toBe(true)
    expect(data?.[1]?.channel).toBe('SMS')
    expect(data?.[1]?.enabled).toBe(false)
    expect(data?.[2]?.channel).toBe('SITE_MESSAGE')
    expect(data?.[2]?.enabled).toBe(false)
  })

  it('respects the enabled option', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        notifications: useNotificationPreferences({ enabled: false }),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'test@example.com',
        password: 'secret123',
      })
    })

    expect(
      result.current.notifications.notificationPreferences.data,
    ).toBeUndefined()
    expect(
      result.current.notifications.notificationPreferences.isFetching,
    ).toBe(false)
  })

  // ── Update preferences mutation tests ───────────────────────────────

  it('updates notification preferences', async () => {
    const { result } = await setupAuthenticatedNotifications()

    // Initially SMS is disabled
    expect(
      result.current.notifications.notificationPreferences.data?.find(
        (p) => p.channel === 'SMS',
      )?.enabled,
    ).toBe(false)

    await act(async () => {
      await result.current.notifications.updatePreferences.mutateAsync([
        { channel: 'EMAIL', value: 'test@example.com', enabled: true },
        { channel: 'SMS', value: '+15551234567', enabled: true },
        { channel: 'SITE_MESSAGE', value: '', enabled: false },
      ])
    })

    // After mutation settles, the preferences should be invalidated and refetched
    await waitFor(() => {
      const sms =
        result.current.notifications.notificationPreferences.data?.find(
          (p) => p.channel === 'SMS',
        )
      expect(sms?.enabled).toBe(true)
    })
  })

  it('can disable all channels', async () => {
    const { result } = await setupAuthenticatedNotifications()

    await act(async () => {
      await result.current.notifications.updatePreferences.mutateAsync([
        { channel: 'EMAIL', value: 'test@example.com', enabled: false },
        { channel: 'SMS', value: '+15551234567', enabled: false },
        { channel: 'SITE_MESSAGE', value: '', enabled: false },
      ])
    })

    await waitFor(() => {
      const data = result.current.notifications.notificationPreferences.data
      expect(data?.every((p) => !p.enabled)).toBe(true)
    })
  })
})
