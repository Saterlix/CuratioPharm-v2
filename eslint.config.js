import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'docs',
    'node_modules',
    '.vercel',
    '.chrome-audit-*',
    '*.cjs',
    'fix_*.js',
    'fix*.js',
    'patch_*.js',
    'server.js',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^(requireAdmin|[A-Z_])', caughtErrors: 'none' }],
      'react-refresh/only-export-components': 'warn',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
