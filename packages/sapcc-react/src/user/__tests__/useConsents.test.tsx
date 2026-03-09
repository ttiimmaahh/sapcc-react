import { describe, it, expect, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { useAuth } from '../../auth/useAuth'
import { useConsents } from '../useConsents'
import { renderHookWithProviders } from '../../../test/test-utils'
import { resetUserState } from '../../../test/mocks/handlers/user'
import type { SapccConfig } from '../../provider'

const authConfig: Partial<SapccConfig> = {
  auth: {
    clientId: 'test_client',
  },
}

/** Helper: render both auth and consents hooks, then login */
async function setupAuthenticatedConsents(
  options?: Parameters<typeof useConsents>[0],
) {
  const { result, queryClient } = renderHookWithProviders(
    () => ({
      auth: useAuth(),
      consents: useConsents(options),
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

  // Wait for consent templates query to settle
  await waitFor(() => {
    expect(result.current.consents.consentTemplates.data).toBeDefined()
  })

  return { result, queryClient }
}

describe('useConsents', () => {
  beforeEach(() => {
    localStorage.clear()
    resetUserState()
  })

  // ── Query tests ─────────────────────────────────────────────────────

  it('returns no data when user is not authenticated', () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        consents: useConsents(),
      }),
      { configOverrides: authConfig },
    )

    expect(result.current.consents.consentTemplates.data).toBeUndefined()
    expect(result.current.consents.consentTemplates.isFetching).toBe(false)
  })

  it('fetches consent templates after login', async () => {
    const { result } = await setupAuthenticatedConsents()

    const data = result.current.consents.consentTemplates.data
    expect(data).toHaveLength(2)
    expect(data?.[0]?.id).toBe('MARKETING_NEWSLETTER')
    expect(data?.[0]?.name).toBe('Marketing Newsletter')
    // First template has no consent
    expect(data?.[0]?.currentConsent).toBeUndefined()
    // Second template has an active consent
    expect(data?.[1]?.id).toBe('PERSONALIZATION')
    expect(data?.[1]?.currentConsent?.consentGivenDate).toBeDefined()
  })

  it('respects the enabled option', async () => {
    const { result } = renderHookWithProviders(
      () => ({
        auth: useAuth(),
        consents: useConsents({ enabled: false }),
      }),
      { configOverrides: authConfig },
    )

    await act(async () => {
      await result.current.auth.login({
        username: 'test@example.com',
        password: 'secret123',
      })
    })

    expect(result.current.consents.consentTemplates.data).toBeUndefined()
    expect(result.current.consents.consentTemplates.isFetching).toBe(false)
  })

  // ── Give consent mutation tests ─────────────────────────────────────

  it('gives consent to a template', async () => {
    const { result } = await setupAuthenticatedConsents()

    // MARKETING_NEWSLETTER initially has no consent
    expect(
      result.current.consents.consentTemplates.data?.[0]?.currentConsent,
    ).toBeUndefined()

    await act(async () => {
      await result.current.consents.giveConsent.mutateAsync({
        consentTemplateId: 'MARKETING_NEWSLETTER',
        consentTemplateVersion: 0,
      })
    })

    // After mutation settles, consent templates should be invalidated and refetched
    await waitFor(() => {
      const template = result.current.consents.consentTemplates.data?.find(
        (t) => t.id === 'MARKETING_NEWSLETTER',
      )
      expect(template?.currentConsent).toBeDefined()
      expect(template?.currentConsent?.consentGivenDate).toBeDefined()
    })
  })

  it('returns the consent template from giveConsent', async () => {
    const { result } = await setupAuthenticatedConsents()

    let consentResult: Awaited<
      ReturnType<typeof result.current.consents.giveConsent.mutateAsync>
    > | null = null

    await act(async () => {
      consentResult =
        await result.current.consents.giveConsent.mutateAsync({
          consentTemplateId: 'MARKETING_NEWSLETTER',
          consentTemplateVersion: 0,
        })
    })

    expect(consentResult).toBeDefined()
    expect(consentResult!.id).toBe('MARKETING_NEWSLETTER')
    expect(consentResult!.currentConsent).toBeDefined()
  })

  // ── Withdraw consent mutation tests ─────────────────────────────────

  it('withdraws a previously given consent', async () => {
    const { result } = await setupAuthenticatedConsents()

    // PERSONALIZATION initially has an active consent
    const template = result.current.consents.consentTemplates.data?.find(
      (t) => t.id === 'PERSONALIZATION',
    )
    expect(template?.currentConsent).toBeDefined()
    const consentCode = template!.currentConsent!.code

    await act(async () => {
      await result.current.consents.withdrawConsent.mutateAsync(consentCode)
    })

    // After withdrawal, the template should no longer have an active consent
    await waitFor(() => {
      const updated = result.current.consents.consentTemplates.data?.find(
        (t) => t.id === 'PERSONALIZATION',
      )
      expect(updated?.currentConsent).toBeUndefined()
    })
  })
})
