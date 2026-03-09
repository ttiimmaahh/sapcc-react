import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useAuth } from '../../auth/useAuth'
import { useAddresses } from '../useAddresses'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import { resetUserState } from '../../../test/mocks/handlers/user'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

/** Helper: render both auth and addresses hooks, then login */
async function setupAuthenticatedAddresses(
  options?: Parameters<typeof useAddresses>[0],
) {
  const { result, queryClient } = renderHookWithProviders(
    () => ({
      auth: useAuth(),
      addresses: useAddresses(options),
    }),
    { configOverrides: authConfig },
  )

  // Login
  await act(async () => {
    await result.current.auth.login({
      username: 'test@example.com',
      password: 'secret123',
    })
  })

  // Wait for addresses query to settle
  await waitFor(() => {
    expect(result.current.addresses.addresses.data).toBeDefined()
  })

  return { result, queryClient }
}

describe('useAddresses', () => {
  beforeEach(() => {
    localStorage.clear()
    resetUserState()
  })

  // ── Query tests ─────────────────────────────────────────────────────

  it('returns no data when user is not authenticated', () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        addresses: useAddresses(),
      }),
      { configOverrides: authConfig },
    )

    expect(result.current.addresses.addresses.data).toBeUndefined()
    expect(result.current.addresses.addresses.isFetching).toBe(false)
  })

  it('fetches addresses after login', async () => {
    const { result } = await setupAuthenticatedAddresses()

    const data = result.current.addresses.addresses.data
    expect(data).toHaveLength(2)
    expect(data?.[0]?.id).toBe('addr-1')
    expect(data?.[0]?.defaultAddress).toBe(true)
    expect(data?.[1]?.id).toBe('addr-2')
    expect(data?.[1]?.defaultAddress).toBe(false)
  })

  it('respects the enabled option', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        addresses: useAddresses({ enabled: false }),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'test@example.com',
        password: 'secret123',
      })
    })

    // Even after login, query should not fetch because enabled: false
    expect(result.current.addresses.addresses.data).toBeUndefined()
    expect(result.current.addresses.addresses.isFetching).toBe(false)
  })

  // ── Add address mutation tests ──────────────────────────────────────

  it('adds a new address', async () => {
    const { result } = await setupAuthenticatedAddresses()

    expect(result.current.addresses.addresses.data).toHaveLength(2)

    await act(async () => {
      await result.current.addresses.addAddress.mutateAsync({
        firstName: 'Jane',
        lastName: 'Doe',
        line1: '456 New Street',
        town: 'San Francisco',
        country: { isocode: 'US' },
        postalCode: '94102',
      })
    })

    // After mutation settles, the address list should be invalidated and refetched
    await waitFor(() => {
      expect(result.current.addresses.addresses.data).toHaveLength(3)
    })
  })

  it('returns the new address from addAddress', async () => {
    const { result } = await setupAuthenticatedAddresses()

    let newAddress: Awaited<
      ReturnType<typeof result.current.addresses.addAddress.mutateAsync>
    > | null = null

    await act(async () => {
      newAddress = await result.current.addresses.addAddress.mutateAsync({
        firstName: 'John',
        lastName: 'Smith',
        line1: '789 Oak Ave',
        town: 'Portland',
        country: { isocode: 'US' },
        postalCode: '97201',
      })
    })

    expect(newAddress).toBeDefined()
    expect(newAddress!.firstName).toBe('John')
    expect(newAddress!.lastName).toBe('Smith')
  })

  // ── Update address mutation tests ───────────────────────────────────

  it('updates an existing address', async () => {
    const { result } = await setupAuthenticatedAddresses()

    await act(async () => {
      await result.current.addresses.updateAddress.mutateAsync({
        addressId: 'addr-1',
        firstName: 'Updated',
        lastName: 'Name',
        line1: '123 Updated St',
        town: 'Updated City',
        country: { isocode: 'US' },
        postalCode: '90001',
      })
    })

    // After mutation settles, the refetched list should reflect the update
    await waitFor(() => {
      const addr = result.current.addresses.addresses.data?.find(
        (a) => a.id === 'addr-1',
      )
      expect(addr?.firstName).toBe('Updated')
    })
  })

  it('returns 404 for updating a non-existent address', async () => {
    const { result } = await setupAuthenticatedAddresses()

    let errorCaught = false

    await act(async () => {
      try {
        await result.current.addresses.updateAddress.mutateAsync({
          addressId: 'non-existent',
          firstName: 'Foo',
          lastName: 'Bar',
          line1: '1 Main St',
          town: 'Nowhere',
          country: { isocode: 'US' },
          postalCode: '00000',
        })
      } catch {
        errorCaught = true
      }
    })

    expect(errorCaught).toBe(true)
  })

  // ── Delete address mutation tests ───────────────────────────────────

  it('deletes an address', async () => {
    const { result } = await setupAuthenticatedAddresses()

    expect(result.current.addresses.addresses.data).toHaveLength(2)

    await act(async () => {
      await result.current.addresses.deleteAddress.mutateAsync('addr-1')
    })

    // After deletion, the refetched list should have one fewer address
    await waitFor(() => {
      expect(result.current.addresses.addresses.data).toHaveLength(1)
    })

    expect(
      result.current.addresses.addresses.data?.find((a) => a.id === 'addr-1'),
    ).toBeUndefined()
  })

  // ── Verify address mutation tests ───────────────────────────────────

  it('verifies an address and returns ACCEPT decision', async () => {
    const { result } = await setupAuthenticatedAddresses()

    let verificationResult: Awaited<
      ReturnType<typeof result.current.addresses.verifyAddress.mutateAsync>
    > | null = null

    await act(async () => {
      verificationResult =
        await result.current.addresses.verifyAddress.mutateAsync({
          firstName: 'Test',
          lastName: 'User',
          line1: '123 Main St',
          town: 'Springfield',
          country: { isocode: 'US' },
          postalCode: '62704',
        })
    })

    expect(verificationResult).toBeDefined()
    expect(verificationResult!.decision).toBe('ACCEPT')
  })

  it('handles verification with suggested addresses', async () => {
    // Override the verification handler to return suggestions
    server.use(
      http.post(
        'https://test.example.com/occ/v2/test-site/users/current/addresses/verification',
        () => {
          return HttpResponse.json({
            decision: 'REVIEW',
            suggestedAddresses: [
              {
                id: 'suggested-1',
                firstName: 'Test',
                lastName: 'User',
                line1: '123 Main Street', // corrected spelling
                town: 'Springfield',
                country: { isocode: 'US', name: 'United States' },
                postalCode: '62704',
              },
            ],
          })
        },
      ),
    )

    const { result } = await setupAuthenticatedAddresses()

    let verificationResult: Awaited<
      ReturnType<typeof result.current.addresses.verifyAddress.mutateAsync>
    > | null = null

    await act(async () => {
      verificationResult =
        await result.current.addresses.verifyAddress.mutateAsync({
          firstName: 'Test',
          lastName: 'User',
          line1: '123 Main St',
          town: 'Springfield',
          country: { isocode: 'US' },
          postalCode: '62704',
        })
    })

    expect(verificationResult!.decision).toBe('REVIEW')
    expect(verificationResult!.suggestedAddresses).toHaveLength(1)
    expect(verificationResult!.suggestedAddresses?.[0]?.line1).toBe(
      '123 Main Street',
    )
  })

  // ── Fields parameter test ───────────────────────────────────────────

  it('passes fields parameter to the API', async () => {
    let capturedFields: string | null = null

    server.use(
      http.get(
        'https://test.example.com/occ/v2/test-site/users/current/addresses',
        ({ request }) => {
          const url = new URL(request.url)
          capturedFields = url.searchParams.get('fields')

          return HttpResponse.json({
            addresses: [
              {
                id: 'addr-1',
                firstName: 'Test',
                lastName: 'User',
                line1: '123 Main St',
                town: 'Springfield',
                country: { isocode: 'US' },
                postalCode: '62704',
              },
            ],
          })
        },
      ),
    )

    await setupAuthenticatedAddresses({ fields: 'FULL' })

    expect(capturedFields).toBe('FULL')
  })
})
