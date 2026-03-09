import { createContext } from 'react'
import type { TokenData, User, LoginCredentials, RegistrationData } from './auth.types'

/**
 * Internal auth context value shape.
 * Holds auth state and action dispatchers.
 */
export interface AuthContextValue {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean
  /** Current user profile (null if not authenticated) */
  user: User | null
  /** Current token data (null if not authenticated) */
  token: TokenData | null
  /** Whether an auth operation is in progress */
  isLoading: boolean
  /** Authenticate with username and password */
  login: (credentials: LoginCredentials) => Promise<void>
  /** End the current session */
  logout: () => Promise<void>
  /** Register a new user account and auto-login */
  register: (data: RegistrationData) => Promise<void>
  /** Update user profile in the auth state (used by useUser) */
  setUser: (user: User | null) => void
}

/**
 * React context for authentication state.
 * Internal only — consumers use the `useAuth()` hook.
 */
export const AuthContext = createContext<AuthContextValue | null>(null)
