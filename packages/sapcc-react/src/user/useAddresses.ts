import { useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { AuthContext } from '../auth/AuthContext'
import { userQueries } from './user.queries'
import type {
  Address,
  CreateAddressParams,
  UpdateAddressParams,
  AddressVerificationResult,
  UseAddressesOptions,
} from './user.types'

/**
 * Hook for managing the current user's address book.
 *
 * Provides the addresses query and mutations for:
 * - Adding a new address
 * - Updating an existing address
 * - Deleting an address
 * - Verifying an address (postal validation)
 *
 * Must be used within a `<SapccProvider>` with auth configured.
 *
 * @param options - Optional fields level and enabled flag
 * @returns Addresses query data and mutation objects
 *
 * @example
 * ```tsx
 * function AddressBook() {
 *   const {
 *     addresses,
 *     addAddress,
 *     updateAddress,
 *     deleteAddress,
 *     verifyAddress,
 *   } = useAddresses({ fields: 'FULL' })
 *
 *   if (addresses.isLoading) return <p>Loading...</p>
 *
 *   return (
 *     <ul>
 *       {addresses.data?.map((addr) => (
 *         <li key={addr.id}>
 *           {addr.firstName} {addr.lastName} — {addr.line1}, {addr.town}
 *           <button onClick={() => deleteAddress.mutate(addr.id!)}>
 *             Remove
 *           </button>
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useAddresses(options: UseAddressesOptions = {}) {
  const client = useSapccClient()
  const queryClient = useQueryClient()
  const authContext = useContext(AuthContext)

  const isAuthenticated = authContext?.isAuthenticated ?? false

  // ── Addresses query ──────────────────────────────────────────────────

  const addresses = useQuery(
    userQueries.addresses(client, {
      ...options,
      enabled: (options.enabled ?? true) && isAuthenticated,
    }),
  )

  // ── Helper: invalidate address list ──────────────────────────────────

  const invalidateAddresses = async () => {
    await queryClient.invalidateQueries({ queryKey: ['sapcc', 'user', 'addresses'] })
  }

  // ── Add address mutation ─────────────────────────────────────────────

  const addAddress = useMutation({
    mutationFn: async (params: CreateAddressParams) => {
      const response = await client.post<Address>('/users/current/addresses', params)
      return response.data
    },
    onSettled: async () => {
      await invalidateAddresses()
    },
  })

  // ── Update address mutation ──────────────────────────────────────────

  const updateAddress = useMutation({
    mutationFn: async ({
      addressId,
      ...params
    }: UpdateAddressParams & { addressId: string }) => {
      const response = await client.patch<Address>(
        `/users/current/addresses/${addressId}`,
        params,
      )
      return response.data
    },
    onSettled: async () => {
      await invalidateAddresses()
    },
  })

  // ── Delete address mutation ──────────────────────────────────────────

  const deleteAddress = useMutation({
    mutationFn: async (addressId: string) => {
      await client.delete<undefined>(`/users/current/addresses/${addressId}`)
    },
    onSettled: async () => {
      await invalidateAddresses()
    },
  })

  // ── Verify address mutation ──────────────────────────────────────────

  const verifyAddress = useMutation({
    mutationFn: async (params: CreateAddressParams) => {
      const response = await client.post<AddressVerificationResult>(
        '/users/current/addresses/verification',
        params,
      )
      return response.data
    },
  })

  return {
    /** Address list query result (array of Address objects) */
    addresses,
    /** Mutation to add a new address to the address book */
    addAddress,
    /** Mutation to update an existing address (requires addressId) */
    updateAddress,
    /** Mutation to delete an address by ID */
    deleteAddress,
    /** Mutation to verify an address (returns verification result with decision and suggestions) */
    verifyAddress,
  }
}
