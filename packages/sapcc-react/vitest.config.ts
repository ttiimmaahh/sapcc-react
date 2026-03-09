import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.test-d.{ts,tsx}'],
    coverage: {
      provider: 'istanbul',
      include: ['src/**'],
      exclude: [
        'src/**/index.ts',
        'src/**/*.types.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.test-d.{ts,tsx}',
      ],
    },
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.test.json',
    },
  },
})
