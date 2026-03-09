import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, waitFor, cleanup, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useCart } from '../useCart'
import { useCartEntries } from '../useCartEntries'
import { renderHookWithProviders } from '../../../test/test-utils'
import { server } from '../../../test/mocks/server'
import { resetCartState } from '../../../test/mocks/handlers/cart'
import { createCart, createCartEntry, createCartModification } from '../../../test/mocks/fixtures/cart'

describe('useCartEntries', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCartState()
  })

  afterEach(() => {
    cleanup()
  })

  // Helper: renders both useCart and useCartEntries together
  function useCartWithEntries() {
    const cart = useCart()
    const entries = useCartEntries()
    return { cart, entries }
  }

  it('throws when used outside SapccProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useCartEntries())
    }).toThrow('useCartEntries must be used within a <SapccProvider>')

    consoleSpy.mockRestore()
  })

  describe('addEntry', () => {
    it('adds a product to an existing cart', async () => {
      // Pre-set an existing cart
      localStorage.setItem('sapcc_cart_guid', 'entry-test-guid')

      const cart = createCart({
        code: 'entry-cart',
        guid: 'entry-test-guid',
        entries: [createCartEntry({ entryNumber: 0 })],
      })

      server.use(
        http.get(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts/entry-test-guid',
          () => {
            return HttpResponse.json(cart)
          },
        ),
      )

      const { result } = renderHookWithProviders(() => useCartWithEntries())

      await waitFor(() => {
        expect(result.current.cart.cart).not.toBeNull()
      })

      await act(async () => {
        await result.current.entries.addEntry.mutateAsync({
          productCode: 'NEW-PRODUCT',
          quantity: 2,
        })
      })

      expect(result.current.entries.addEntry.isSuccess).toBe(true)
    })

    it('creates a cart if none exists before adding entry', async () => {
      const newCart = createCart({
        code: 'lazy-cart',
        guid: 'lazy-guid',
        entries: [],
      })

      server.use(
        http.post(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts',
          () => {
            return HttpResponse.json(newCart)
          },
        ),
      )

      const { result } = renderHookWithProviders(() => useCartWithEntries())

      await waitFor(() => {
        expect(result.current.cart.isInitialized).toBe(true)
      })

      expect(result.current.cart.cart).toBeNull()

      await act(async () => {
        await result.current.entries.addEntry.mutateAsync({
          productCode: 'FIRST-PRODUCT',
          quantity: 1,
        })
      })

      expect(result.current.entries.addEntry.isSuccess).toBe(true)
    })

    it('applies optimistic update on addEntry', async () => {
      localStorage.setItem('sapcc_cart_guid', 'optimistic-guid')

      const existingEntry = createCartEntry({
        entryNumber: 0,
        product: { code: 'EXIST', name: 'Existing', images: [] },
        quantity: 1,
      })

      const cart = createCart({
        code: 'opt-cart',
        guid: 'optimistic-guid',
        entries: [existingEntry],
        totalItems: 1,
        totalUnitCount: 1,
      })

      server.use(
        http.get(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts/optimistic-guid',
          () => {
            return HttpResponse.json(cart)
          },
        ),
        // Slow add entry response
        http.post(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts/optimistic-guid/entries',
          async () => {
            // Delay to verify optimistic update happens before response
            await new Promise((r) => setTimeout(r, 100))
            return HttpResponse.json(
              createCartModification({
                entry: createCartEntry({
                  entryNumber: 1,
                  product: { code: 'OPT-PROD', name: 'OPT-PROD', images: [] },
                  quantity: 3,
                }),
                quantity: 3,
                quantityAdded: 3,
              }),
            )
          },
        ),
      )

      const { result } = renderHookWithProviders(() => useCartWithEntries())

      await waitFor(() => {
        expect(result.current.cart.cart).not.toBeNull()
      })

      // Start mutation (don't await — check optimistic state)
      act(() => {
        result.current.entries.addEntry.mutate({
          productCode: 'OPT-PROD',
          quantity: 3,
        })
      })

      // Optimistic: entry should be added immediately
      await waitFor(() => {
        const entries = result.current.cart.cart?.entries ?? []
        expect(entries.length).toBeGreaterThanOrEqual(2)
      })

      // The optimistic entry should include the product code
      const optimisticEntries = result.current.cart.cart?.entries ?? []
      const optimisticEntry = optimisticEntries.find(
        (e) => e.product.code === 'OPT-PROD',
      )
      expect(optimisticEntry).toBeDefined()
      expect(optimisticEntry?.quantity).toBe(3)
    })
  })

  describe('updateEntry', () => {
    it('updates an entry quantity', async () => {
      localStorage.setItem('sapcc_cart_guid', 'update-guid')

      const cart = createCart({
        code: 'update-cart',
        guid: 'update-guid',
        entries: [
          createCartEntry({
            entryNumber: 0,
            quantity: 1,
            product: { code: 'UPD-PROD', name: 'Update Product', images: [] },
          }),
        ],
      })

      server.use(
        http.get(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts/update-guid',
          () => {
            return HttpResponse.json(cart)
          },
        ),
      )

      const { result } = renderHookWithProviders(() => useCartWithEntries())

      await waitFor(() => {
        expect(result.current.cart.cart).not.toBeNull()
      })

      await act(async () => {
        await result.current.entries.updateEntry.mutateAsync({
          entryNumber: 0,
          quantity: 5,
        })
      })

      expect(result.current.entries.updateEntry.isSuccess).toBe(true)
    })

    it('applies optimistic update on quantity change', async () => {
      localStorage.setItem('sapcc_cart_guid', 'opt-update-guid')

      const cart = createCart({
        code: 'opt-update-cart',
        guid: 'opt-update-guid',
        entries: [
          createCartEntry({
            entryNumber: 0,
            quantity: 1,
            product: { code: 'P1', name: 'Product 1', images: [] },
          }),
        ],
        totalUnitCount: 1,
      })

      server.use(
        http.get(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts/opt-update-guid',
          () => {
            return HttpResponse.json(cart)
          },
        ),
        http.patch(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts/opt-update-guid/entries/0',
          async () => {
            await new Promise((r) => setTimeout(r, 100))
            return HttpResponse.json(
              createCartModification({
                entry: createCartEntry({ entryNumber: 0, quantity: 10 }),
                quantity: 10,
                quantityAdded: 10,
              }),
            )
          },
        ),
      )

      const { result } = renderHookWithProviders(() => useCartWithEntries())

      await waitFor(() => {
        expect(result.current.cart.cart).not.toBeNull()
      })

      // Fire mutation without awaiting
      act(() => {
        result.current.entries.updateEntry.mutate({
          entryNumber: 0,
          quantity: 10,
        })
      })

      // Optimistically, the quantity should update immediately
      await waitFor(() => {
        const entry = result.current.cart.cart?.entries?.find(
          (e) => e.entryNumber === 0,
        )
        expect(entry?.quantity).toBe(10)
      })
    })
  })

  describe('removeEntry', () => {
    it('removes an entry from the cart', async () => {
      localStorage.setItem('sapcc_cart_guid', 'remove-guid')

      const cart = createCart({
        code: 'remove-cart',
        guid: 'remove-guid',
        entries: [
          createCartEntry({ entryNumber: 0 }),
          createCartEntry({ entryNumber: 1 }),
        ],
      })

      server.use(
        http.get(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts/remove-guid',
          () => {
            return HttpResponse.json(cart)
          },
        ),
      )

      const { result } = renderHookWithProviders(() => useCartWithEntries())

      await waitFor(() => {
        expect(result.current.cart.cart).not.toBeNull()
      })

      await act(async () => {
        await result.current.entries.removeEntry.mutateAsync(0)
      })

      expect(result.current.entries.removeEntry.isSuccess).toBe(true)
    })

    it('applies optimistic removal', async () => {
      localStorage.setItem('sapcc_cart_guid', 'opt-remove-guid')

      const cart = createCart({
        code: 'opt-remove-cart',
        guid: 'opt-remove-guid',
        entries: [
          createCartEntry({ entryNumber: 0, product: { code: 'A', name: 'A', images: [] } }),
          createCartEntry({ entryNumber: 1, product: { code: 'B', name: 'B', images: [] } }),
        ],
        totalItems: 2,
      })

      server.use(
        http.get(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts/opt-remove-guid',
          () => {
            return HttpResponse.json(cart)
          },
        ),
        http.delete(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts/opt-remove-guid/entries/0',
          async () => {
            await new Promise((r) => setTimeout(r, 100))
            return new HttpResponse(null, { status: 204 })
          },
        ),
      )

      const { result } = renderHookWithProviders(() => useCartWithEntries())

      await waitFor(() => {
        expect(result.current.cart.cart?.entries).toHaveLength(2)
      })

      // Fire remove without awaiting
      act(() => {
        result.current.entries.removeEntry.mutate(0)
      })

      // Optimistically, entry 0 should be removed
      await waitFor(() => {
        const entries = result.current.cart.cart?.entries ?? []
        expect(entries.every((e) => e.entryNumber !== 0)).toBe(true)
      })
    })
  })

  describe('rollback on error', () => {
    it('rolls back addEntry on server error', async () => {
      localStorage.setItem('sapcc_cart_guid', 'rollback-guid')

      const cart = createCart({
        code: 'rollback-cart',
        guid: 'rollback-guid',
        entries: [createCartEntry({ entryNumber: 0 })],
        totalItems: 1,
      })

      server.use(
        http.get(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts/rollback-guid',
          () => {
            return HttpResponse.json(cart)
          },
        ),
        http.post(
          'https://test.example.com/occ/v2/test-site/users/anonymous/carts/rollback-guid/entries',
          () => {
            return HttpResponse.json(
              { errors: [{ type: 'CartError', message: 'Out of stock' }] },
              { status: 400 },
            )
          },
        ),
      )

      const { result } = renderHookWithProviders(() => useCartWithEntries())

      await waitFor(() => {
        expect(result.current.cart.cart).not.toBeNull()
      })

      const originalEntryCount = result.current.cart.cart?.entries?.length ?? 0

      await act(async () => {
        try {
          await result.current.entries.addEntry.mutateAsync({
            productCode: 'FAIL-PROD',
            quantity: 1,
          })
        } catch {
          // Expected to fail
        }
      })

      // After error + rollback + refresh, entries should be back to original
      await waitFor(() => {
        expect(result.current.cart.cart?.entries?.length).toBe(originalEntryCount)
      })
    })
  })
})
