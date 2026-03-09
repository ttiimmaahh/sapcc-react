import { describe, it, expect } from 'vitest'
import { OccError } from '../occ-error'

describe('OccError', () => {
  it('creates from a Response and error body', () => {
    const response = new Response(null, { status: 404, statusText: 'Not Found' })
    const body = {
      errors: [{ type: 'UnknownIdentifierError', message: 'Product not found.' }],
    }

    const error = OccError.fromResponse(response, body)
    expect(error).toBeInstanceOf(OccError)
    expect(error).toBeInstanceOf(Error)
    expect(error.status).toBe(404)
    expect(error.type).toBe('UnknownIdentifierError')
    expect(error.message).toBe('Product not found.')
    expect(error.errors).toEqual(body.errors)
    expect(error.name).toBe('OccError')
  })

  it('falls back to status message when no errors in body', () => {
    const response = new Response(null, { status: 500, statusText: 'Internal Server Error' })
    const body = { errors: [] as any[] }

    const error = OccError.fromResponse(response, body)
    expect(error.message).toBe('OCC Error: 500')
    expect(error.type).toBe('UnknownError')
  })

  it('isNotFound returns true for 404', () => {
    const error = new OccError({ status: 404, type: 'NotFound', message: 'Not found', errors: [] })
    expect(error.isNotFound()).toBe(true)
    expect(error.isAuth()).toBe(false)
  })

  it('isAuth returns true for 401', () => {
    const error = new OccError({ status: 401, type: 'InvalidToken', message: 'Unauthorized', errors: [] })
    expect(error.isAuth()).toBe(true)
  })

  it('isForbidden returns true for 403', () => {
    const error = new OccError({ status: 403, type: 'Forbidden', message: 'Forbidden', errors: [] })
    expect(error.isForbidden()).toBe(true)
  })

  it('isValidation returns true for 400', () => {
    const error = new OccError({ status: 400, type: 'ValidationError', message: 'Bad request', errors: [] })
    expect(error.isValidation()).toBe(true)
  })

  it('isServerError returns true for 5xx', () => {
    const error500 = new OccError({ status: 500, type: 'ServerError', message: 'Server error', errors: [] })
    const error503 = new OccError({ status: 503, type: 'ServiceUnavailable', message: 'Unavailable', errors: [] })
    expect(error500.isServerError()).toBe(true)
    expect(error503.isServerError()).toBe(true)
  })

  it('handles multiple errors in array', () => {
    const response = new Response(null, { status: 400 })
    const body = {
      errors: [
        { type: 'ValidationError', message: 'Field A is required.' },
        { type: 'ValidationError', message: 'Field B must be a number.' },
      ],
    }
    const error = OccError.fromResponse(response, body)
    expect(error.errors).toHaveLength(2)
    expect(error.message).toBe('Field A is required.')
    expect(error.type).toBe('ValidationError')
  })
})
