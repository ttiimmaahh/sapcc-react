# sapcc-react

Headless React hooks for SAP Commerce Cloud (Hybris) OCC REST APIs.

**The React equivalent of what [Spartacus](https://sap.github.io/spartacus-docs/) provides for Angular** — but headless-first, with zero UI opinions. Bring your own design system; sapcc-react handles the data layer.

> **Status:** Pre-release (v0.0.0) — API surface is stabilizing but not yet published to npm.

## Features

- **Headless** — hooks and utilities only, no UI components. Use any design system.
- **TanStack Query v5** — built on `queryOptions()` factories for caching, deduplication, background refetching, and optimistic updates.
- **Zero runtime dependencies** — uses native `fetch` internally. Only peer dependencies are React and TanStack Query.
- **Tree-shakeable** — sub-path exports (`sapcc-react/product`, `sapcc-react/cart`, etc.) so you only bundle what you use.
- **Fully typed** — comprehensive TypeScript types for every OCC API response.
- **React 18 + 19** — compatible with both major versions.
- **ESM + CJS** — dual-format builds with correct `exports` map.
- **~9.6 kB** minified + brotlied (full bundle).

## Install

```bash
npm install sapcc-react @tanstack/react-query react react-dom
```

## Quick Start

Wrap your app with `SapccProvider` and a TanStack `QueryClientProvider`:

```tsx
import { SapccProvider } from 'sapcc-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SapccProvider
        config={{
          backend: { occ: { baseUrl: 'https://api.mystore.com' } },
          site: { baseSite: 'electronics-spa' },
        }}
      >
        <MyStorefront />
      </SapccProvider>
    </QueryClientProvider>
  )
}
```

Then use hooks anywhere in the tree:

```tsx
import { useProducts, useProduct } from 'sapcc-react/product'
import { useCart } from 'sapcc-react/cart'

function ProductList() {
  const { data, isLoading } = useProducts({ query: 'camera' })

  if (isLoading) return <p>Loading...</p>
  return (
    <ul>
      {data?.products?.map((p) => (
        <li key={p.code}>{p.name}</li>
      ))}
    </ul>
  )
}
```

## Modules

Each module is available as a sub-path export and through the main entry point.

| Module | Import | Hooks & Exports |
|--------|--------|-----------------|
| **Provider** | `sapcc-react` | `SapccProvider`, `useSapccConfig`, `useSapccClient` |
| **Site Context** | `sapcc-react/site-context` | `useLanguages`, `useCurrencies`, `useCountries`, `useRegions`, `useTitles`, `useCardTypes` |
| **Products** | `sapcc-react/product` | `useProducts`, `useProduct`, `useProductReviews`, `useSubmitReview`, `useProductSuggestions`, `useProductStock`, `useProductReferences` |
| **Auth** | `sapcc-react/auth` | `useAuth`, `useUser`, `AuthProvider`, `OAuthService`, `TokenInterceptor` |
| **Cart** | `sapcc-react/cart` | `useCart`, `useCartEntries`, `useCartVouchers`, `useCartPromotions`, `useSavedCarts`, `CartProvider` |
| **Checkout** | `sapcc-react/checkout` | `useDeliveryAddress`, `useDeliveryModes`, `usePaymentDetails`, `usePlaceOrder`, `useGuestCheckout` |
| **User Account** | `sapcc-react/user` | `useUserProfile`, `useAddresses`, `usePaymentMethods`, `useConsents`, `useNotificationPreferences`, `useProductInterests`, `useCustomerCoupons` |
| **Orders** | `sapcc-react/order` | `useOrders`, `useOrder`, `useOrderCancellation`, `useOrderReturns`, `useCreateReturn`, `useConsignmentTracking` |
| **CMS** | `sapcc-react/cms` | `useCmsPage`, `useCmsComponent`, `useCmsComponents`, `CmsPage`, `CmsSlot`, `CmsOutlet`, `getSlotByPosition`, `getSlotComponents` |

Every module also exports a `*Queries` factory (e.g. `productQueries`, `cartQueries`) for advanced TanStack Query patterns like prefetching and SSR.

## Authentication

sapcc-react supports the full OCC OAuth2 flow — login, registration, token refresh, and guest checkout:

```tsx
import { AuthProvider } from 'sapcc-react/auth'

function App() {
  return (
    <AuthProvider config={{ clientId: 'mobile_android', clientSecret: 'secret' }}>
      <MyStorefront />
    </AuthProvider>
  )
}

// In any component:
function LoginForm() {
  const { login, logout, isAuthenticated } = useAuth()

  const handleLogin = () => login({ userId: 'user@example.com', password: 'pass' })

  return isAuthenticated
    ? <button onClick={logout}>Logout</button>
    : <button onClick={handleLogin}>Login</button>
}
```

## Cart

Automatic cart lifecycle management — anonymous carts, cart merging on login, persistent cart IDs:

```tsx
import { CartProvider, useCart, useCartEntries } from 'sapcc-react/cart'

function App() {
  return (
    <CartProvider>
      <MyStorefront />
    </CartProvider>
  )
}

function AddToCart({ productCode }: { productCode: string }) {
  const { addEntry } = useCartEntries()

  return (
    <button onClick={() => addEntry({ productCode, quantity: 1 })}>
      Add to Cart
    </button>
  )
}
```

## CMS

Data hooks for CMS pages and components, plus structural rendering utilities:

```tsx
import { useCmsPage, CmsPage } from 'sapcc-react/cms'

// Option 1: Use the data hook directly
function MyPage() {
  const { data: page, isLoading } = useCmsPage({
    pageType: 'ContentPage',
    pageLabelOrId: '/homepage',
  })

  if (isLoading) return <p>Loading...</p>
  return <CmsPage page={page} />
}

// Option 2: Register component mappings for automatic rendering
<SapccProvider
  config={{
    backend: { occ: { baseUrl: 'https://api.mystore.com' } },
    site: { baseSite: 'electronics-spa' },
    cms: {
      componentMapping: {
        BannerComponent: MyBannerComponent,
        CMSParagraphComponent: MyParagraphComponent,
      },
    },
  }}
>
```

CMS rendering components (`CmsPage`, `CmsSlot`, `CmsOutlet`) are structural plumbing only — zero styling, fully headless. They map OCC CMS data to your React components via a type-code registry.

## Query Factories

Every module exposes `queryOptions()` factories for use beyond the built-in hooks — SSR prefetching, manual cache invalidation, or custom query compositions:

```tsx
import { productQueries } from 'sapcc-react/product'
import { useSapccClient } from 'sapcc-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

// Use the factory directly
function CustomProductHook(code: string) {
  const client = useSapccClient()
  return useQuery(productQueries.detail(client, code, { fields: 'FULL' }))
}

// Prefetch on the server (Next.js example)
async function prefetchProduct(queryClient: QueryClient, client: OccClient, code: string) {
  await queryClient.prefetchQuery(productQueries.detail(client, code))
}
```

## Requirements

- **React** 18.x or 19.x
- **TanStack Query** 5.x
- **Node.js** >= 20 (for development)

## Development

```bash
# Install dependencies
pnpm install

# Run tests (780 tests across 69 files)
pnpm test

# Type checking
pnpm typecheck

# Lint
pnpm lint

# Build
pnpm build

# Check bundle size
pnpm size

# Full validation (publint + are-the-types-wrong)
pnpm validate
```

## License

MIT
