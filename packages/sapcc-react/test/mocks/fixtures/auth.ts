import { faker } from '@faker-js/faker'
import type {
  OAuthTokenResponse,
  TokenData,
  User,
  LoginCredentials,
  RegistrationData,
} from '../../../src/auth/auth.types'

// ---------------------------------------------------------------------------
// OAuth Token Response (raw, from SAP Commerce Cloud)
// ---------------------------------------------------------------------------

/**
 * Creates a mock raw OAuth2 token response (snake_case, as returned by the server).
 */
export function createTokenResponse(
  overrides: Partial<OAuthTokenResponse> = {},
): OAuthTokenResponse {
  return {
    access_token: faker.string.alphanumeric(32),
    token_type: 'bearer',
    expires_in: 3600,
    scope: 'basic openid',
    refresh_token: faker.string.alphanumeric(32),
    ...overrides,
  }
}

/**
 * Creates a client_credentials token response (no refresh token).
 */
export function createClientCredentialsTokenResponse(
  overrides: Partial<OAuthTokenResponse> = {},
): OAuthTokenResponse {
  return createTokenResponse({
    refresh_token: undefined,
    scope: 'basic',
    ...overrides,
  })
}

// ---------------------------------------------------------------------------
// Token Data (normalized, internal format)
// ---------------------------------------------------------------------------

/**
 * Creates a mock normalized TokenData (camelCase, as used internally).
 */
export function createTokenData(overrides: Partial<TokenData> = {}): TokenData {
  return {
    accessToken: faker.string.alphanumeric(32),
    refreshToken: faker.string.alphanumeric(32),
    tokenType: 'bearer',
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    scope: 'basic openid',
    ...overrides,
  }
}

/**
 * Creates an expired token (expired 5 minutes ago).
 */
export function createExpiredTokenData(
  overrides: Partial<TokenData> = {},
): TokenData {
  return createTokenData({
    expiresAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    ...overrides,
  })
}

/**
 * Creates a token that's about to expire (within the default 10s margin).
 */
export function createAlmostExpiredTokenData(
  overrides: Partial<TokenData> = {},
): TokenData {
  return createTokenData({
    expiresAt: new Date(Date.now() + 5 * 1000).toISOString(), // 5s left, within 10s margin
    ...overrides,
  })
}

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

/**
 * Creates a mock User profile as returned by `/users/current`.
 */
export function createUser(overrides: Partial<User> = {}): User {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  const email = faker.internet.email({ firstName, lastName })

  return {
    uid: email,
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    titleCode: 'mr',
    title: 'Mr.',
    currency: { isocode: 'USD', name: 'US Dollar', active: true },
    language: { isocode: 'en', name: 'English', active: true },
    customerId: faker.string.numeric(8),
    displayUid: email,
    guest: false,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

/**
 * Creates mock login credentials.
 */
export function createLoginCredentials(
  overrides: Partial<LoginCredentials> = {},
): LoginCredentials {
  return {
    username: faker.internet.email(),
    password: faker.internet.password({ length: 12 }),
    ...overrides,
  }
}

/**
 * Creates mock registration data.
 */
export function createRegistrationData(
  overrides: Partial<RegistrationData> = {},
): RegistrationData {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()

  return {
    firstName,
    lastName,
    uid: faker.internet.email({ firstName, lastName }),
    password: faker.internet.password({ length: 12 }),
    titleCode: 'mr',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Error Responses
// ---------------------------------------------------------------------------

/** Standard OAuth2 invalid_grant error (wrong password, expired refresh token) */
export const INVALID_GRANT_ERROR = {
  error: 'invalid_grant',
  error_description: 'Bad credentials',
}

/** OAuth2 invalid_client error (wrong client ID/secret) */
export const INVALID_CLIENT_ERROR = {
  error: 'invalid_client',
  error_description: 'Bad client credentials',
}

/** OAuth2 expired refresh token error */
export const EXPIRED_REFRESH_TOKEN_ERROR = {
  error: 'invalid_grant',
  error_description: 'Token is not active',
}
