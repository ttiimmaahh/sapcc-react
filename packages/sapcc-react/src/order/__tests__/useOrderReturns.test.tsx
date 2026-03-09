import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { useAuth } from '../../auth/useAuth'
import { useOrderReturns } from '../useOrderReturns'
import { useCreateReturn } from '../useCreateReturn'
import { renderHookWithProviders } from '../../../test/test-utils'
import { resetOrderState } from '../../../test/mocks/handlers/orders'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

/** Helper: render auth + returns hooks, then login */
async function setupAuthenticatedReturns(
  options?: Parameters<typeof useOrderReturns>[0],
) {
  const { result, queryClient } = renderHookWithProviders(
    () => ({
      auth: useAuth(),
      returns: useOrderReturns(options),
      createReturn: useCreateReturn(),
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

  // Wait for returns query to settle
  await waitFor(() => {
    expect(result.current.returns.data).toBeDefined()
  })

  return { result, queryClient }
}

describe('useOrderReturns', () => {
  beforeEach(() => {
    localStorage.clear()
    resetOrderState()
  })

  it('returns no data when user is not authenticated', () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        returns: useOrderReturns(),
      }),
      { configOverrides: authConfig },
    )

    expect(result.current.returns.data).toBeUndefined()
    expect(result.current.returns.isFetching).toBe(false)
  })

  it('fetches return requests after login', async () => {
    const { result } = await setupAuthenticatedReturns()

    const data = result.current.returns.data
    expect(data?.returnRequests).toBeDefined()
    expect(data?.returnRequests).toHaveLength(2)
    expect(data?.pagination).toBeDefined()
  })

  it('returns expected return request fields', async () => {
    const { result } = await setupAuthenticatedReturns()

    const firstReturn = result.current.returns.data?.returnRequests?.[0]
    expect(firstReturn?.rma).toBe('RMA-001')
    expect(firstReturn?.status).toBe('PENDING')
    expect(firstReturn?.order?.code).toBe('ORDER-001')
  })

  it('respects the enabled option', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        returns: useOrderReturns({ enabled: false }),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'test@example.com',
        password: 'secret123',
      })
    })

    expect(result.current.returns.data).toBeUndefined()
    expect(result.current.returns.isFetching).toBe(false)
  })

  it('passes pagination parameters to the API', async () => {
    const { result } = await setupAuthenticatedReturns({
      pageSize: 1,
      currentPage: 0,
    })

    const data = result.current.returns.data
    expect(data?.returnRequests).toHaveLength(1)
    expect(data?.pagination?.pageSize).toBe(1)
  })
})

describe('useCreateReturn', () => {
  beforeEach(() => {
    localStorage.clear()
    resetOrderState()
  })

  it('creates a return request and invalidates queries', async () => {
    const { result } = await setupAuthenticatedReturns()

    // Initially 2 return requests
    expect(result.current.returns.data?.returnRequests).toHaveLength(2)

    // Create a new return
    let newReturn: Awaited<
      ReturnType<typeof result.current.createReturn.mutateAsync>
    > | null = null

    await act(async () => {
      newReturn = await result.current.createReturn.mutateAsync({
        orderCode: 'ORDER-003',
        returnRequestEntryInputs: [
          { orderEntryNumber: 0, quantity: 1 },
        ],
      })
    })

    expect(newReturn).toBeDefined()
    expect(newReturn!.rma).toBeDefined()
    expect(newReturn!.order?.code).toBe('ORDER-003')
    expect(newReturn!.status).toBe('PENDING')

    // After invalidation, return list should have 3 entries
    await waitFor(() => {
      expect(result.current.returns.data?.returnRequests).toHaveLength(3)
    })
  })

  it('throws error when required params are missing', async () => {
    const { result } = await setupAuthenticatedReturns()

    await expect(
      act(async () => {
        await result.current.createReturn.mutateAsync({
          orderCode: '',
          returnRequestEntryInputs: [
            { orderEntryNumber: 0, quantity: 1 },
          ],
        })
      }),
    ).rejects.toThrow()
  })
})
