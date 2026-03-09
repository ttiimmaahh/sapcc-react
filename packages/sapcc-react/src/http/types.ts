/**
 * OCC field level — controls how much data the API returns.
 * 'BASIC' = minimal, 'DEFAULT' = standard, 'FULL' = everything.
 * Also accepts custom field strings like 'code,name,price(currencyIso,value)'.
 */
export type OccFields = 'DEFAULT' | 'BASIC' | 'FULL' | (string & {})

/**
 * HTTP method types supported by the OCC client.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Configuration for an OCC HTTP request.
 */
export interface OccRequestConfig {
  /** HTTP method */
  method: HttpMethod
  /** Request path (relative to base URL + prefix + baseSite) */
  path: string
  /** URL query parameters */
  params?: Record<string, string | number | boolean | undefined>
  /** Request body (will be JSON-stringified, or form-encoded if contentType is 'form') */
  body?: unknown
  /**
   * Content type for the request body.
   * - `'json'` (default) — `application/json`, body is JSON-stringified
   * - `'form'` — `application/x-www-form-urlencoded`, body is serialized via URLSearchParams
   */
  contentType?: 'json' | 'form'
  /** Additional request headers */
  headers?: Record<string, string>
  /** Whether this request requires authentication */
  authenticated?: boolean
}

/**
 * Typed response wrapper from the OCC client.
 */
export interface OccResponse<T> {
  /** Parsed response data */
  data: T
  /** HTTP status code */
  status: number
  /** Response headers */
  headers: Headers
}

/**
 * Shape of an OCC error response body.
 */
export interface OccErrorResponse {
  errors: OccErrorDetail[]
}

/**
 * Individual error detail from an OCC error response.
 */
export interface OccErrorDetail {
  /** Error type identifier (e.g., 'UnknownIdentifierError', 'InvalidTokenError') */
  type: string
  /** Human-readable error message */
  message: string
  /** Optional reason code */
  reason?: string
  /** Optional subject identifier (e.g., field name that caused the error) */
  subject?: string
  /** Optional subject type */
  subjectType?: string
}

/**
 * Request interceptor function type.
 * Interceptors can modify request config before the request is sent.
 */
export type Interceptor = (
  config: OccRequestConfig,
) => OccRequestConfig | Promise<OccRequestConfig>

/**
 * Handler invoked when a 401 Unauthorized response is received.
 * Should attempt to refresh the token and return true if successful.
 * Returning true causes the original request to be retried (with interceptors re-run).
 * Returning false or throwing causes the 401 error to propagate normally.
 */
export type UnauthorizedHandler = () => Promise<boolean>

/**
 * Configuration for the OCC client instance.
 */
export interface OccClientConfig {
  /** Base URL of the SAP Commerce Cloud instance */
  baseUrl: string
  /** API prefix (default: '/occ/v2') */
  prefix: string
  /** Base site identifier */
  baseSite: string
  /** Request interceptors */
  interceptors?: Interceptor[]
  /** Number of retries on network errors (default: 1) */
  retries?: number
  /** Enable dev mode logging */
  logging?: boolean
  /**
   * Handler called on 401 responses. If it returns true, the request is retried
   * with interceptors re-run (to pick up the refreshed token).
   */
  onUnauthorized?: UnauthorizedHandler
}
