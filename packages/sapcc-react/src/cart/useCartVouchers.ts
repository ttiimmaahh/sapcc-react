import { useCallback, useContext } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSapccClient } from '../provider/SapccProvider'
import { CartContext } from './CartContext'
import type { Cart } from './cart.types'

/**
 * Hook for applying and removing voucher codes on the active cart.
 *
 * Must be used within a `<SapccProvider>`.
 *
 * @returns Mutation functions for managing cart vouchers
 *
 * @example
 * ```tsx
 * function VoucherForm() {
 *   const { applyVoucher, removeVoucher } = useCartVouchers()
 *   const [code, setCode] = useState('')
 *
 *   return (
 *     <form onSubmit={(e) => { e.preventDefault(); applyVoucher.mutate(code) }}>
 *       <input value={code} onChange={(e) => setCode(e.target.value)} />
 *       <button disabled={applyVoucher.isPending}>Apply Voucher</button>
 *       {applyVoucher.isError && <p>Invalid voucher code</p>}
 *     </form>
 *   )
 * }
 * ```
 */
export function useCartVouchers() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error(
      'useCartVouchers must be used within a <SapccProvider>. ' +
        'Ensure your component tree is wrapped with <SapccProvider>.',
    )
  }

  const client = useSapccClient()
  const { userId, ensureCart, refreshCart, cart } = context

  const getCartPath = useCallback(
    (activeCart: Cart) => {
      const cartIdentifier =
        userId === 'anonymous' ? (activeCart.guid ?? activeCart.code) : activeCart.code
      return `/users/${encodeURIComponent(userId)}/carts/${encodeURIComponent(cartIdentifier)}`
    },
    [userId],
  )

  // ── Apply Voucher ──────────────────────────────────────────────────

  const applyVoucher = useMutation({
    mutationFn: async (voucherId: string) => {
      const activeCart = await ensureCart()
      await client.post(
        `${getCartPath(activeCart)}/vouchers`,
        undefined,
        { voucherId },
      )
    },
    onSuccess: async () => {
      await refreshCart()
    },
  })

  // ── Remove Voucher ─────────────────────────────────────────────────

  const removeVoucher = useMutation({
    mutationFn: async (voucherId: string) => {
      if (!cart) throw new Error('No active cart')
      await client.delete(
        `${getCartPath(cart)}/vouchers/${encodeURIComponent(voucherId)}`,
      )
    },
    onSuccess: async () => {
      await refreshCart()
    },
  })

  return {
    /** Apply a voucher code to the cart */
    applyVoucher,
    /** Remove a voucher from the cart */
    removeVoucher,
    /** Currently applied vouchers */
    vouchers: cart?.appliedVouchers ?? [],
  }
}
