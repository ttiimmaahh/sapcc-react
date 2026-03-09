import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TokenInterceptor } from '../token-interceptor'
import { InMemoryTokenStorage } from '../token-storage'
import { OAuthService } from '../oauth'
import {
  createTokenData,
  createExpiredTokenData,
} from '../../../test/mocks/fixtures/auth'
import type { OccRequestConfig } from '../../http/types'
import type { ResolvedAuthConfig } from '../auth.types'

const authConfig: ResolvedAuthConfig = {
  clientId: 'test_client',
  tokenEndpoint: '/authorizationserver/oauth/token',
}

function createBaseConfig(): OccRequestConfig {
  return {
    method: 'GET',
    path: '/products/search',
    headers: { Accept: 'application/json' },
  }
}

describe('TokenInterceptor', () => {
  let storage: InMemoryTokenStorage
  let oauthService: OAuthService
  let interceptor: TokenInterceptor

  beforeEach(() => {
    storage = new InMemoryTokenStorage()
    oauthService = new OAuthService('https://test.example.com', authConfig)
    interceptor = new TokenInterceptor({
      storage,
      oauthService,
    })
  })

  describe('createRequestInterceptor', () => {
    it('passes through config unchanged when no token is stored', async () => {
      const fn = interceptor.createRequestInterceptor()
      const config = createBaseConfig()

      const result = await fn(config)

      expect(result.headers?.Authorization).toBeUndefined()
    })

    it('adds Bearer token header when token is available', async () => {
      const token = createTokenData({ accessToken: 'my_access_token' })
      storage.setToken(token)

      const fn = interceptor.createRequestInterceptor()
      const config = createBaseConfig()

      const result = await fn(config)

      expect(result.headers?.Authorization).toBe('Bearer my_access_token')
    })

    it('preserves existing headers when adding auth', async () => {
      const token = createTokenData({ accessToken: 'test_token' })
      storage.setToken(token)

      const fn = interceptor.createRequestInterceptor()
      const config: OccRequestConfig = {
        ...createBaseConfig(),
        headers: { 'X-Custom': 'value', Accept: 'application/json' },
      }

      const result = await fn(config)

      expect(result.headers?.['X-Custom']).toBe('value')
      expect(result.headers?.Accept).toBe('application/json')
      expect(result.headers?.Authorization).toBe('Bearer test_token')
    })

    it('proactively refreshes expired token before request', async () => {
      const expiredToken = createExpiredTokenData({
        refreshToken: 'old_refresh_token',
      })
      storage.setToken(expiredToken)

      const fn = interceptor.createRequestInterceptor()
      const config = createBaseConfig()

      const result = await fn(config)

      // Should have the refreshed token
      expect(result.headers?.Authorization).toBe('Bearer refreshed_access_token')

      // Storage should be updated
      const updatedToken = storage.getToken()
      expect(updatedToken?.accessToken).toBe('refreshed_access_token')
    })

    it('proceeds without token if proactive refresh fails', async () => {
      const expiredToken = createExpiredTokenData({
        refreshToken: 'expired_refresh_token', // MSW handler will reject this
      })
      storage.setToken(expiredToken)

      const fn = interceptor.createRequestInterceptor()
      const config = createBaseConfig()

      const result = await fn(config)

      // Should pass through without Authorization header
      expect(result.headers?.Authorization).toBeUndefined()
    })
  })

  describe('handleUnauthorized', () => {
    it('returns null when no token is stored', async () => {
      const result = await interceptor.handleUnauthorized()
      expect(result).toBeNull()
    })

    it('returns null and calls onAuthFailure when no refresh token', async () => {
      const onAuthFailure = vi.fn()
      interceptor = new TokenInterceptor({
        storage,
        oauthService,
        onAuthFailure,
      })

      const tokenWithoutRefresh = createTokenData({ refreshToken: undefined })
      storage.setToken(tokenWithoutRefresh)

      const result = await interceptor.handleUnauthorized()

      expect(result).toBeNull()
      expect(onAuthFailure).toHaveBeenCalledOnce()
    })

    it('refreshes token and returns new token data', async () => {
      const token = createTokenData({ refreshToken: 'old_refresh_token' })
      storage.setToken(token)

      const result = await interceptor.handleUnauthorized()

      expect(result).not.toBeNull()
      expect(result?.accessToken).toBe('refreshed_access_token')
      expect(result?.refreshToken).toBe('refreshed_refresh_token')
    })

    it('updates storage with refreshed token', async () => {
      const token = createTokenData({ refreshToken: 'old_refresh_token' })
      storage.setToken(token)

      await interceptor.handleUnauthorized()

      const stored = storage.getToken()
      expect(stored?.accessToken).toBe('refreshed_access_token')
    })

    it('clears storage and calls onAuthFailure when refresh fails', async () => {
      const onAuthFailure = vi.fn()
      interceptor = new TokenInterceptor({
        storage,
        oauthService,
        onAuthFailure,
      })

      const token = createTokenData({ refreshToken: 'expired_refresh_token' })
      storage.setToken(token)

      const result = await interceptor.handleUnauthorized()

      expect(result).toBeNull()
      expect(onAuthFailure).toHaveBeenCalledOnce()
      expect(storage.getToken()).toBeNull()
    })
  })

  describe('single-refresh-promise deduplication', () => {
    it('deduplicates concurrent refresh calls', async () => {
      const refreshSpy = vi.spyOn(oauthService, 'refreshAccessToken')

      const token = createTokenData({ refreshToken: 'old_refresh_token' })
      storage.setToken(token)

      // Fire multiple concurrent handleUnauthorized calls
      const results = await Promise.all([
        interceptor.handleUnauthorized(),
        interceptor.handleUnauthorized(),
        interceptor.handleUnauthorized(),
      ])

      // All should return the same refreshed token
      for (const result of results) {
        expect(result?.accessToken).toBe('refreshed_access_token')
      }

      // But refreshAccessToken should only have been called ONCE
      expect(refreshSpy).toHaveBeenCalledTimes(1)
    })
  })
})
