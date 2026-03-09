import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useAuth } from '../../auth/useAuth'
import { useUserProfile } from '../useUserProfile'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import { resetUserState } from '../../../test/mocks/handlers/user'
import type { SapccConfig } from '../../provider'
import type { User } from '../../auth/auth.types'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

/**
 * Install a stateful GET /users/current handler that can be mutated.
 * This replaces the auth module's static handler so the user profile
 * query reflects PATCH mutations during tests.
 */
function installStatefulUserHandler(initial: User) {
  let user = { ...initial }

  server.use(
    // GET — return current state
    http.get(
      'https://test.example.com/occ/v2/test-site/users/current',
      ({ request }) => {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
          return HttpResponse.json(
            { errors: [{ type: 'InvalidTokenError', message: 'Invalid access token.' }] },
            { status: 401 },
          )
        }
        return HttpResponse.json(user)
      },
    ),
    // PATCH — update state and return
    http.patch(
      'https://test.example.com/occ/v2/test-site/users/current',
      async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        const newFirstName = (body.firstName as string | undefined) ?? user.firstName ?? ''
        const newLastName = (body.lastName as string | undefined) ?? user.lastName ?? ''
        user = {
          ...user,
          firstName: newFirstName,
          lastName: newLastName,
          titleCode: (body.titleCode as string | undefined) ?? user.titleCode,
          name: `${newFirstName} ${newLastName}`,
        }
        return HttpResponse.json(user)
      },
    ),
  )

  return { getUser: () => user }
}

/** Helper: render both auth and user profile hooks, then login */
async function setupAuthenticatedProfile(options?: Parameters<typeof useUserProfile>[0]) {
  const { result, queryClient } = renderHookWithProviders(
    () => ({
      auth: useAuth(),
      profile: useUserProfile(options),
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

  // Wait for profile query to settle
  await waitFor(() => {
    expect(result.current.profile.profile.data).toBeDefined()
  })

  return { result, queryClient }
}

describe('useUserProfile', () => {
  beforeEach(() => {
    localStorage.clear()
    resetUserState()
  })

  // ── Query tests ─────────────────────────────────────────────────────

  it('returns no data when user is not authenticated', () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        profile: useUserProfile(),
      }),
      { configOverrides: authConfig },
    )

    expect(result.current.profile.profile.data).toBeUndefined()
    expect(result.current.profile.profile.isFetching).toBe(false)
  })

  it('fetches user profile after login', async () => {
    const { result } = await setupAuthenticatedProfile()

    expect(result.current.profile.profile.data?.uid).toBe('test@example.com')
    expect(result.current.profile.profile.data?.firstName).toBe('Test')
    expect(result.current.profile.profile.data?.lastName).toBe('User')
  })

  it('respects the enabled option', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        profile: useUserProfile({ enabled: false }),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'test@example.com',
        password: 'secret123',
      })
    })

    // Even after login, query should not fetch because enabled: false
    expect(result.current.profile.profile.data).toBeUndefined()
    expect(result.current.profile.profile.isFetching).toBe(false)
  })

  // ── Update profile mutation tests ───────────────────────────────────

  it('updates user profile successfully', async () => {
    installStatefulUserHandler({
      uid: 'test@example.com',
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
    })

    const { result } = await setupAuthenticatedProfile()

    await act(async () => {
      await result.current.profile.updateProfile.mutateAsync({
        firstName: 'Jane',
        lastName: 'Doe',
      })
    })

    // Profile should have been invalidated and refetched with updated data
    await waitFor(() => {
      expect(result.current.profile.profile.data?.firstName).toBe('Jane')
    })

    expect(result.current.profile.profile.data?.lastName).toBe('Doe')
  })

  it('syncs updated profile to auth context', async () => {
    const { result } = await setupAuthenticatedProfile()

    await act(async () => {
      await result.current.profile.updateProfile.mutateAsync({
        firstName: 'Updated',
        lastName: 'Name',
      })
    })

    // The onSuccess handler should have called setUser() to update auth context
    await waitFor(() => {
      expect(result.current.auth.user?.firstName).toBe('Updated')
    })

    expect(result.current.auth.user?.lastName).toBe('Name')
  })

  // ── Change password mutation tests ──────────────────────────────────

  it('changes password successfully', async () => {
    const { result } = await setupAuthenticatedProfile()

    let succeeded = false

    await act(async () => {
      await result.current.profile.changePassword.mutateAsync({
        oldPassword: 'secret123',
        newPassword: 'newSecret456',
      })
      succeeded = true
    })

    expect(succeeded).toBe(true)
  })

  it('rejects wrong old password', async () => {
    const { result } = await setupAuthenticatedProfile()

    let errorCaught = false

    await act(async () => {
      try {
        await result.current.profile.changePassword.mutateAsync({
          oldPassword: 'wrong_password',
          newPassword: 'newSecret456',
        })
      } catch {
        errorCaught = true
      }
    })

    expect(errorCaught).toBe(true)
  })

  // ── Close account mutation tests ────────────────────────────────────

  it('closes account and logs out', async () => {
    const { result } = await setupAuthenticatedProfile()

    expect(result.current.auth.isAuthenticated).toBe(true)

    await act(async () => {
      await result.current.profile.closeAccount.mutateAsync()
    })

    // Should have logged out after closing the account
    await waitFor(() => {
      expect(result.current.auth.isAuthenticated).toBe(false)
    })
  })

  // ── Fields parameter test ───────────────────────────────────────────

  it('passes fields parameter to the API', async () => {
    let capturedFields: string | null = null

    server.use(
      http.get(
        'https://test.example.com/occ/v2/test-site/users/current',
        ({ request }) => {
          const url = new URL(request.url)
          capturedFields = url.searchParams.get('fields')

          return HttpResponse.json({
            uid: 'test@example.com',
            name: 'Test User',
            firstName: 'Test',
            lastName: 'User',
          })
        },
      ),
    )

    await setupAuthenticatedProfile({ fields: 'FULL' })

    expect(capturedFields).toBe('FULL')
  })
})
