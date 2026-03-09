// Auth domain — barrel export

// Hooks
export { useAuth } from './useAuth'
export { useUser } from './useUser'

// Provider (internal — wired into SapccProvider automatically)
export { AuthProvider } from './AuthProvider'

// Query factories
export { authQueries } from './auth.queries'

// Services
export { OAuthService, OAuthError, normalizeTokenResponse, isTokenExpired } from './oauth'

// Token storage
export {
  createTokenStorage,
  LocalStorageTokenStorage,
  InMemoryTokenStorage,
} from './token-storage'

// Token interceptor
export { TokenInterceptor } from './token-interceptor'

// Context (for advanced usage)
export { AuthContext } from './AuthContext'
export type { AuthContextValue } from './AuthContext'

// Types
export type {
  OAuthTokenResponse,
  TokenData,
  OAuthGrantType,
  LoginCredentials,
  RegistrationData,
  User,
  AuthState,
  TokenStorage,
  ResolvedAuthConfig,
  UseUserOptions,
  AuthFailureCallback,
} from './auth.types'

export type { TokenInterceptorConfig } from './token-interceptor'
