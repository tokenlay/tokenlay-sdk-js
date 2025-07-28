import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,
  
  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // TypeScript ESLint recommended rules
      ...tseslint.configs.recommended.rules,
      
      // Custom rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Disable base ESLint rules that are covered by TypeScript
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },
  
  // Global ignores
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      '*.config.js',
      '*.config.ts',
    ],
  },
  
  // Environment settings
  {
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
      },
    },
  },
];