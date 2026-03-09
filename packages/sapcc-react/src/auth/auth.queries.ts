import { queryOptions } from '@tanstack/react-query'
import type { OccClient } from '../http/occ-client'
import type { User, UseUserOptions } from './auth.types'

/** 30 seconds — user profile may change on login/logout */
const USER_STALE_TIME = 30 * 1000

/**
 * TanStack Query option factories for SAP Commerce Cloud auth endpoints.
 *
 * @example
 * ```ts
 * const client = useSapccClient()
 *
 * // Current user profile
 * const { data } = useQuery(authQueries.currentUser(client))
 *
 * // Server-side prefetch
 * await queryClient.prefetchQuery(authQueries.currentUser(client))
 * ```
 */
export const authQueries = {
  /** Fetch the current authenticated user's profile */
  currentUser: (client: OccClient, options: UseUserOptions = {}) =>
    queryOptions({
      queryKey: ['sapcc', 'auth', 'user', options.fields ?? 'DEFAULT'] as const,
      queryFn: async () => {
        const response = await client.get<User>('/users/current', {
          fields: options.fields,
        })
        return response.data
      },
      staleTime: USER_STALE_TIME,
      enabled: options.enabled ?? true,
    }),
} as const
