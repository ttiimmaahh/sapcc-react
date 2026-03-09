import { http, HttpResponse } from 'msw'
import {
  createTokenResponse,
  createUser,
  INVALID_GRANT_ERROR,
  INVALID_CLIENT_ERROR,
} from '../fixtures/auth'

const BASE_URL = 'https://test.example.com'
const OCC_BASE = `${BASE_URL}/occ/v2/test-site`
const TOKEN_URL = `${BASE_URL}/authorizationserver/oauth/token`

export const authHandlers = [
  // ── OAuth2 Token Endpoint ───────────────────────────────────────────────
  http.post(TOKEN_URL, async ({ request }) => {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const grantType = params.get('grant_type')

    // Password grant (login)
    if (grantType === 'password') {
      const username = params.get('username')
      const password = params.get('password')

      // Simulate invalid credentials
      if (password === 'wrong_password') {
        return HttpResponse.json(INVALID_GRANT_ERROR, { status: 400 })
      }

      // Simulate invalid client
      if (params.get('client_id') === 'invalid_client') {
        return HttpResponse.json(INVALID_CLIENT_ERROR, { status: 401 })
      }

      return HttpResponse.json(
        createTokenResponse({
          access_token: `access_${username ?? 'user'}`,
          refresh_token: `refresh_${username ?? 'user'}`,
        }),
      )
    }

    // Client credentials grant
    if (grantType === 'client_credentials') {
      return HttpResponse.json(
        createTokenResponse({
          access_token: 'client_access_token',
          refresh_token: undefined,
        }),
      )
    }

    // Refresh token grant
    if (grantType === 'refresh_token') {
      const refreshToken = params.get('refresh_token')

      // Simulate expired refresh token
      if (refreshToken === 'expired_refresh_token') {
        return HttpResponse.json(
          {
            error: 'invalid_grant',
            error_description: 'Token is not active',
          },
          { status: 400 },
        )
      }

      return HttpResponse.json(
        createTokenResponse({
          access_token: 'refreshed_access_token',
          refresh_token: 'refreshed_refresh_token',
        }),
      )
    }

    // Unknown grant type
    return HttpResponse.json(
      { error: 'unsupported_grant_type', error_description: 'Grant type not supported' },
      { status: 400 },
    )
  }),

  // ── Token Revocation ────────────────────────────────────────────────────
  // SAP CC uses the same token endpoint for revocation in some setups,
  // but we handle it as a POST that just succeeds
  // (revocation is best-effort in our implementation)

  // ── User Profile (GET /users/current) ──────────────────────────────────
  http.get(`${OCC_BASE}/users/current`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
    }

    const token = authHeader.replace('Bearer ', '')

    // Simulate expired/invalid token
    if (token === 'invalid_token' || token === 'expired_token') {
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
    }

    return HttpResponse.json(
      createUser({
        uid: 'test@example.com',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
      }),
    )
  }),

  // ── User Registration (POST /users) ────────────────────────────────────
  http.post(`${OCC_BASE}/users`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>

    // Simulate duplicate user
    if (body.uid === 'existing@example.com') {
      return HttpResponse.json(
        {
          errors: [
            {
              type: 'DuplicateUidError',
              message: 'User with this UID already exists.',
            },
          ],
        },
        { status: 400 },
      )
    }

    // Registration returns 201 (SAP CC returns empty JSON or no body)
    return HttpResponse.json({}, { status: 201 })
  }),
]
