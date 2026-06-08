import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // `server-only` throw a l'import en CSR. Pour tester un module
      // serveur en isolation, on remappe vers un stub vide. Le runtime
      // Next.js respecte toujours la garde a la build (l'alias ne
      // s'applique qu'au runner vitest).
      'server-only': path.resolve(__dirname, 'tests/stubs/server-only.ts'),
    },
  },
})
