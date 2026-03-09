import { useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { AuthContext } from '../auth/AuthContext'
import { userQueries } from './user.queries'
import type {
  NotificationPreference,
  UseNotificationPreferencesOptions,
} from './user.types'

/**
 * Hook for managing the current user's notification preferences.
 *
 * Provides the notification preferences query and a mutation to update
 * channel preferences (EMAIL, SMS, SITE_MESSAGE).
 *
 * Must be used within a `<SapccProvider>` with auth configured.
 *
 * @param options - Optional enabled flag
 * @returns Notification preferences query data and update mutation
 *
 * @example
 * ```tsx
 * function NotificationSettings() {
 *   const {
 *     notificationPreferences,
 *     updatePreferences,
 *   } = useNotificationPreferences()
 *
 *   if (notificationPreferences.isLoading) return <p>Loading...</p>
 *
 *   return (
 *     <ul>
 *       {notificationPreferences.data?.map((pref) => (
 *         <li key={pref.channel}>
 *           {pref.channel}: {pref.enabled ? 'On' : 'Off'}
 *         </li>
 *       ))}
 *       <button onClick={() => updatePreferences.mutate([
 *         { channel: 'EMAIL', value: 'user@example.com', enabled: true },
 *         { channel: 'SMS', value: '+15551234567', enabled: false },
 *       ])}>
 *         Save Preferences
 *       </button>
 *     </ul>
 *   )
 * }
 * ```
 */
export function useNotificationPreferences(
  options: UseNotificationPreferencesOptions = {},
) {
  const client = useSapccClient()
  const queryClient = useQueryClient()
  const authContext = useContext(AuthContext)

  const isAuthenticated = authContext?.isAuthenticated ?? false

  // ── Notification preferences query ───────────────────────────────────

  const notificationPreferences = useQuery(
    userQueries.notificationPreferences(client, {
      ...options,
      enabled: (options.enabled ?? true) && isAuthenticated,
    }),
  )

  // ── Helper: invalidate notification preferences ──────────────────────

  const invalidatePreferences = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['sapcc', 'user', 'notifications'],
    })
  }

  // ── Update preferences mutation ──────────────────────────────────────

  const updatePreferences = useMutation({
    mutationFn: async (preferences: NotificationPreference[]) => {
      await client.put<undefined>('/users/current/notificationpreferences', {
        preferences,
      })
    },
    onSettled: async () => {
      await invalidatePreferences()
    },
  })

  return {
    /** Notification preferences query result (array of NotificationPreference objects) */
    notificationPreferences,
    /** Mutation to update notification preferences (pass full array of preferences) */
    updatePreferences,
  }
}
