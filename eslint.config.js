import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintReact from '@eslint-react/eslint-plugin'

export default tseslint.config(
  // Global ignores
  {
    ignores: ['**/dist/', '**/coverage/', '**/node_modules/', '**/.turbo/'],
  },

  // Base JS recommended rules
  eslint.configs.recommended,

  // TypeScript strict rules (type-checked)
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // React + hooks rules
  eslintReact.configs['recommended-type-checked'],

  // Custom rule overrides
  {
    rules: {
      // Allow unused vars prefixed with _
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // We use empty interfaces for extensibility
      '@typescript-eslint/no-empty-object-type': 'off',
      // Allow non-null assertions in specific cases
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // We support React 18+, so useContext / <Context.Provider> are required
      '@eslint-react/no-use-context': 'off',
      '@eslint-react/no-context-provider': 'off',
    },
  },

  // Test file overrides — relax some rules
  {
    files: ['**/*.test.{ts,tsx}', '**/*.test-d.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
)
