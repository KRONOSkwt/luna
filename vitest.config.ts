import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Test environment split: pure unit tests (node), component tests (jsdom).
// React Testing Library + jest-dom only load for the DOM project.
export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        test: {
          name: 'unit-node',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'component-dom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
  },
})