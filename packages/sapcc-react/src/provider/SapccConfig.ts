import type { ComponentType } from 'react'
import type { DeepPartial } from '../utils/deep-merge'
import type { Interceptor } from '../http/types'

/**
 * User-facing configuration for the SapccProvider.
 * All optional fields have sensible defaults — consumers only override what they need.
 */
export interface SapccConfig {
  backend: {
    occ: {
      /** Base URL of the SAP Commerce Cloud instance */
      baseUrl: string
      /** API path prefix (default: '/occ/v2') */
      prefix?: string
    }
  }
  site: {
    /** Base site identifier (e.g., 'electronics-spa') */
    baseSite: string
    /** Default language ISO code (default: 'en') */
    language?: string
    /** Default currency ISO code (default: 'USD') */
    currency?: string
  }
  auth?: {
    /** OAuth2 client ID */
    clientId: string
    /** OAuth2 client secret (if required) */
    clientSecret?: string
    /** Token endpoint path (default: '/authorizationserver/oauth/token') */
    tokenEndpoint?: string
  }
  cms?: {
    /** Map of CMS component type UIDs to React components */
    componentMapping?: Record<string, ComponentType<never>>
    /** Fallback component rendered for unmapped CMS component types */
    fallbackComponent?: ComponentType<never>
  }
  http?: {
    /** Request interceptors (e.g., for custom auth or logging) */
    interceptors?: Interceptor[]
    /** Number of retries on network errors (default: 1) */
    retries?: number
  }
  dev?: {
    /** Enable request/response logging (default: false) */
    logging?: boolean
  }
}

/**
 * Fully resolved configuration with all defaults applied.
 * No optional fields — everything has a value.
 */
export interface ResolvedSapccConfig {
  backend: {
    occ: {
      baseUrl: string
      prefix: string
    }
  }
  site: {
    baseSite: string
    language: string
    currency: string
  }
  auth?: {
    clientId: string
    clientSecret?: string
    tokenEndpoint: string
  }
  cms: {
    componentMapping: Record<string, ComponentType<never>>
    fallbackComponent?: ComponentType<never>
  }
  http: {
    interceptors: Interceptor[]
    retries: number
  }
  dev: {
    logging: boolean
  }
}

/**
 * Default values for optional configuration fields.
 */
export const defaultConfig: DeepPartial<ResolvedSapccConfig> = {
  backend: {
    occ: {
      prefix: '/occ/v2',
    },
  },
  site: {
    language: 'en',
    currency: 'USD',
  },
  cms: {
    componentMapping: {},
  },
  http: {
    interceptors: [],
    retries: 1,
  },
  dev: {
    logging: false,
  },
}

/**
 * Resolves user config with defaults.
 * Uses deep merge so consumers only need to specify what they want to override.
 */
export function resolveConfig(userConfig: SapccConfig): ResolvedSapccConfig {
  return {
    backend: {
      occ: {
        baseUrl: userConfig.backend.occ.baseUrl,
        prefix: userConfig.backend.occ.prefix ?? '/occ/v2',
      },
    },
    site: {
      baseSite: userConfig.site.baseSite,
      language: userConfig.site.language ?? 'en',
      currency: userConfig.site.currency ?? 'USD',
    },
    auth: userConfig.auth
      ? {
          clientId: userConfig.auth.clientId,
          clientSecret: userConfig.auth.clientSecret,
          tokenEndpoint: userConfig.auth.tokenEndpoint ?? '/authorizationserver/oauth/token',
        }
      : undefined,
    cms: {
      componentMapping: userConfig.cms?.componentMapping ?? {},
      fallbackComponent: userConfig.cms?.fallbackComponent,
    },
    http: {
      interceptors: userConfig.http?.interceptors ?? [],
      retries: userConfig.http?.retries ?? 1,
    },
    dev: {
      logging: userConfig.dev?.logging ?? false,
    },
  }
}

export type { DeepPartial }
