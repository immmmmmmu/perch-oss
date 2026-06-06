import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/_internal/**', 'src/index.ts', 'src/**/*.d.ts'],
      thresholds: {
        // Wave 3 baseline. Defensive branches in parseFeed (rare formats) and
        // og url-guard (multiple IP families) keep branch coverage modest;
        // lines/statements gate the meaningful body coverage.
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 70,
      },
    },
  },
});
