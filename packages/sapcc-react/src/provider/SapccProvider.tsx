import { useMemo, useContext, type ReactNode } from 'react'
import type { SapccConfig } from './SapccConfig'
import { resolveConfig, type ResolvedSapccConfig } from './SapccConfig'
import { SapccContext, type SapccContextValue } from './SapccContext'
import { OccClient } from '../http/occ-client'
import { SiteContextProvider } from '../site-context/SiteContextProvider'
import { AuthProvider } from '../auth/AuthProvider'
import { CartProvider } from '../cart/CartProvider'

/**
 * Props for the SapccProvider component.
 */
export interface SapccProviderProps {
  /** SAP Commerce Cloud configuration */
  config: SapccConfig
  /** React children */
  children: ReactNode
}

/**
 * Root provider for sapcc-react.
 *
 * Wraps your application with the SAP Commerce Cloud context,
 * providing resolved configuration, a pre-configured HTTP client,
 * and reactive site-context state (language/currency switching).
 *
 * When `auth` configuration is provided, automatically wraps children
 * with an AuthProvider that manages OAuth2 tokens, Bearer header injection,
 * and 401 retry with token refresh.
 *
 * Must be placed inside a `<QueryClientProvider>` and above any
 * sapcc-react hooks in the component tree.
 *
 * @example
 * ```tsx
 * <QueryClientProvider client={queryClient}>
 *   <SapccProvider config={{
 *     backend: { occ: { baseUrl: 'https://api.mystore.com' } },
 *     site: { baseSite: 'electronics-spa' },
 *     auth: { clientId: 'mobile_android' },
 *   }}>
 *     <App />
 *   </SapccProvider>
 * </QueryClientProvider>
 * ```
 */
export function SapccProvider({ config, children }: SapccProviderProps) {
  const resolvedConfig = useMemo(() => resolveConfig(config), [config])

  const client = useMemo(
    () =>
      new OccClient({
        baseUrl: resolvedConfig.backend.occ.baseUrl,
        prefix: resolvedConfig.backend.occ.prefix,
        baseSite: resolvedConfig.site.baseSite,
        interceptors: resolvedConfig.http.interceptors,
        retries: resolvedConfig.http.retries,
        logging: resolvedConfig.dev.logging,
      }),
    [resolvedConfig],
  )

  const contextValue = useMemo<SapccContextValue>(
    () => ({ config: resolvedConfig, client }),
    [resolvedConfig, client],
  )

  // Conditionally wrap with AuthProvider when auth config is present.
  // AuthProvider overrides the SapccContext with an auth-aware OccClient.
  // CartProvider sits after AuthProvider so it can detect auth state.
  const content = resolvedConfig.auth ? (
    <AuthProvider>
      <CartProvider>
        <SiteContextProvider>{children}</SiteContextProvider>
      </CartProvider>
    </AuthProvider>
  ) : (
    <CartProvider>
      <SiteContextProvider>{children}</SiteContextProvider>
    </CartProvider>
  )

  return <SapccContext.Provider value={contextValue}>{content}</SapccContext.Provider>
}

/**
 * Hook to access the resolved SAP Commerce Cloud configuration.
 *
 * Must be used within a <SapccProvider>.
 *
 * @returns The fully resolved configuration with all defaults applied.
 */
export function useSapccConfig(): ResolvedSapccConfig {
  const context = useContext(SapccContext)
  if (!context) {
    throw new Error('useSapccConfig must be used within a <SapccProvider>')
  }
  return context.config
}

/**
 * Hook to access the OCC HTTP client instance.
 *
 * Must be used within a <SapccProvider>.
 *
 * @returns The pre-configured OccClient instance.
 */
export function useSapccClient(): OccClient {
  const context = useContext(SapccContext)
  if (!context) {
    throw new Error('useSapccClient must be used within a <SapccProvider>')
  }
  return context.client
}
