import type { OccRequestConfig, Interceptor } from '../http/types'
import type { TokenData, TokenStorage, AuthFailureCallback } from './auth.types'
import type { OAuthService } from './oauth'
import { isTokenExpired } from './oauth'

/**
 * Configuration for the token interceptor.
 */
export interface TokenInterceptorConfig {
  /** Token storage adapter */
  storage: TokenStorage
  /** OAuth service for token refresh */
  oauthService: OAuthService
  /** Callback when auth fails irrecoverably (refresh token expired) */
  onAuthFailure?: AuthFailureCallback
}

/**
 * Token interceptor for OCC API requests.
 *
 * Responsibilities:
 * 1. Injects Bearer token into outgoing request headers
 * 2. Proactively refreshes expired tokens before sending requests
 * 3. Handles 401 responses by refreshing and retrying (single-refresh-promise pattern)
 * 4. Queues concurrent requests during refresh to avoid duplicate refresh calls
 *
 * The single-refresh-promise pattern works as follows:
 * - When a 401 occurs (or token is expired), the first caller initiates a refresh
 * - Concurrent callers that also hit 401 wait on the SAME refresh promise
 * - Once refresh completes, all queued callers get the new token
 * - If refresh fails, all callers are rejected and onAuthFailure is called
 */
export class TokenInterceptor {
  private readonly storage: TokenStorage
  private readonly oauthService: OAuthService
  private readonly onAuthFailure?: AuthFailureCallback

  /** Single refresh promise — prevents duplicate concurrent refreshes */
  private refreshPromise: Promise<TokenData> | null = null

  constructor(config: TokenInterceptorConfig) {
    this.storage = config.storage
    this.oauthService = config.oauthService
    this.onAuthFailure = config.onAuthFailure
  }

  /**
   * Returns a request interceptor function compatible with OccClient.
   * This interceptor adds the Bearer token header to outgoing requests
   * and proactively refreshes expired tokens.
   */
  createRequestInterceptor(): Interceptor {
    return async (config: OccRequestConfig): Promise<OccRequestConfig> => {
      const token = this.storage.getToken()

      if (!token) {
        return config
      }

      // Proactively refresh if token is expired or about to expire
      let activeToken = token
      if (isTokenExpired(token)) {
        try {
          activeToken = await this.refreshToken(token)
        } catch {
          // Refresh failed — proceed without token, let the 401 handler deal with it
          return config
        }
      }

      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${activeToken.accessToken}`,
        },
      }
    }
  }

  /**
   * Handles a 401 error by refreshing the token and returning a new token.
   * Uses the single-refresh-promise pattern to deduplicate concurrent refreshes.
   *
   * @returns New token data if refresh succeeds, null if refresh fails
   */
  async handleUnauthorized(): Promise<TokenData | null> {
    const token = this.storage.getToken()

    if (!token?.refreshToken) {
      this.onAuthFailure?.()
      return null
    }

    try {
      return await this.refreshToken(token)
    } catch {
      this.storage.removeToken()
      this.onAuthFailure?.()
      return null
    }
  }

  /**
   * Refreshes the token using the single-promise pattern.
   * If a refresh is already in-flight, returns the existing promise.
   */
  private async refreshToken(token: TokenData): Promise<TokenData> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    if (!token.refreshToken) {
      throw new Error('No refresh token available')
    }

    this.refreshPromise = this.oauthService
      .refreshAccessToken(token.refreshToken)
      .then((newToken) => {
        this.storage.setToken(newToken)
        return newToken
      })
      .finally(() => {
        this.refreshPromise = null
      })

    return this.refreshPromise
  }
}
