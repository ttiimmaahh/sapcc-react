import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { useAuth } from '../../auth/useAuth'
import { useProductInterests } from '../useProductInterests'
import { renderHookWithProviders } from '../../../test/test-utils'
import { resetUserState } from '../../../test/mocks/handlers/user'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

/** Helper: render both auth and product interests hooks, then login */
async function setupAuthenticatedInterests(
  options?: Parameters<typeof useProductInterests>[0],
) {
  const { result, queryClient } = renderHookWithProviders(
    () => ({
      auth: useAuth(),
      interests: useProductInterests(options),
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

  // Wait for product interests query to settle
  await waitFor(() => {
    expect(result.current.interests.productInterests.data).toBeDefined()
  })

  return { result, queryClient }
}

describe('useProductInterests', () => {
  beforeEach(() => {
    localStorage.clear()
    resetUserState()
  })

  // ── Query tests ─────────────────────────────────────────────────────

  it('returns no data when user is not authenticated', () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        interests: useProductInterests(),
      }),
      { configOverrides: authConfig },
    )

    expect(
      result.current.interests.productInterests.data,
    ).toBeUndefined()
    expect(
      result.current.interests.productInterests.isFetching,
    ).toBe(false)
  })

  it('fetches product interests after login', async () => {
    const { result } = await setupAuthenticatedInterests()

    const data = result.current.interests.productInterests.data
    expect(data?.results).toBeDefined()
    expect(data?.results).toHaveLength(2)
    expect(data?.pagination).toBeDefined()
  })

  it('respects the enabled option', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        interests: useProductInterests({ enabled: false }),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'test@example.com',
        password: 'secret123',
      })
    })

    expect(
      result.current.interests.productInterests.data,
    ).toBeUndefined()
    expect(
      result.current.interests.productInterests.isFetching,
    ).toBe(false)
  })

  it('passes pagination parameters to the API', async () => {
    const { result } = await setupAuthenticatedInterests({
      pageSize: 5,
      currentPage: 0,
    })

    const data = result.current.interests.productInterests.data
    expect(data?.pagination?.pageSize).toBe(5)
    expect(data?.pagination?.currentPage).toBe(0)
  })

  // ── Add interest mutation tests ─────────────────────────────────────

  it('adds a product interest', async () => {
    const { result } = await setupAuthenticatedInterests()

    let newInterest: Awaited<
      ReturnType<typeof result.current.interests.addInterest.mutateAsync>
    > | null = null

    await act(async () => {
      newInterest =
        await result.current.interests.addInterest.mutateAsync({
          productCode: 'PRODUCT123',
          notificationType: 'BACK_IN_STOCK',
        })
    })

    expect(newInterest).toBeDefined()
    expect(newInterest!.product.code).toBe('PRODUCT123')
    expect(newInterest!.productInterestEntry?.[0]?.interestType).toBe(
      'BACK_IN_STOCK',
    )
  })

  // ── Remove interest mutation tests ──────────────────────────────────

  it('removes a product interest', async () => {
    const { result } = await setupAuthenticatedInterests()

    let succeeded = false

    await act(async () => {
      await result.current.interests.removeInterest.mutateAsync({
        productCode: 'PRODUCT456',
        notificationType: 'PRICE_REDUCTION',
      })
      succeeded = true
    })

    expect(succeeded).toBe(true)
  })
})
