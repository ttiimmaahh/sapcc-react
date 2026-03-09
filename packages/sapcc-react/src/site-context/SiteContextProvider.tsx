import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSapccConfig } from '../provider/SapccProvider'

/**
 * The shape of the site context state exposed to consumers.
 */
export interface SiteContextState {
  /** Current active language ISO code */
  language: string
  /** Current active currency ISO code */
  currency: string
  /** Current base site identifier */
  baseSite: string
  /** Update the active language and invalidate all sapcc queries */
  setLanguage: (isocode: string) => void
  /** Update the active currency and invalidate all sapcc queries */
  setCurrency: (isocode: string) => void
}

/**
 * Internal context for reactive site context state.
 */
const SiteContextContext = createContext<SiteContextState | null>(null)

/**
 * Provider for reactive language/currency switching.
 *
 * Wraps children with a state layer that allows runtime changes to
 * the active language and currency. When either changes, all sapcc
 * queries are invalidated so data is re-fetched in the new locale/currency.
 *
 * This is automatically included inside `<SapccProvider>` — you don't
 * need to add it yourself.
 *
 * @internal
 */
export function SiteContextProvider({ children }: { children: ReactNode }) {
  const config = useSapccConfig()
  const queryClient = useQueryClient()

  const [language, setLanguage] = useState(config.site.language)
  const [currency, setCurrency] = useState(config.site.currency)

  const handleSetLanguage = useCallback(
    (isocode: string) => {
      setLanguage(isocode)
      void queryClient.invalidateQueries({ queryKey: ['sapcc'] })
    },
    [queryClient, setLanguage],
  )

  const handleSetCurrency = useCallback(
    (isocode: string) => {
      setCurrency(isocode)
      void queryClient.invalidateQueries({ queryKey: ['sapcc'] })
    },
    [queryClient, setCurrency],
  )

  const value = useMemo<SiteContextState>(
    () => ({
      language,
      currency,
      baseSite: config.site.baseSite,
      setLanguage: handleSetLanguage,
      setCurrency: handleSetCurrency,
    }),
    [language, currency, config.site.baseSite, handleSetLanguage, handleSetCurrency],
  )

  return <SiteContextContext.Provider value={value}>{children}</SiteContextContext.Provider>
}

/**
 * Returns the current site context state including language, currency,
 * baseSite, and setters for switching language/currency at runtime.
 *
 * Must be used within a `<SapccProvider>`.
 *
 * @example
 * ```tsx
 * const { language, currency, setLanguage, setCurrency } = useSiteContext()
 * ```
 */
export function useSiteContext(): SiteContextState {
  const context = useContext(SiteContextContext)
  if (!context) {
    throw new Error('useSiteContext must be used within a <SapccProvider>')
  }
  return context
}
