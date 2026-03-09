import { http, HttpResponse } from 'msw'

const BASE_URL = 'https://test.example.com/occ/v2/test-site'

/**
 * Factory functions that return MSW handlers simulating various OCC error responses.
 * Use with `server.use(...)` in individual tests.
 */

export function unauthorized(path = '/languages') {
  return http.get(`${BASE_URL}${path}`, () => {
    return HttpResponse.json(
      {
        errors: [
          {
            type: 'InvalidTokenError',
            message: 'Invalid access token.',
          },
        ],
      },
      { status: 401 },
    )
  })
}

export function forbidden(path = '/languages') {
  return http.get(`${BASE_URL}${path}`, () => {
    return HttpResponse.json(
      {
        errors: [
          {
            type: 'ForbiddenError',
            message: 'Insufficient permissions.',
          },
        ],
      },
      { status: 403 },
    )
  })
}

export function notFound(path = '/languages') {
  return http.get(`${BASE_URL}${path}`, () => {
    return HttpResponse.json(
      {
        errors: [
          {
            type: 'UnknownIdentifierError',
            message: 'Resource not found.',
          },
        ],
      },
      { status: 404 },
    )
  })
}

export function serverError(path = '/languages') {
  return http.get(`${BASE_URL}${path}`, () => {
    return HttpResponse.json(
      {
        errors: [
          {
            type: 'InternalServerError',
            message: 'An unexpected error occurred.',
          },
        ],
      },
      { status: 500 },
    )
  })
}

export function networkError(path = '/languages') {
  return http.get(`${BASE_URL}${path}`, () => {
    return HttpResponse.error()
  })
}

export function timeout(path = '/languages') {
  return http.get(`${BASE_URL}${path}`, async () => {
    await new Promise((resolve) => setTimeout(resolve, 30000))
    return HttpResponse.json({ languages: [] })
  })
}
