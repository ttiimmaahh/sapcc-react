import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'site-context/index': 'src/site-context/index.ts',
    'product/index': 'src/product/index.ts',
    'auth/index': 'src/auth/index.ts',
    'cart/index': 'src/cart/index.ts',
    'checkout/index': 'src/checkout/index.ts',
    'user/index': 'src/user/index.ts',
    'order/index': 'src/order/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom', '@tanstack/react-query'],
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' }
  },
})
