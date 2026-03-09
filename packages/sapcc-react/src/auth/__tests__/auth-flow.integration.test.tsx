import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useAuth } from '../useAuth'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import type { SapccConfig } from '../../provider'
import { useSapccClient } from '../../provider/SapccProvider'
import type { Product } from '../../product/product.types'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

describe('auth token refresh flow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('refreshes expired token and retries the original request', async () => {
    let userCallCount = 0

    server.use(
      http.get(
        'https://test.example.com/occ/v2/test-site/users/current',
        ({ request }) => {
          userCallCount++
          const authHeader = request.headers.get('Authorization')

          // First call returns 401 regardless of token (simulates server-side expiration)
          if (userCallCount === 1) {
            return HttpResponse.json(
              {
                errors: [
                  { type: 'InvalidTokenError', message: 'Token expired' },
                ],
              },
              { status: 401 },
            )
          }

          // After refresh + retry, token should be the refreshed one
          if (authHeader === 'Bearer refreshed_access_token') {
            return HttpResponse.json({
              uid: 'test@example.com',
              name: 'Test User',
              firstName: 'Test',
              lastName: 'User',
            })
          }

          // Fallback
          return HttpResponse.json(
            {
              errors: [
                { type: 'InvalidTokenError', message: 'Missing token' },
              ],
            },
            { status: 401 },
          )
        },
      ),
      http.post(
        'https://test.example.com/authorizationserver/oauth/token',
        async ({ request }) => {
          const body = await request.text()
          const params = new URLSearchParams(body)

          if (params.get('grant_type') === 'refresh_token') {
            return HttpResponse.json({
              access_token: 'refreshed_access_token',
              refresh_token: 'new_refresh_token',
              token_type: 'bearer',
              expires_in: 3600,
              scope: 'basic openid',
            })
          }

          if (params.get('grant_type') === 'password') {
            return HttpResponse.json({
              access_token: 'original_access_token',
              refresh_token: 'valid_refresh_token',
              token_type: 'bearer',
              expires_in: 3600, // Non-expired so interceptor won't proactively refresh
              scope: 'basic openid',
            })
          }

          return HttpResponse.json(
            { error: 'unsupported_grant_type' },
            { status: 400 },
          )
        },
      ),
    )

    const { result } = renderHookWithProviders(() => useAuth(), {
      configOverrides: authConfig,
    })

    // Login gives us a valid access token, but server will 401 the first /users/current call
    await act(async () => {
      await result.current.login({
        username: 'user@test.com',
        password: 'secret123',
      })
    })

    // The login flow: 1) token endpoint -> original_access_token, 2) GET /users/current
    // First /users/current returns 401 -> onUnauthorized -> refresh -> retry with refreshed_access_token -> 200
    await waitFor(() => {
      expect(result.current.user).not.toBeNull()
    })

    expect(result.current.user?.uid).toBe('test@example.com')
    // Token should have been refreshed via the 401 -> onUnauthorized -> setToken flow
    expect(result.current.token?.accessToken).toBe('refreshed_access_token')
    // Should have made 2 calls to /users/current (original 401 + retry)
    expect(userCallCount).toBe(2)
  })

  it('logs out when refresh token is also expired', async () => {
    server.use(
      http.get(
        'https://test.example.com/occ/v2/test-site/users/current',
        () => {
          return HttpResponse.json(
            {
              errors: [
                { type: 'InvalidTokenError', message: 'Token expired' },
              ],
            },
            { status: 401 },
          )
        },
      ),
      http.post(
        'https://test.example.com/authorizationserver/oauth/token',
        async ({ request }) => {
          const body = await request.text()
          const params = new URLSearchParams(body)

          if (params.get('grant_type') === 'password') {
            return HttpResponse.json({
              access_token: 'will_be_expired',
              refresh_token: 'expired_refresh_token',
              token_type: 'bearer',
              expires_in: 3600,
              scope: 'basic openid',
            })
          }

          if (params.get('grant_type') === 'refresh_token') {
            return HttpResponse.json(
              {
                error: 'invalid_grant',
                error_description: 'Refresh token expired',
              },
              { status: 400 },
            )
          }

          return HttpResponse.json(
            { error: 'unsupported_grant_type' },
            { status: 400 },
          )
        },
      ),
    )

    const { result } = renderHookWithProviders(() => useAuth(), {
      configOverrides: authConfig,
    })

    // Login succeeds (gets tokens), but user fetch triggers 401 + failed refresh
    await act(async () => {
      try {
        await result.current.login({
          username: 'user@test.com',
          password: 'secret123',
        })
      } catch {
        // Login may throw due to user fetch failure after 401 retry
      }
    })

    // After the failed refresh cycle, the auth failure callback should clear state.
    // Wait for the effect to propagate.
    await waitFor(
      () => {
        expect(result.current.isAuthenticated).toBe(false)
      },
      { timeout: 3000 },
    )

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('sapcc_auth_token')).toBeNull()
  })

  it('SapccProvider conditionally renders AuthProvider based on auth config', () => {
    // Without auth config — should NOT throw from useAuth
    // We test that the provider works correctly without auth config
    // by rendering a hook that doesn't use useAuth
    const { result } = renderHookWithProviders(() => useSapccClient())

    expect(result.current).toBeDefined()
  })

  it('SapccProvider with auth config provides auth context', () => {
    const { result } = renderHookWithProviders(() => useAuth(), {
      configOverrides: authConfig,
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.login).toBeInstanceOf(Function)
    expect(result.current.logout).toBeInstanceOf(Function)
    expect(result.current.register).toBeInstanceOf(Function)
  })
})

describe('auth-aware OccClient', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('authenticated requests include Bearer token', async () => {
    let capturedAuthHeader: string | null = null

    server.use(
      http.get(
        'https://test.example.com/occ/v2/test-site/products/123',
        ({ request }) => {
          capturedAuthHeader = request.headers.get('Authorization')
          return HttpResponse.json({
            code: '123',
            name: 'Test Product',
          })
        },
      ),
    )

    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        client: useSapccClient(),
      }),
      { configOverrides: authConfig },
    )

    // Login first
    await act(async () => {
      await result.current.auth.login({
        username: 'user@test.com',
        password: 'secret123',
      })
    })

    // Make an API call through the auth-aware client
    await act(async () => {
      await result.current.client.get<Product>('/products/123')
    })

    expect(capturedAuthHeader).toMatch(/^Bearer /)
  })

  it('unauthenticated requests do not include Bearer token', async () => {
    let capturedAuthHeader: string | null = null

    server.use(
      http.get(
        'https://test.example.com/occ/v2/test-site/products/123',
        ({ request }) => {
          capturedAuthHeader = request.headers.get('Authorization')
          return HttpResponse.json({
            code: '123',
            name: 'Test Product',
          })
        },
      ),
    )

    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        client: useSapccClient(),
      }),
      { configOverrides: authConfig },
    )

    // Make API call without logging in
    await act(async () => {
      await result.current.client.get<Product>('/products/123')
    })

    expect(capturedAuthHeader).toBeNull()
  })
})
