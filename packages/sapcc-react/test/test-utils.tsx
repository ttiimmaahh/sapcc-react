import { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  render,
  renderHook,
  type RenderResult,
  type RenderOptions,
  type RenderHookOptions,
  type RenderHookResult,
} from '@testing-library/react'
import { SapccProvider, type SapccConfig } from '../src/provider'
import type { DeepPartial } from '../src/utils/deep-merge'
import { deepMerge } from '../src/utils/deep-merge'

/** Default test config for SapccProvider */
export const defaultTestConfig: SapccConfig = {
  backend: {
    occ: {
      baseUrl: 'https://test.example.com',
    },
  },
  site: {
    baseSite: 'test-site',
    language: 'en',
    currency: 'USD',
  },
}

/** Creates a fresh QueryClient for each test — no retries, instant GC */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Creates a wrapper component with SapccProvider + QueryClientProvider.
 * Optionally accepts config overrides to deep-merge with defaults.
 */
export function createWrapper(configOverrides?: DeepPartial<SapccConfig>) {
  const queryClient = createTestQueryClient()
  const config = configOverrides
    ? (deepMerge(
        defaultTestConfig as unknown as Record<string, unknown>,
        configOverrides as unknown as Record<string, unknown>,
      ) as unknown as SapccConfig)
    : defaultTestConfig

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <SapccProvider config={config}>{children}</SapccProvider>
      </QueryClientProvider>
    )
  }

  return { Wrapper, queryClient }
}

/**
 * Renders a React component with SapccProvider + QueryClientProvider.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { configOverrides?: DeepPartial<SapccConfig> },
): RenderResult & { queryClient: QueryClient } {
  const { configOverrides, ...renderOptions } = options ?? {}
  const { Wrapper, queryClient } = createWrapper(configOverrides)
  const result = render(ui, { wrapper: Wrapper, ...renderOptions })
  return { ...result, queryClient }
}

/**
 * Renders a React hook with SapccProvider + QueryClientProvider.
 */
export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, 'wrapper'> & {
    configOverrides?: DeepPartial<SapccConfig>
  },
): RenderHookResult<TResult, TProps> & { queryClient: QueryClient } {
  const { configOverrides, ...renderHookOptions } = options ?? {}
  const { Wrapper, queryClient } = createWrapper(configOverrides)
  const result = renderHook(hook, { wrapper: Wrapper, ...renderHookOptions })
  return { ...result, queryClient }
}
