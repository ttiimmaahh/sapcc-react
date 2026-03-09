# @sapcc-react

> Headless React hooks for SAP Commerce Cloud OCC APIs.

The React equivalent of what [Spartacus](https://sap.github.io/spartacus-docs/) provides for Angular.

## Status

**Work in progress** — not yet published to npm.

See [`docs/PROJECT_PLAN.md`](./docs/PROJECT_PLAN.md) for the full project plan.

## Install

```bash
npm install @sapcc-react @tanstack/react-query react react-dom
```

## Quick Start

```tsx
import { SapccProvider } from '@sapcc-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <SapccProvider
      config={{
        backend: { occ: { baseUrl: 'https://api.mystore.com' } },
        site: { baseSite: 'electronics-spa' },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </SapccProvider>
  )
}
```

## License

MIT
