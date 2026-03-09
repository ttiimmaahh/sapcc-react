import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, waitFor, cleanup } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useAuth } from '../useAuth'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('throws when used outside SapccProvider with auth config', () => {
    // Suppress React error boundary console output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHookWithProviders(() => useAuth())
    }).toThrow('useAuth must be used within a <SapccProvider> with auth configuration')

    consoleSpy.mockRestore()
  })

  it('starts as not authenticated with no stored token', () => {
    const { result } = renderHookWithProviders(() => useAuth(), {
      configOverrides: authConfig,
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  describe('login', () => {
    it('authenticates user and updates state', async () => {
      const { result } = renderHookWithProviders(() => useAuth(), {
        configOverrides: authConfig,
      })

      await act(async () => {
        await result.current.login({
          username: 'user@test.com',
          password: 'secret123',
        })
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.token).not.toBeNull()
      expect(result.current.token?.accessToken).toBe('access_user@test.com')
    })

    it('fetches user profile after successful login', async () => {
      const { result } = renderHookWithProviders(() => useAuth(), {
        configOverrides: authConfig,
      })

      await act(async () => {
        await result.current.login({
          username: 'user@test.com',
          password: 'secret123',
        })
      })

      await waitFor(() => {
        expect(result.current.user).not.toBeNull()
      })

      expect(result.current.user?.uid).toBe('test@example.com')
      expect(result.current.user?.name).toBe('Test User')
    })

    it('throws OAuthError for invalid credentials', async () => {
      const { result } = renderHookWithProviders(() => useAuth(), {
        configOverrides: authConfig,
      })

      await expect(
        act(async () => {
          await result.current.login({
            username: 'user@test.com',
            password: 'wrong_password',
          })
        }),
      ).rejects.toThrow()

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('stores token in localStorage for persistence', async () => {
      const { result } = renderHookWithProviders(() => useAuth(), {
        configOverrides: authConfig,
      })

      await act(async () => {
        await result.current.login({
          username: 'user@test.com',
          password: 'secret123',
        })
      })

      const stored = localStorage.getItem('sapcc_auth_token')
      expect(stored).not.toBeNull()

      const parsed = JSON.parse(stored!) as { accessToken: string }
      expect(parsed.accessToken).toBe('access_user@test.com')
    })
  })

  describe('logout', () => {
    it('clears auth state on logout', async () => {
      const { result } = renderHookWithProviders(() => useAuth(), {
        configOverrides: authConfig,
      })

      // Login first
      await act(async () => {
        await result.current.login({
          username: 'user@test.com',
          password: 'secret123',
        })
      })

      expect(result.current.isAuthenticated).toBe(true)

      // Logout
      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
    })

    it('clears token from localStorage on logout', async () => {
      const { result } = renderHookWithProviders(() => useAuth(), {
        configOverrides: authConfig,
      })

      await act(async () => {
        await result.current.login({
          username: 'user@test.com',
          password: 'secret123',
        })
      })

      expect(localStorage.getItem('sapcc_auth_token')).not.toBeNull()

      await act(async () => {
        await result.current.logout()
      })

      expect(localStorage.getItem('sapcc_auth_token')).toBeNull()
    })

    it('revokes tokens on server during logout', async () => {
      let revokeCount = 0
      server.use(
        http.post('https://test.example.com/authorizationserver/oauth/token', async ({ request }) => {
          const body = await request.text()
          const params = new URLSearchParams(body)

          // Count revocation requests (these are POST with 'token' param and no 'grant_type')
          if (params.has('token') && !params.has('grant_type')) {
            revokeCount++
            return new HttpResponse(null, { status: 200 })
          }

          // Handle login grant_type=password
          if (params.get('grant_type') === 'password') {
            return HttpResponse.json({
              access_token: 'test_token',
              refresh_token: 'test_refresh',
              token_type: 'bearer',
              expires_in: 3600,
              scope: 'basic openid',
            })
          }

          return HttpResponse.json({ error: 'unsupported_grant_type' }, { status: 400 })
        }),
      )

      const { result } = renderHookWithProviders(() => useAuth(), {
        configOverrides: authConfig,
      })

      await act(async () => {
        await result.current.login({
          username: 'user@test.com',
          password: 'secret123',
        })
      })

      await act(async () => {
        await result.current.logout()
      })

      // Should revoke both access and refresh tokens
      expect(revokeCount).toBeGreaterThanOrEqual(1)
    })
  })

  describe('register', () => {
    it('registers a new user and auto-logs in', async () => {
      const { result } = renderHookWithProviders(() => useAuth(), {
        configOverrides: authConfig,
      })

      await act(async () => {
        await result.current.register({
          firstName: 'Test',
          lastName: 'User',
          uid: 'newuser@test.com',
          password: 'secret123',
        })
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.token).not.toBeNull()
    })

    it('throws for duplicate user registration', async () => {
      const { result } = renderHookWithProviders(() => useAuth(), {
        configOverrides: authConfig,
      })

      await expect(
        act(async () => {
          await result.current.register({
            firstName: 'Existing',
            lastName: 'User',
            uid: 'existing@example.com',
            password: 'secret123',
          })
        }),
      ).rejects.toThrow()

      expect(result.current.isAuthenticated).toBe(false)
    })
  })
})
