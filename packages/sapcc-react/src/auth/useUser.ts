import { useQuery } from '@tanstack/react-query'
import { useContext, useEffect } from 'react'
import { useSapccClient } from '../provider/SapccProvider'
import { AuthContext } from './AuthContext'
import { authQueries } from './auth.queries'
import type { UseUserOptions } from './auth.types'

/**
 * Fetches the current authenticated user's profile via TanStack Query.
 *
 * Automatically disabled when the user is not authenticated.
 * When user data is successfully fetched, it's synced to the auth context
 * so `useAuth().user` reflects the latest profile.
 *
 * @param options - Optional fields level and enabled flag
 * @returns TanStack Query result with `User` data
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { data: user, isLoading } = useUser({ fields: 'FULL' })
 *
 *   if (isLoading) return <p>Loading...</p>
 *   if (!user) return <p>Not logged in</p>
 *
 *   return <p>Hello, {user.firstName} {user.lastName}</p>
 * }
 * ```
 */
export function useUser(options: UseUserOptions = {}) {
  const client = useSapccClient()
  const authContext = useContext(AuthContext)

  const isAuthenticated = authContext?.isAuthenticated ?? false

  const query = useQuery(
    authQueries.currentUser(client, {
      ...options,
      enabled: (options.enabled ?? true) && isAuthenticated,
    }),
  )

  // Sync fetched user data to auth context
  useEffect(() => {
    if (query.data && authContext) {
      authContext.setUser(query.data)
    }
  }, [query.data, authContext])

  return query
}
