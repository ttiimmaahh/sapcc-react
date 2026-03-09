import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OAuthService, OAuthError, normalizeTokenResponse, isTokenExpired } from '../oauth'
import {
  createTokenData,
  createTokenResponse,
  createExpiredTokenData,
  createAlmostExpiredTokenData,
} from '../../../test/mocks/fixtures/auth'
import type { ResolvedAuthConfig } from '../auth.types'

// ---------------------------------------------------------------------------
// normalizeTokenResponse
// ---------------------------------------------------------------------------

describe('normalizeTokenResponse', () => {
  it('converts snake_case response to camelCase TokenData', () => {
    const raw = createTokenResponse({
      access_token: 'abc123',
      refresh_token: 'def456',
      token_type: 'bearer',
      expires_in: 3600,
      scope: 'basic openid',
    })

    const result = normalizeTokenResponse(raw)

    expect(result.accessToken).toBe('abc123')
    expect(result.refreshToken).toBe('def456')
    expect(result.tokenType).toBe('bearer')
    expect(result.scope).toBe('basic openid')
  })

  it('calculates expiresAt from expires_in', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const raw = createTokenResponse({ expires_in: 7200 })
    const result = normalizeTokenResponse(raw)

    const expectedExpiry = new Date(now + 7200 * 1000).toISOString()
    expect(result.expiresAt).toBe(expectedExpiry)

    vi.useRealTimers()
  })

  it('handles missing refresh_token (client_credentials grant)', () => {
    const raw = createTokenResponse({ refresh_token: undefined })
    const result = normalizeTokenResponse(raw)
    expect(result.refreshToken).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// isTokenExpired
// ---------------------------------------------------------------------------

describe('isTokenExpired', () => {
  it('returns false for a fresh token', () => {
    const token = createTokenData() // expires in 1 hour
    expect(isTokenExpired(token)).toBe(false)
  })

  it('returns true for an expired token', () => {
    const token = createExpiredTokenData() // expired 5 min ago
    expect(isTokenExpired(token)).toBe(true)
  })

  it('returns true for a token within the default margin (10s)', () => {
    const token = createAlmostExpiredTokenData() // 5s left, within 10s margin
    expect(isTokenExpired(token)).toBe(true)
  })

  it('respects custom margin', () => {
    // Token with 5s left, custom margin of 2s — should NOT be expired
    const token = createAlmostExpiredTokenData()
    // Almost expired has ~5s left; with 2s margin it should not be expired
    expect(isTokenExpired(token, 2_000)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// OAuthService
// ---------------------------------------------------------------------------

describe('OAuthService', () => {
  const authConfig: ResolvedAuthConfig = {
    clientId: 'test_client',
    tokenEndpoint: '/authorizationserver/oauth/token',
  }

  let service: OAuthService

  beforeEach(() => {
    service = new OAuthService('https://test.example.com', authConfig)
  })

  describe('login', () => {
    it('sends password grant and returns normalized token', async () => {
      const token = await service.login({
        username: 'user@test.com',
        password: 'secret123',
      })

      expect(token.accessToken).toBe('access_user@test.com')
      expect(token.refreshToken).toBe('refresh_user@test.com')
      expect(token.tokenType).toBe('bearer')
      expect(token.expiresAt).toBeDefined()
    })

    it('throws OAuthError for invalid credentials', async () => {
      await expect(
        service.login({ username: 'user@test.com', password: 'wrong_password' }),
      ).rejects.toThrow(OAuthError)

      try {
        await service.login({ username: 'user@test.com', password: 'wrong_password' })
      } catch (error) {
        expect(error).toBeInstanceOf(OAuthError)
        const oauthError = error as OAuthError
        expect(oauthError.errorCode).toBe('invalid_grant')
        expect(oauthError.statusCode).toBe(400)
        expect(oauthError.isInvalidGrant()).toBe(true)
        expect(oauthError.isInvalidClient()).toBe(false)
      }
    })

    it('includes client_secret when configured', async () => {
      const serviceWithSecret = new OAuthService('https://test.example.com', {
        ...authConfig,
        clientSecret: 'test_secret',
      })

      const token = await serviceWithSecret.login({
        username: 'user@test.com',
        password: 'secret123',
      })

      expect(token.accessToken).toBeDefined()
    })
  })

  describe('clientCredentials', () => {
    it('sends client_credentials grant and returns token without refresh token', async () => {
      const token = await service.clientCredentials()

      expect(token.accessToken).toBe('client_access_token')
      expect(token.tokenType).toBe('bearer')
    })
  })

  describe('refreshAccessToken', () => {
    it('sends refresh_token grant and returns new token', async () => {
      const token = await service.refreshAccessToken('old_refresh_token')

      expect(token.accessToken).toBe('refreshed_access_token')
      expect(token.refreshToken).toBe('refreshed_refresh_token')
    })

    it('throws OAuthError for expired refresh token', async () => {
      await expect(
        service.refreshAccessToken('expired_refresh_token'),
      ).rejects.toThrow(OAuthError)
    })
  })

  describe('revokeToken', () => {
    it('silently succeeds for token revocation', async () => {
      // revokeToken is best-effort — should not throw
      await expect(service.revokeToken('some_token')).resolves.toBeUndefined()
    })

    it('silently handles fetch errors during revocation', async () => {
      // Mock fetch to throw a network error for this specific call
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
        new TypeError('Failed to fetch'),
      )

      await expect(service.revokeToken('some_token')).resolves.toBeUndefined()

      fetchSpy.mockRestore()
    })
  })
})

// ---------------------------------------------------------------------------
// OAuthError
// ---------------------------------------------------------------------------

describe('OAuthError', () => {
  it('has correct name property', () => {
    const error = new OAuthError('invalid_grant', 'Bad credentials', 400)
    expect(error.name).toBe('OAuthError')
  })

  it('inherits from Error', () => {
    const error = new OAuthError('invalid_grant', 'Bad credentials', 400)
    expect(error).toBeInstanceOf(Error)
  })

  it('exposes errorCode and statusCode', () => {
    const error = new OAuthError('invalid_client', 'Bad client credentials', 401)
    expect(error.errorCode).toBe('invalid_client')
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('Bad client credentials')
  })

  it('isInvalidGrant returns true for invalid_grant', () => {
    const error = new OAuthError('invalid_grant', 'Bad credentials', 400)
    expect(error.isInvalidGrant()).toBe(true)
    expect(error.isInvalidClient()).toBe(false)
  })

  it('isInvalidClient returns true for invalid_client', () => {
    const error = new OAuthError('invalid_client', 'Bad client', 401)
    expect(error.isInvalidGrant()).toBe(false)
    expect(error.isInvalidClient()).toBe(true)
  })
})
