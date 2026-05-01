import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: './src/__tests__/globalSetup.ts',
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
  },
  resolve: {
    alias: {
      '@kanban/shared': '../shared/src/types.ts',
    },
  },
})
