import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useAuth } from '../useAuth'
import { useUser } from '../useUser'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

describe('useUser', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns no data when user is not authenticated', () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        user: useUser(),
      }),
      { configOverrides: authConfig },
    )

    // Query should be disabled (not fetching) when not authenticated
    expect(result.current.user.data).toBeUndefined()
    expect(result.current.user.isFetching).toBe(false)
  })

  it('fetches user profile after login', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        user: useUser(),
      }),
      { configOverrides: authConfig },
    )

    // Login
    await act(async () => {
      await result.current.auth.login({
        username: 'user@test.com',
        password: 'secret123',
      })
    })

    // Wait for user profile to load
    await waitFor(() => {
      expect(result.current.user.data).toBeDefined()
    })

    expect(result.current.user.data?.uid).toBe('test@example.com')
    expect(result.current.user.data?.name).toBe('Test User')
  })

  it('respects the enabled option', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        user: useUser({ enabled: false }),
      }),
      { configOverrides: authConfig },
    )

    // Login
    await act(async () => {
      await result.current.auth.login({
        username: 'user@test.com',
        password: 'secret123',
      })
    })

    // Even after login, query should not fetch because enabled: false
    expect(result.current.user.data).toBeUndefined()
    expect(result.current.user.isFetching).toBe(false)
  })

  it('syncs user data to auth context', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        user: useUser(),
      }),
      { configOverrides: authConfig },
    )

    // Login
    await act(async () => {
      await result.current.auth.login({
        username: 'user@test.com',
        password: 'secret123',
      })
    })

    // Wait for both hooks to settle
    await waitFor(() => {
      expect(result.current.user.data).toBeDefined()
    })

    // Auth context user should match useUser data
    expect(result.current.auth.user?.uid).toBe('test@example.com')
  })

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

    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        user: useUser({ fields: 'FULL' }),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'user@test.com',
        password: 'secret123',
      })
    })

    await waitFor(() => {
      expect(result.current.user.data).toBeDefined()
    })

    // The last call to /users/current should have fields=FULL
    // (login also calls /users/current with fields=DEFAULT, but the useUser
    // hook call with FULL should also be made)
    expect(capturedFields).toBe('FULL')
  })
})
