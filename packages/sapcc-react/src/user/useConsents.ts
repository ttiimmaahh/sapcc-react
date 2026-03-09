import { useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { AuthContext } from '../auth/AuthContext'
import { userQueries } from './user.queries'
import type {
  ConsentTemplate,
  GiveConsentParams,
  UseConsentsOptions,
} from './user.types'

/**
 * Hook for managing the current user's consent preferences.
 *
 * Provides the consent templates query and mutations for:
 * - Giving consent to a template (form-encoded POST per Spartacus pattern)
 * - Withdrawing a previously given consent
 *
 * Must be used within a `<SapccProvider>` with auth configured.
 *
 * @param options - Optional fields level and enabled flag
 * @returns Consent templates query data and mutation objects
 *
 * @example
 * ```tsx
 * function ConsentManager() {
 *   const { consentTemplates, giveConsent, withdrawConsent } = useConsents()
 *
 *   if (consentTemplates.isLoading) return <p>Loading...</p>
 *
 *   return (
 *     <ul>
 *       {consentTemplates.data?.map((template) => (
 *         <li key={template.id}>
 *           {template.name}
 *           {template.currentConsent?.consentGivenDate
 *             && !template.currentConsent.consentWithdrawnDate ? (
 *             <button onClick={() =>
 *               withdrawConsent.mutate(template.currentConsent!.code)
 *             }>
 *               Withdraw
 *             </button>
 *           ) : (
 *             <button onClick={() =>
 *               giveConsent.mutate({
 *                 consentTemplateId: template.id,
 *                 consentTemplateVersion: template.version,
 *               })
 *             }>
 *               Accept
 *             </button>
 *           )}
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useConsents(options: UseConsentsOptions = {}) {
  const client = useSapccClient()
  const queryClient = useQueryClient()
  const authContext = useContext(AuthContext)

  const isAuthenticated = authContext?.isAuthenticated ?? false

  // ── Consent templates query ──────────────────────────────────────────

  const consentTemplates = useQuery(
    userQueries.consentTemplates(client, {
      ...options,
      enabled: (options.enabled ?? true) && isAuthenticated,
    }),
  )

  // ── Helper: invalidate consent templates ─────────────────────────────

  const invalidateConsents = async () => {
    await queryClient.invalidateQueries({ queryKey: ['sapcc', 'user', 'consents'] })
  }

  // ── Give consent mutation (form-encoded per Spartacus pattern) ───────

  const giveConsent = useMutation({
    mutationFn: async (params: GiveConsentParams) => {
      const response = await client.postForm<ConsentTemplate>(
        '/users/current/consents',
        {
          consentTemplateId: params.consentTemplateId,
          consentTemplateVersion: String(params.consentTemplateVersion),
        },
      )
      return response.data
    },
    onSettled: async () => {
      await invalidateConsents()
    },
  })

  // ── Withdraw consent mutation ────────────────────────────────────────

  const withdrawConsent = useMutation({
    mutationFn: async (consentCode: string) => {
      await client.delete<undefined>(`/users/current/consents/${consentCode}`)
    },
    onSettled: async () => {
      await invalidateConsents()
    },
  })

  return {
    /** Consent templates query result (array of ConsentTemplate objects with current consent status) */
    consentTemplates,
    /** Mutation to give consent to a template (form-encoded POST) */
    giveConsent,
    /** Mutation to withdraw a previously given consent by consent code */
    withdrawConsent,
  }
}
