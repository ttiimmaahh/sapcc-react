import type { OccFields } from '../http/types'

// ─── OAuth2 Token Types ─────────────────────────────────────────────────────

/**
 * Raw OAuth2 token response from SAP Commerce Cloud.
 * Returned by `/authorizationserver/oauth/token`.
 */
export interface OAuthTokenResponse {
  /** OAuth2 access token */
  access_token: string
  /** OAuth2 token type (typically 'bearer') */
  token_type: string
  /** Token expiration time in seconds */
  expires_in: number
  /** Scope granted (e.g., 'basic openid') */
  scope?: string
  /** Refresh token for obtaining new access tokens */
  refresh_token?: string
}

/**
 * Processed token data stored internally by the auth system.
 * Converts raw OAuth response into a normalized, type-safe format.
 */
export interface TokenData {
  /** OAuth2 access token */
  accessToken: string
  /** Refresh token (if granted) */
  refreshToken?: string
  /** Token type (typically 'bearer') */
  tokenType: string
  /** ISO timestamp when the token expires */
  expiresAt: string
  /** Scope granted */
  scope?: string
}

// ─── OAuth2 Grant Types ─────────────────────────────────────────────────────

/** OAuth2 grant types supported by SAP Commerce Cloud */
export type OAuthGrantType = 'password' | 'client_credentials' | 'refresh_token'

// ─── User Authentication Types ──────────────────────────────────────────────

/**
 * Credentials for username/password login (Resource Owner Password Grant).
 */
export interface LoginCredentials {
  /** User email or UID */
  username: string
  /** User password */
  password: string
}

/**
 * Data required to register a new user account.
 */
export interface RegistrationData {
  /** User's first name */
  firstName: string
  /** User's last name */
  lastName: string
  /** User's email (used as login UID) */
  uid: string
  /** Desired password */
  password: string
  /** Title code (e.g., 'mr', 'ms') */
  titleCode?: string
}

// ─── User Profile Types ─────────────────────────────────────────────────────

/**
 * User profile data from SAP Commerce Cloud OCC `/users/current`.
 */
export interface User {
  /** User unique identifier (email) */
  uid: string
  /** Display name */
  name?: string
  /** First name */
  firstName?: string
  /** Last name */
  lastName?: string
  /** Title (e.g., 'Mr.', 'Ms.') */
  titleCode?: string
  /** Title display value */
  title?: string
  /** User currency preference */
  currency?: {
    isocode: string
    name?: string
    active?: boolean
  }
  /** User language preference */
  language?: {
    isocode: string
    name?: string
    active?: boolean
  }
  /** Customer ID (internal) */
  customerId?: string
  /** Display UID (may differ from uid) */
  displayUid?: string
  /** Whether the user is a guest checkout user */
  guest?: boolean
}

// ─── Auth State Types ───────────────────────────────────────────────────────

/**
 * Authentication state exposed by useAuth().
 */
export interface AuthState {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean
  /** Current user profile (null if not authenticated) */
  user: User | null
  /** Current token data (null if not authenticated) */
  token: TokenData | null
  /** Whether an auth operation (login/logout/register) is in progress */
  isLoading: boolean
}

// ─── Token Storage Types ────────────────────────────────────────────────────

/**
 * Interface for pluggable token storage adapters.
 * Implementations must handle their own environment detection.
 */
export interface TokenStorage {
  /** Retrieve stored token data, or null if none exists */
  getToken(): TokenData | null
  /** Store token data */
  setToken(token: TokenData): void
  /** Remove stored token data */
  removeToken(): void
}

// ─── Auth Config Types ──────────────────────────────────────────────────────

/**
 * Resolved auth configuration with all defaults applied.
 */
export interface ResolvedAuthConfig {
  /** OAuth2 client ID */
  clientId: string
  /** OAuth2 client secret (if required) */
  clientSecret?: string
  /** Token endpoint path */
  tokenEndpoint: string
}

// ─── Hook Option Types ──────────────────────────────────────────────────────

/**
 * Options for the useUser() hook.
 */
export interface UseUserOptions {
  /** OCC field level for the user profile response */
  fields?: OccFields
  /** Whether the query is enabled (default: true when authenticated) */
  enabled?: boolean
}

// ─── Auth Event Callbacks ───────────────────────────────────────────────────

/**
 * Callback invoked when authentication fails irrecoverably
 * (e.g., refresh token expired, no valid credentials).
 */
export type AuthFailureCallback = () => void
