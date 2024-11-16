import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    dir: 'tests',
    coverage: {
      provider: 'istanbul',
      reporter: ['html-spa', 'html'],
      exclude: ['bin', 'coverage', 'prisma', 'tests', 'views', '.git', 'node_modules', 'public', 'vitest.config.js']
    }
  }
})