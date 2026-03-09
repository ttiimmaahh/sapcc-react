import type {
  OAuthTokenResponse,
  TokenData,
  LoginCredentials,
  ResolvedAuthConfig,
} from './auth.types'

/**
 * Converts a raw OAuth2 token response into normalized TokenData.
 * Calculates the absolute expiration timestamp from expires_in.
 */
export function normalizeTokenResponse(raw: OAuthTokenResponse): TokenData {
  const expiresAt = new Date(Date.now() + raw.expires_in * 1000).toISOString()

  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    tokenType: raw.token_type,
    expiresAt,
    scope: raw.scope,
  }
}

/**
 * Checks whether a token has expired (or will expire within a safety margin).
 *
 * @param token - Token data to check
 * @param marginMs - Safety margin in milliseconds (default: 10 seconds)
 * @returns true if the token is expired or will expire within the margin
 */
export function isTokenExpired(token: TokenData, marginMs = 10_000): boolean {
  return Date.now() >= new Date(token.expiresAt).getTime() - marginMs
}

/**
 * OAuth2 service for SAP Commerce Cloud.
 *
 * Handles raw HTTP calls to the token endpoint using native fetch.
 * The token endpoint uses `application/x-www-form-urlencoded` content type,
 * which is different from the JSON-based OCC API — hence this does not use OccClient.
 */
export class OAuthService {
  private readonly baseUrl: string
  private readonly authConfig: ResolvedAuthConfig

  constructor(baseUrl: string, authConfig: ResolvedAuthConfig) {
    this.baseUrl = baseUrl
    this.authConfig = authConfig
  }

  /**
   * Authenticates a user with username and password (Resource Owner Password Grant).
   *
   * @param credentials - Username and password
   * @returns Normalized token data
   * @throws Error if the token request fails
   */
  async login(credentials: LoginCredentials): Promise<TokenData> {
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: this.authConfig.clientId,
      username: credentials.username,
      password: credentials.password,
    })

    if (this.authConfig.clientSecret) {
      params.set('client_secret', this.authConfig.clientSecret)
    }

    return this.requestToken(params)
  }

  /**
   * Obtains a client credentials token (no user context).
   * Used for anonymous API access that still requires authentication.
   *
   * @returns Normalized token data (no refresh token)
   * @throws Error if the token request fails
   */
  async clientCredentials(): Promise<TokenData> {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.authConfig.clientId,
    })

    if (this.authConfig.clientSecret) {
      params.set('client_secret', this.authConfig.clientSecret)
    }

    return this.requestToken(params)
  }

  /**
   * Refreshes an access token using a refresh token.
   *
   * @param refreshToken - The refresh token from a previous authentication
   * @returns New normalized token data
   * @throws Error if the refresh request fails (e.g., refresh token expired)
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenData> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.authConfig.clientId,
      refresh_token: refreshToken,
    })

    if (this.authConfig.clientSecret) {
      params.set('client_secret', this.authConfig.clientSecret)
    }

    return this.requestToken(params)
  }

  /**
   * Revokes an access or refresh token.
   * Silently succeeds if the token is already invalid.
   *
   * @param token - The token string to revoke
   */
  async revokeToken(token: string): Promise<void> {
    const url = `${this.baseUrl}${this.authConfig.tokenEndpoint}`

    const params = new URLSearchParams({
      token,
      client_id: this.authConfig.clientId,
    })

    if (this.authConfig.clientSecret) {
      params.set('client_secret', this.authConfig.clientSecret)
    }

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })
    } catch {
      // Revocation is best-effort — swallow network errors
    }
  }

  /**
   * Sends a token request to the OAuth2 endpoint.
   * Handles error responses and normalizes the token data.
   */
  private async requestToken(params: URLSearchParams): Promise<TokenData> {
    const url = `${this.baseUrl}${this.authConfig.tokenEndpoint}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    if (!response.ok) {
      const errorBody = await this.parseErrorBody(response)
      throw new OAuthError(
        errorBody.error ?? 'unknown_error',
        errorBody.error_description ?? `Token request failed with status ${String(response.status)}`,
        response.status,
      )
    }

    const raw = (await response.json()) as OAuthTokenResponse
    return normalizeTokenResponse(raw)
  }

  /**
   * Attempts to parse an OAuth2 error response body.
   */
  private async parseErrorBody(
    response: Response,
  ): Promise<{ error?: string; error_description?: string }> {
    try {
      return (await response.json()) as { error?: string; error_description?: string }
    } catch {
      return {
        error: 'unknown_error',
        error_description: `HTTP ${String(response.status)}: ${response.statusText}`,
      }
    }
  }
}

/**
 * Error class for OAuth2 authentication failures.
 * Provides structured access to the OAuth2 error code and description.
 */
export class OAuthError extends Error {
  /** OAuth2 error code (e.g., 'invalid_grant', 'invalid_client') */
  readonly errorCode: string
  /** HTTP status code from the token endpoint */
  readonly statusCode: number

  constructor(errorCode: string, message: string, statusCode: number) {
    super(message)
    this.name = 'OAuthError'
    this.errorCode = errorCode
    this.statusCode = statusCode
  }

  /** Whether this is an invalid grant error (wrong password, expired refresh token) */
  isInvalidGrant(): boolean {
    return this.errorCode === 'invalid_grant'
  }

  /** Whether this is an invalid client error (wrong client ID/secret) */
  isInvalidClient(): boolean {
    return this.errorCode === 'invalid_client'
  }
}
