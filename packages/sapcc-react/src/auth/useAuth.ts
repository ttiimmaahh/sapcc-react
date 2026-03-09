import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './AuthContext'

/**
 * Hook to access authentication state and actions.
 *
 * Must be used within a `<SapccProvider>` that has `auth` configuration.
 *
 * @returns Authentication state (isAuthenticated, user, token, isLoading)
 *          and actions (login, logout, register)
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { login, isAuthenticated, isLoading, user } = useAuth()
 *
 *   if (isAuthenticated) {
 *     return <p>Welcome, {user?.name}</p>
 *   }
 *
 *   return (
 *     <button
 *       disabled={isLoading}
 *       onClick={() => login({ username: 'user@example.com', password: 'secret' })}
 *     >
 *       Login
 *     </button>
 *   )
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error(
      'useAuth must be used within a <SapccProvider> with auth configuration. ' +
        'Ensure your SapccProvider config includes: auth: { clientId: "..." }',
    )
  }
  return context
}
