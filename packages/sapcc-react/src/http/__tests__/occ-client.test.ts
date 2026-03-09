import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/mocks/server'
import { OccClient } from '../occ-client'
import { OccError } from '../occ-error'

const BASE_URL = 'https://test.example.com'
const PREFIX = '/occ/v2'
const SITE = 'test-site'

function createClient(overrides?: Partial<ConstructorParameters<typeof OccClient>[0]>) {
  return new OccClient({
    baseUrl: BASE_URL,
    prefix: PREFIX,
    baseSite: SITE,
    retries: 0,
    ...overrides,
  })
}

describe('OccClient', () => {
  it('sends a GET request and parses JSON', async () => {
    const client = createClient()
    const result = await client.get<{ languages: unknown[] }>('/languages')
    expect(result.status).toBe(200)
    expect(result.data.languages).toHaveLength(3)
  })

  it('sends a POST request with body', async () => {
    server.use(
      http.post(`${BASE_URL}${PREFIX}/${SITE}/cart/entries`, async ({ request }) => {
        const body = await request.json()
        return HttpResponse.json({ entry: body, statusCode: 'success' })
      }),
    )

    const client = createClient()
    const result = await client.post<{ statusCode: string }>('/cart/entries', {
      product: { code: '12345' },
      quantity: 1,
    })
    expect(result.status).toBe(200)
    expect(result.data.statusCode).toBe('success')
  })

  it('sends a PUT request with body', async () => {
    server.use(
      http.put(`${BASE_URL}${PREFIX}/${SITE}/cart/entries/0`, async ({ request }) => {
        const body = await request.json()
        return HttpResponse.json({ entry: body })
      }),
    )

    const client = createClient()
    const result = await client.put<{ entry: unknown }>('/cart/entries/0', { quantity: 5 })
    expect(result.status).toBe(200)
  })

  it('sends a PATCH request with body', async () => {
    server.use(
      http.patch(`${BASE_URL}${PREFIX}/${SITE}/users/current`, async ({ request }) => {
        const body = await request.json()
        return HttpResponse.json(body)
      }),
    )

    const client = createClient()
    const result = await client.patch<{ name: string }>('/users/current', { name: 'Test' })
    expect(result.status).toBe(200)
    expect(result.data.name).toBe('Test')
  })

  it('sends a DELETE request', async () => {
    server.use(
      http.delete(`${BASE_URL}${PREFIX}/${SITE}/cart/entries/0`, () => {
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const client = createClient()
    const result = await client.delete('/cart/entries/0')
    expect(result.status).toBe(204)
  })

  it('passes query params in GET', async () => {
    server.use(
      http.get(`${BASE_URL}${PREFIX}/${SITE}/products/search`, ({ request }) => {
        const url = new URL(request.url)
        return HttpResponse.json({
          query: url.searchParams.get('query'),
          page: url.searchParams.get('currentPage'),
        })
      }),
    )

    const client = createClient()
    const result = await client.get<{ query: string; page: string }>('/products/search', {
      query: 'camera',
      currentPage: 0,
    })
    expect(result.data.query).toBe('camera')
    expect(result.data.page).toBe('0')
  })

  it('throws OccError on HTTP error responses', async () => {
    server.use(
      http.get(`${BASE_URL}${PREFIX}/${SITE}/notfound`, () => {
        return HttpResponse.json(
          { errors: [{ type: 'NotFoundError', message: 'Not found' }] },
          { status: 404 },
        )
      }),
    )

    const client = createClient()
    await expect(client.get('/notfound')).rejects.toThrow(OccError)
    try {
      await client.get('/notfound')
    } catch (e) {
      expect(e).toBeInstanceOf(OccError)
      const occError = e as OccError
      expect(occError.status).toBe(404)
      expect(occError.isNotFound()).toBe(true)
    }
  })

  it('throws OccError with generic message for non-JSON error responses', async () => {
    server.use(
      http.get(`${BASE_URL}${PREFIX}/${SITE}/badjson`, () => {
        return new HttpResponse('Gateway Timeout', {
          status: 504,
          statusText: 'Gateway Timeout',
        })
      }),
    )

    const client = createClient()
    await expect(client.get('/badjson')).rejects.toThrow(OccError)
  })

  it('retries on network error', async () => {
    let attempt = 0
    server.use(
      http.get(`${BASE_URL}${PREFIX}/${SITE}/flaky`, () => {
        attempt++
        if (attempt === 1) {
          return HttpResponse.error()
        }
        return HttpResponse.json({ ok: true })
      }),
    )

    const client = createClient({ retries: 1 })
    const result = await client.get<{ ok: boolean }>('/flaky')
    expect(result.data.ok).toBe(true)
    expect(attempt).toBe(2)
  })

  it('does not retry on 4xx errors', async () => {
    let attempt = 0
    server.use(
      http.get(`${BASE_URL}${PREFIX}/${SITE}/bad`, () => {
        attempt++
        return HttpResponse.json(
          { errors: [{ type: 'BadRequest', message: 'Bad' }] },
          { status: 400 },
        )
      }),
    )

    const client = createClient({ retries: 2 })
    await expect(client.get('/bad')).rejects.toThrow(OccError)
    expect(attempt).toBe(1)
  })

  it('runs interceptors before sending request', async () => {
    server.use(
      http.get(`${BASE_URL}${PREFIX}/${SITE}/secure`, ({ request }) => {
        const auth = request.headers.get('Authorization')
        return HttpResponse.json({ auth })
      }),
    )

    const client = createClient({
      interceptors: [
        (config) => ({
          ...config,
          headers: { ...config.headers, Authorization: 'Bearer test-token' },
        }),
      ],
    })

    const result = await client.get<{ auth: string }>('/secure')
    expect(result.data.auth).toBe('Bearer test-token')
  })

  it('logs requests in dev mode', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(vi.fn())

    const client = createClient({ logging: true })
    await client.get('/languages')

    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining('[sapcc-react]'),
    )
    debugSpy.mockRestore()
  })

  it('handles 204 No Content', async () => {
    server.use(
      http.delete(`${BASE_URL}${PREFIX}/${SITE}/something`, () => {
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const client = createClient()
    const result = await client.delete('/something')
    expect(result.status).toBe(204)
    expect(result.data).toBeUndefined()
  })
})
