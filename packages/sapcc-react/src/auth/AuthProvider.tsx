import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SapccContext, type SapccContextValue } from '../provider/SapccContext'
import { OccClient } from '../http/occ-client'
import type { TokenData, User, LoginCredentials, RegistrationData } from './auth.types'
import { AuthContext, type AuthContextValue } from './AuthContext'
import { OAuthService } from './oauth'
import { TokenInterceptor } from './token-interceptor'
import { createTokenStorage } from './token-storage'
import type { TokenStorage } from './auth.types'

/**
 * Internal auth provider that manages authentication state.
 *
 * This provider:
 * 1. Creates an auth-aware OccClient with Bearer token injection and 401 retry
 * 2. Manages token storage (localStorage in browser, in-memory on server)
 * 3. Provides login/logout/register actions via AuthContext
 * 4. Overrides the parent SapccContext with the auth-aware OccClient
 *
 * Automatically included by `<SapccProvider>` when `auth` config is present.
 *
 * @internal
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const parentContext = useContext(SapccContext)
  if (!parentContext) {
    throw new Error('AuthProvider must be used within a <SapccProvider>')
  }

  const { config } = parentContext
  const queryClient = useQueryClient()

  // Auth config is required for AuthProvider to function
  if (!config.auth) {
    throw new Error(
      'AuthProvider requires auth configuration. ' +
        'Provide auth: { clientId: "..." } in your SapccProvider config.',
    )
  }

  const authConfig = config.auth

  // ── Stable refs for services (created once) ───────────────────────────

  const storageRef = useRef<TokenStorage | null>(null)
  storageRef.current ??= createTokenStorage()
  const storage = storageRef.current

  const oauthServiceRef = useRef<OAuthService | null>(null)
  oauthServiceRef.current ??= new OAuthService(config.backend.occ.baseUrl, authConfig)
  const oauthService = oauthServiceRef.current

  // ── Auth state ────────────────────────────────────────────────────────

  const [token, setToken] = useState<TokenData | null>(() => storage.getToken())
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const isAuthenticated = token !== null

  // ── Token interceptor ────────────────────────────────────────────────

  const tokenInterceptorRef = useRef<TokenInterceptor | null>(null)
  tokenInterceptorRef.current ??= new TokenInterceptor({
    storage,
    oauthService,
    onAuthFailure: () => {
      // Clear auth state when refresh fails irrecoverably
      storage.removeToken()
      setToken(null)
      setUser(null)
    },
  })
  const tokenInterceptor = tokenInterceptorRef.current

  // ── Auth-aware OccClient ──────────────────────────────────────────────

  const authClient = useMemo(() => {
    const existingInterceptors = config.http.interceptors
    const authInterceptor = tokenInterceptor.createRequestInterceptor()

    return new OccClient({
      baseUrl: config.backend.occ.baseUrl,
      prefix: config.backend.occ.prefix,
      baseSite: config.site.baseSite,
      interceptors: [authInterceptor, ...existingInterceptors],
      retries: config.http.retries,
      logging: config.dev.logging,
      onUnauthorized: async () => {
        const newToken = await tokenInterceptor.handleUnauthorized()
        if (newToken) {
          setToken(newToken)
          return true
        }
        return false
      },
    })
  }, [config, tokenInterceptor])

  // ── Auth actions ──────────────────────────────────────────────────────

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      setIsLoading(true)
      try {
        const newToken = await oauthService.login(credentials)
        storage.setToken(newToken)
        setToken(newToken)

        // Fetch user profile after successful login
        try {
          const response = await authClient.get<User>('/users/current', { fields: 'DEFAULT' })
          setUser(response.data)
        } catch {
          // Login succeeded but user fetch failed — user is still authenticated
        }

        // Invalidate all queries so authenticated data is fetched
        void queryClient.invalidateQueries({ queryKey: ['sapcc'] })
      } finally {
        setIsLoading(false)
      }
    },
    [oauthService, storage, authClient, queryClient],
  )

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      const currentToken = storage.getToken()
      if (currentToken) {
        // Revoke token on server (best-effort)
        await oauthService.revokeToken(currentToken.accessToken)
        if (currentToken.refreshToken) {
          await oauthService.revokeToken(currentToken.refreshToken)
        }
      }
    } finally {
      storage.removeToken()
      setToken(null)
      setUser(null)
      setIsLoading(false)

      // Clear all cached data (may contain user-specific data)
      queryClient.clear()
    }
  }, [oauthService, storage, queryClient])

  const register = useCallback(
    async (data: RegistrationData): Promise<void> => {
      setIsLoading(true)
      try {
        // Register user via OCC API (anonymous request — no auth needed)
        await parentContext.client.post('/users', data)

        // Auto-login after successful registration
        await login({ username: data.uid, password: data.password })
      } finally {
        setIsLoading(false)
      }
    },
    [parentContext.client, login],
  )

  // ── Hydrate user on mount if token exists ─────────────────────────────

  useEffect(() => {
    if (token && !user) {
      authClient
        .get<User>('/users/current', { fields: 'DEFAULT' })
        .then((response) => {
          setUser(response.data)
        })
        .catch(() => {
          // Token may be invalid — clear it
          storage.removeToken()
          setToken(null)
        })
    }
    // Only run on mount (token from storage)
  }, []) // Intentionally run only on mount — hydrate user from stored token

  // ── Context values ────────────────────────────────────────────────────

  const authContextValue = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      user,
      token,
      isLoading,
      login,
      logout,
      register,
      setUser,
    }),
    [isAuthenticated, user, token, isLoading, login, logout, register],
  )

  // Override the parent SapccContext with the auth-aware client
  const sapccContextValue = useMemo<SapccContextValue>(
    () => ({
      config: parentContext.config,
      client: authClient,
    }),
    [parentContext.config, authClient],
  )

  return (
    <SapccContext.Provider value={sapccContextValue}>
      <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>
    </SapccContext.Provider>
  )
}
