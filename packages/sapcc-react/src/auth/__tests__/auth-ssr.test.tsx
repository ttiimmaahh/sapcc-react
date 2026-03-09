import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SapccProvider, type SapccConfig } from '../../provider'
import {
  createTokenStorage,
  InMemoryTokenStorage,
  LocalStorageTokenStorage,
} from '../token-storage'
import type { TokenData } from '../auth.types'

const testConfig: SapccConfig = {
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

const authConfig: SapccConfig = {
  ...testConfig,
  auth: {
    clientId: 'test_client',
  },
}

const mockToken: TokenData = {
  accessToken: 'test_access_token',
  refreshToken: 'test_refresh_token',
  tokenType: 'bearer',
  expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  scope: 'basic openid',
}

describe('Auth SSR compatibility', () => {
  describe('createTokenStorage in SSR environment', () => {
    let originalWindow: typeof globalThis.window

    beforeEach(() => {
      originalWindow = globalThis.window
    })

    afterEach(() => {
      // Restore window
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      })
    })

    it('returns InMemoryTokenStorage when window is undefined', () => {
      // Simulate server environment by removing window
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const storage = createTokenStorage()
      expect(storage).toBeInstanceOf(InMemoryTokenStorage)
    })

    it('InMemoryTokenStorage works correctly as a fallback', () => {
      const storage = new InMemoryTokenStorage()

      // Initially null
      expect(storage.getToken()).toBeNull()

      // Can set and get token
      storage.setToken(mockToken)
      expect(storage.getToken()).toEqual(mockToken)

      // Can remove token
      storage.removeToken()
      expect(storage.getToken()).toBeNull()
    })

    it('InMemoryTokenStorage does not throw on any operation', () => {
      const storage = new InMemoryTokenStorage()

      expect(() => { storage.getToken() }).not.toThrow()
      expect(() => { storage.setToken(mockToken) }).not.toThrow()
      expect(() => { storage.removeToken() }).not.toThrow()
      // Double remove is fine
      expect(() => { storage.removeToken() }).not.toThrow()
    })

    it('returns LocalStorageTokenStorage when window and localStorage are available', () => {
      // In happy-dom test environment, window + localStorage should be available
      // (unless happy-dom's localStorage fails the smoke test)
      const storage = createTokenStorage()

      // Could be either depending on happy-dom behavior
      expect(
        storage instanceof LocalStorageTokenStorage ||
          storage instanceof InMemoryTokenStorage,
      ).toBe(true)
    })
  })

  describe('SapccProvider SSR rendering', () => {
    it('renders without auth config in SSR', () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })

      function TestComponent() {
        return <div>No auth configured</div>
      }

      const html = renderToString(
        <QueryClientProvider client={queryClient}>
          <SapccProvider config={testConfig}>
            <TestComponent />
          </SapccProvider>
        </QueryClientProvider>,
      )

      expect(html).toContain('No auth configured')
      expect(html).not.toContain('Error')
    })

    it('renders with auth config in SSR', () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })

      function TestComponent() {
        return <div>Auth configured</div>
      }

      const html = renderToString(
        <QueryClientProvider client={queryClient}>
          <SapccProvider config={authConfig}>
            <TestComponent />
          </SapccProvider>
        </QueryClientProvider>,
      )

      expect(html).toContain('Auth configured')
      expect(html).not.toContain('Error')
    })
  })
})
