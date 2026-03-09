import type { OccErrorDetail, OccErrorResponse } from './types'

/**
 * Custom error class for OCC API errors.
 * Provides typed access to OCC error details and helper methods
 * for checking error categories.
 */
export class OccError extends Error {
  /** HTTP status code */
  readonly status: number

  /** Primary error type (from first error in the array) */
  readonly type: string

  /** All error details from the OCC response */
  readonly errors: OccErrorDetail[]

  /** Original Response object (if available) */
  readonly originalResponse?: Response

  constructor(options: {
    status: number
    type: string
    message: string
    errors: OccErrorDetail[]
    originalResponse?: Response
  }) {
    super(options.message)
    this.name = 'OccError'
    this.status = options.status
    this.type = options.type
    this.errors = options.errors
    this.originalResponse = options.originalResponse
  }

  /**
   * Creates an OccError from a fetch Response and parsed error body.
   */
  static fromResponse(response: Response, body: OccErrorResponse): OccError {
    const firstError = body.errors[0]
    const message = firstError?.message ?? `OCC Error: ${String(response.status)}`
    const type = firstError?.type ?? 'UnknownError'

    return new OccError({
      status: response.status,
      type,
      message,
      errors: body.errors,
      originalResponse: response,
    })
  }

  /** Returns true if this is a 404 Not Found error */
  isNotFound(): boolean {
    return this.status === 404
  }

  /** Returns true if this is a 401 Unauthorized error */
  isAuth(): boolean {
    return this.status === 401
  }

  /** Returns true if this is a 403 Forbidden error */
  isForbidden(): boolean {
    return this.status === 403
  }

  /** Returns true if this is a validation error (400 Bad Request) */
  isValidation(): boolean {
    return this.status === 400
  }

  /** Returns true if this is a server error (5xx) */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600
  }
}
