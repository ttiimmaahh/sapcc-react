import { useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { AuthContext } from '../auth/AuthContext'
import { userQueries } from './user.queries'
import type { User } from '../auth/auth.types'
import type {
  UpdateUserProfileParams,
  ChangePasswordParams,
  UseUserProfileOptions,
} from './user.types'

/**
 * Hook for managing the current user's profile with full CRUD capabilities.
 *
 * Provides the user profile query and mutations for:
 * - Updating profile (name, title, language, currency)
 * - Changing password
 * - Closing (deleting) the account
 *
 * Unlike `useUser()` in the auth module (which is read-only and syncs to
 * AuthContext), this hook lives in the user module and provides write
 * operations. Both hooks share the same underlying data but use different
 * query keys; mutations invalidate both.
 *
 * Must be used within a `<SapccProvider>` with auth configured.
 *
 * @param options - Optional fields level and enabled flag
 * @returns Profile query data and mutation objects
 *
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const {
 *     profile,
 *     updateProfile,
 *     changePassword,
 *     closeAccount,
 *   } = useUserProfile({ fields: 'FULL' })
 *
 *   if (profile.isLoading) return <p>Loading...</p>
 *   if (!profile.data) return <p>Not logged in</p>
 *
 *   return (
 *     <div>
 *       <h1>{profile.data.firstName} {profile.data.lastName}</h1>
 *       <button onClick={() => updateProfile.mutate({
 *         firstName: 'Jane',
 *         lastName: 'Doe',
 *       })}>
 *         Update Name
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useUserProfile(options: UseUserProfileOptions = {}) {
  const client = useSapccClient()
  const queryClient = useQueryClient()
  const authContext = useContext(AuthContext)

  const isAuthenticated = authContext?.isAuthenticated ?? false

  // ── Profile query ───────────────────────────────────────────────────

  const profile = useQuery(
    userQueries.profile(client, {
      ...options,
      enabled: (options.enabled ?? true) && isAuthenticated,
    }),
  )

  // ── Helper: invalidate both auth and user profile query keys ────────

  const invalidateProfile = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sapcc', 'user', 'profile'] }),
      queryClient.invalidateQueries({ queryKey: ['sapcc', 'auth', 'user'] }),
    ])
  }

  // ── Update profile mutation ─────────────────────────────────────────

  const updateProfile = useMutation({
    mutationFn: async (params: UpdateUserProfileParams) => {
      const response = await client.patch<User>('/users/current', params)
      return response.data
    },
    onSuccess: (updatedUser) => {
      // Optimistically update AuthContext
      if (authContext) {
        authContext.setUser(updatedUser)
      }
    },
    onSettled: async () => {
      await invalidateProfile()
    },
  })

  // ── Change password mutation ────────────────────────────────────────

  const changePassword = useMutation({
    mutationFn: async (params: ChangePasswordParams) => {
      await client.post<undefined>('/users/current/password', params)
    },
  })

  // ── Close account mutation ──────────────────────────────────────────

  const closeAccount = useMutation({
    mutationFn: async () => {
      await client.delete<undefined>('/users/current')
    },
    onSuccess: async () => {
      // Log out after account closure
      if (authContext) {
        await authContext.logout()
      }
    },
  })

  return {
    /** User profile query result */
    profile,
    /** Mutation to update the user profile (name, title, preferences) */
    updateProfile,
    /** Mutation to change the user's password */
    changePassword,
    /** Mutation to close (delete) the user's account */
    closeAccount,
  }
}
