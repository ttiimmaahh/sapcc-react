import type {
  OccClientConfig,
  OccRequestConfig,
  OccResponse,
  OccErrorResponse,
  Interceptor,
  UnauthorizedHandler,
} from './types'
import { OccError } from './occ-error'
import { buildRawUrl } from './occ-endpoints'

/**
 * HTTP client for SAP Commerce Cloud OCC REST APIs.
 *
 * Uses native `fetch` internally. Supports:
 * - Request interceptors (e.g., auth token injection)
 * - Automatic retry on network errors
 * - 401 Unauthorized handling with token refresh and request retry
 * - OCC error response parsing into typed OccError instances
 * - Dev mode request/response logging
 */
export class OccClient {
  private readonly config: OccClientConfig
  private readonly interceptors: Interceptor[]
  private readonly maxRetries: number
  private readonly onUnauthorized?: UnauthorizedHandler

  constructor(config: OccClientConfig) {
    this.config = config
    this.interceptors = config.interceptors ?? []
    this.maxRetries = config.retries ?? 1
    this.onUnauthorized = config.onUnauthorized
  }

  /**
   * Sends a GET request to the OCC API.
   */
  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<OccResponse<T>> {
    return this.request<T>({ method: 'GET', path, params })
  }

  /**
   * Sends a POST request to the OCC API.
   */
  async post<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<OccResponse<T>> {
    return this.request<T>({ method: 'POST', path, body, params })
  }

  /**
   * Sends a PUT request to the OCC API.
   */
  async put<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<OccResponse<T>> {
    return this.request<T>({ method: 'PUT', path, body, params })
  }

  /**
   * Sends a PATCH request to the OCC API.
   */
  async patch<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<OccResponse<T>> {
    return this.request<T>({ method: 'PATCH', path, body, params })
  }

  /**
   * Sends a DELETE request to the OCC API.
   */
  async delete<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<OccResponse<T>> {
    return this.request<T>({ method: 'DELETE', path, params })
  }

  /**
   * Core request method. Runs interceptors, sends fetch, handles errors and retries.
   */
  private async request<T>(
    initialConfig: OccRequestConfig,
    isRetryAfterAuth = false,
  ): Promise<OccResponse<T>> {
    // Run interceptor chain (re-run on retry to pick up refreshed token)
    let config = initialConfig
    for (const interceptor of this.interceptors) {
      config = await interceptor(config)
    }

    const url = buildRawUrl(
      this.config.baseUrl,
      this.config.prefix,
      this.config.baseSite,
      config.path,
      config.params,
    )

    const fetchOptions = this.buildFetchOptions(config)

    if (this.config.logging) {
      this.logRequest(config.method, url, fetchOptions)
    }

    return this.executeWithRetry<T>(url, fetchOptions, 0, initialConfig, isRetryAfterAuth)
  }

  /**
   * Executes fetch with retry logic for network errors and 401 handling.
   *
   * Retry strategy:
   * - Network errors (TypeError): retry up to maxRetries times
   * - 401 Unauthorized: call onUnauthorized handler, retry once if it succeeds
   * - Other HTTP errors: throw immediately (no retry)
   */
  private async executeWithRetry<T>(
    url: string,
    options: RequestInit,
    attempt: number,
    originalConfig: OccRequestConfig,
    isRetryAfterAuth: boolean,
  ): Promise<OccResponse<T>> {
    try {
      const response = await fetch(url, options)

      if (this.config.logging) {
        this.logResponse(url, response)
      }

      // Handle 401 with token refresh and retry (only once, not on auth retry)
      if (response.status === 401 && !isRetryAfterAuth && this.onUnauthorized) {
        const refreshed = await this.onUnauthorized()
        if (refreshed) {
          // Re-run the full request pipeline (interceptors will add new token)
          return await this.request<T>(originalConfig, true)
        }
      }

      if (!response.ok) {
        await this.handleErrorResponse(response)
      }

      // Handle empty response bodies (204 No Content, or responses with no body like voucher apply)
      const contentLength = response.headers.get('content-length')
      const hasBody = response.status !== 204 && contentLength !== '0'

      if (!hasBody) {
        return {
          data: undefined as T,
          status: response.status,
          headers: response.headers,
        }
      }

      // Try to parse JSON; some SAP CC endpoints return 200 with an empty body
      const text = await response.text()
      const data = (text ? JSON.parse(text) : undefined) as T

      return {
        data,
        status: response.status,
        headers: response.headers,
      }
    } catch (error) {
      // Only retry on network errors (TypeError: Failed to fetch), not OccErrors
      if (error instanceof TypeError && attempt < this.maxRetries) {
        return this.executeWithRetry<T>(url, options, attempt + 1, originalConfig, isRetryAfterAuth)
      }
      throw error
    }
  }

  /**
   * Parses error response body and throws an OccError.
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let body: OccErrorResponse
    try {
      body = (await response.json()) as OccErrorResponse
    } catch {
      // If body isn't valid JSON, create a generic error
      body = {
        errors: [
          {
            type: 'UnknownError',
            message: `HTTP ${String(response.status)}: ${response.statusText}`,
          },
        ],
      }
    }

    // Ensure errors array exists
    if (!Array.isArray(body.errors)) {
      body = {
        errors: [
          {
            type: 'UnknownError',
            message: `HTTP ${String(response.status)}: ${response.statusText}`,
          },
        ],
      }
    }

    throw OccError.fromResponse(response, body)
  }

  /**
   * Sends a POST request with `application/x-www-form-urlencoded` body.
   *
   * Used for OCC endpoints that require form-encoded data
   * (e.g., consent submission).
   */
  async postForm<T>(
    path: string,
    body: Record<string, string>,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<OccResponse<T>> {
    return this.request<T>({ method: 'POST', path, body, params, contentType: 'form' })
  }

  /**
   * Builds RequestInit options from our config.
   */
  private buildFetchOptions(config: OccRequestConfig): RequestInit {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...config.headers,
    }

    const isFormEncoded = config.contentType === 'form'

    // Add Content-Type for requests with body
    if (config.body !== undefined) {
      headers['Content-Type'] = isFormEncoded
        ? 'application/x-www-form-urlencoded'
        : 'application/json'
    }

    const options: RequestInit = {
      method: config.method,
      headers,
    }

    if (config.body !== undefined) {
      options.body = isFormEncoded
        ? new URLSearchParams(config.body as Record<string, string>).toString()
        : JSON.stringify(config.body)
    }

    return options
  }

  /**
   * Logs outgoing request details (dev mode only).
   */
  private logRequest(_method: string, url: string, options: RequestInit): void {
    console.debug(`[sapcc-react] ${options.method ?? 'GET'} ${url}`)
    if (options.body) {
      console.debug('[sapcc-react] Body:', options.body)
    }
  }

  /**
   * Logs incoming response details (dev mode only).
   */
  private logResponse(url: string, response: Response): void {
    console.debug(`[sapcc-react] ${String(response.status)} ${url}`)
  }
}
